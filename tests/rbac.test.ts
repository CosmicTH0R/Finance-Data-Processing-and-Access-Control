import request from 'supertest';
import app from '../src/app';
import { createTestUser, deleteUsers } from './helpers/setup';

describe('RBAC — Role-Based Access Control', () => {
  const userIds: string[] = [];
  let viewerToken: string;
  let analystToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const [viewer, analyst, admin] = await Promise.all([
      createTestUser({ role: 'VIEWER' }),
      createTestUser({ role: 'ANALYST' }),
      createTestUser({ role: 'ADMIN' }),
    ]);

    viewerToken = viewer.token;
    analystToken = analyst.token;
    adminToken = admin.token;

    userIds.push(viewer.id, analyst.id, admin.id);
  });

  afterAll(async () => {
    await deleteUsers(userIds);
  });

  // ── Authentication guard ───────────────────────────────────────────────────

  it('should return 401 UNAUTHORIZED when no token is provided', async () => {
    const res = await request(app).get('/api/records');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 UNAUTHORIZED for a malformed token', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', 'Bearer bad.token.value');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // ── Record creation — Admin only ───────────────────────────────────────────

  it('VIEWER should be blocked from creating a record (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 100, type: 'INCOME', category: 'Test', date: '2025-01-15T00:00:00.000Z' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('ANALYST should be blocked from creating a record (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: 100, type: 'INCOME', category: 'Test', date: '2025-01-15T00:00:00.000Z' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('ADMIN can create a record (201)', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 100,
        type: 'INCOME',
        category: 'RBAC Test',
        date: '2025-01-15T00:00:00.000Z',
        description: 'RBAC test record',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Record deleted via deleteUsers(adminId) in afterAll
  });

  // ── Dashboard — Analyst + Admin only ──────────────────────────────────────

  it('VIEWER should be blocked from dashboard summary (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('ANALYST can access dashboard summary (200)', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('VIEWER can read records list — open to all authenticated (200)', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
