import request from 'supertest';
import app from '../src/app';
import { createTestUser, createTestRecord, deleteUsers } from './helpers/setup';

describe('Dashboard Endpoints', () => {
  const userIds: string[] = [];
  let analystToken: string;
  let viewerToken: string;
  let adminId: string;

  beforeAll(async () => {
    const [admin, analyst, viewer] = await Promise.all([
      createTestUser({ role: 'ADMIN' }),
      createTestUser({ role: 'ANALYST' }),
      createTestUser({ role: 'VIEWER' }),
    ]);

    analystToken = analyst.token;
    viewerToken = viewer.token;
    adminId = admin.id;
    userIds.push(admin.id, analyst.id, viewer.id);

    // Seed known records so we can assert on aggregated values
    await Promise.all([
      createTestRecord(admin.id, { type: 'INCOME', category: 'Salary', amount: 8000 }),
      createTestRecord(admin.id, { type: 'INCOME', category: 'Salary', amount: 2000 }),
      createTestRecord(admin.id, { type: 'EXPENSE', category: 'Rent', amount: 3000 }),
      createTestRecord(admin.id, { type: 'EXPENSE', category: 'Groceries', amount: 500 }),
    ]);
  });

  afterAll(async () => {
    await deleteUsers(userIds);
  });

  // ── Financial Summary ──────────────────────────────────────────────────────

  it('GET /summary returns totalIncome, totalExpenses, netBalance, recordCount (200)', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { totalIncome, totalExpenses, netBalance, recordCount } = res.body.data;

    expect(typeof totalIncome).toBe('number');
    expect(typeof totalExpenses).toBe('number');
    expect(typeof netBalance).toBe('number');
    expect(typeof recordCount).toBe('number');

    // Our seeded records for this user: income 10000, expenses 3500
    // Other test suites may have added records, so we assert gte not exact equality
    expect(totalIncome).toBeGreaterThanOrEqual(10000);
    expect(totalExpenses).toBeGreaterThanOrEqual(3500);
    expect(netBalance).toBeCloseTo(totalIncome - totalExpenses, 2);
  });

  it('GET /summary returns 403 for VIEWER (enforced by RBAC)', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // ── Category Breakdown ─────────────────────────────────────────────────────

  it('GET /category-summary returns category array with correct shape (200)', async () => {
    const res = await request(app)
      .get('/api/dashboard/category-summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.categories).toBeInstanceOf(Array);
    expect(res.body.data.categories.length).toBeGreaterThan(0);

    // Each entry must have the expected fields
    const first = res.body.data.categories[0];
    expect(first).toHaveProperty('category');
    expect(first).toHaveProperty('type');
    expect(first).toHaveProperty('total');
    expect(first).toHaveProperty('count');
  });

  // ── Monthly Trends ─────────────────────────────────────────────────────────

  it('GET /trends?months=3 returns trends array (200)', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends?months=3')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trends).toBeInstanceOf(Array);

    // Each trend entry must have month, income, expenses, net
    res.body.data.trends.forEach((t: Record<string, unknown>) => {
      expect(t).toHaveProperty('month');
      expect(t).toHaveProperty('income');
      expect(t).toHaveProperty('expenses');
      expect(t).toHaveProperty('net');
    });
  });

  // ── Recent Activity ────────────────────────────────────────────────────────

  it('GET /recent?limit=4 returns at most 4 records ordered by date desc (200)', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent?limit=4')
      .set('Authorization', `Bearer ${viewerToken}`); // all authenticated allowed

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.records).toBeInstanceOf(Array);
    expect(res.body.data.records.length).toBeLessThanOrEqual(4);

    // Records should be ordered by date descending
    const dates: string[] = res.body.data.records.map((r: { date: string }) => r.date);
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i - 1]).getTime()).toBeGreaterThanOrEqual(
        new Date(dates[i]).getTime(),
      );
    }
  });
});
