import request from 'supertest';
import app from '../src/app';
import { createTestUser, createTestRecord, deleteUsers, prisma } from './helpers/setup';

describe('Financial Records CRUD', () => {
  const userIds: string[] = [];
  let adminToken: string;
  let adminId: string;
  let viewerToken: string;
  let recordId: string;

  beforeAll(async () => {
    const [admin, viewer] = await Promise.all([
      createTestUser({ role: 'ADMIN' }),
      createTestUser({ role: 'VIEWER' }),
    ]);

    adminToken = admin.token;
    adminId = admin.id;
    viewerToken = viewer.token;
    userIds.push(admin.id, viewer.id);

    // Seed a record to use across GET / PATCH / DELETE tests
    const record = await createTestRecord(admin.id, {
      type: 'INCOME',
      category: 'Salary',
      amount: 5000,
    });
    recordId = record.id;
  });

  afterAll(async () => {
    await deleteUsers(userIds);
  });

  // ── Create Record ──────────────────────────────────────────────────────────

  it('Admin creates a record (201)', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 2500,
        type: 'EXPENSE',
        category: 'Rent',
        date: '2025-03-01T00:00:00.000Z',
        description: 'March rent',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record.category).toBe('Rent');
    expect(res.body.data.record.type).toBe('EXPENSE');
    // password should never appear
    expect(res.body.data.record.user?.password).toBeUndefined();
  });

  it('returns 400 VALIDATION_ERROR for negative amount', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: -100,
        type: 'INCOME',
        category: 'Test',
        date: '2025-01-15T00:00:00.000Z',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR for a future date', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 100,
        type: 'INCOME',
        category: 'Future',
        date: '2099-01-01T00:00:00.000Z',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ── List Records ───────────────────────────────────────────────────────────

  it('returns paginated list with correct pagination metadata (200)', async () => {
    const res = await request(app)
      .get('/api/records?page=1&limit=5')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.records).toBeInstanceOf(Array);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(5);
    expect(typeof res.body.data.pagination.total).toBe('number');
    expect(typeof res.body.data.pagination.totalPages).toBe('number');
  });

  it('filters records by type=INCOME', async () => {
    const res = await request(app)
      .get('/api/records?type=INCOME')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    const records: Array<{ type: string }> = res.body.data.records;
    records.forEach((r) => expect(r.type).toBe('INCOME'));
  });

  // ── Get Single Record ──────────────────────────────────────────────────────

  it('returns a single record by ID (200)', async () => {
    const res = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.record.id).toBe(recordId);
  });

  it('returns 400 BAD_REQUEST for a malformed (non-UUID) ID', async () => {
    const res = await request(app)
      .get('/api/records/not-a-valid-uuid')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 NOT_FOUND for a non-existent valid UUID', async () => {
    const res = await request(app)
      .get('/api/records/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // ── Update Record ──────────────────────────────────────────────────────────

  it('Admin updates a record (200)', async () => {
    const res = await request(app)
      .patch(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated salary description', amount: 6000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record.description).toBe('Updated salary description');
  });

  // ── Soft Delete Record ─────────────────────────────────────────────────────

  it('Admin soft-deletes a record (200) and subsequent GET returns 404', async () => {
    // Create a new record specifically for deletion
    const toDelete = await createTestRecord(adminId, { category: 'ToDelete', amount: 999 });

    // Soft delete it
    const delRes = await request(app)
      .delete(`/api/records/${toDelete.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);

    // Now GET the deleted record — should be 404
    const getRes = await request(app)
      .get(`/api/records/${toDelete.id}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(getRes.status).toBe(404);

    // Hard-delete the soft-deleted record for cleanup
    await prisma.financialRecord.delete({ where: { id: toDelete.id } });
  });

  // ── Export Records (CSV) ───────────────────────────────────────────────────

  it('Admin exports records as CSV (200, text/csv)', async () => {
    const res = await request(app)
      .get('/api/records/export')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('id,amount,type,category');
  });

  it('Viewer cannot export records (403)', async () => {
    const res = await request(app)
      .get('/api/records/export')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 400 VALIDATION_ERROR when endDate is before startDate', async () => {
    const res = await request(app)
      .get('/api/records?startDate=2025-06-01T00:00:00.000Z&endDate=2025-01-01T00:00:00.000Z')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
