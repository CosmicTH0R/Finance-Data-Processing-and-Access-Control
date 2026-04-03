import request from 'supertest';
import app from '../src/app';
import { createTestUser, deleteUsers } from './helpers/setup';

describe('User Management', () => {
  const userIds: string[] = [];
  let adminToken: string;
  let adminId: string;
  let viewerToken: string;
  let targetId: string;

  beforeAll(async () => {
    const [admin, viewer, target] = await Promise.all([
      createTestUser({ role: 'ADMIN' }),
      createTestUser({ role: 'VIEWER' }),
      createTestUser({ role: 'ANALYST' }),
    ]);

    adminToken = admin.token;
    adminId = admin.id;
    viewerToken = viewer.token;
    targetId = target.id;

    userIds.push(admin.id, viewer.id, target.id);
  });

  afterAll(async () => {
    await deleteUsers(userIds);
  });

  // ── GET /api/users/me ──────────────────────────────────────────────────────

  it('GET /me returns own profile without password (200)', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(adminId);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('GET /me returns 401 without token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  // ── GET /api/users ─────────────────────────────────────────────────────────

  it('Admin lists users with correct pagination metadata (200)', async () => {
    const res = await request(app)
      .get('/api/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toBeInstanceOf(Array);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(10);
    expect(typeof res.body.data.pagination.total).toBe('number');
    expect(typeof res.body.data.pagination.totalPages).toBe('number');
    // password must never appear in list
    res.body.data.users.forEach((u: Record<string, unknown>) => {
      expect(u['password']).toBeUndefined();
    });
  });

  it('Viewer cannot list users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it('Admin filters users by role=ANALYST (200)', async () => {
    const res = await request(app)
      .get('/api/users?role=ANALYST')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const users: Array<{ role: string }> = res.body.data.users;
    users.forEach((u) => expect(u.role).toBe('ANALYST'));
  });

  it('returns 400 VALIDATION_ERROR when limit exceeds 100', async () => {
    const res = await request(app)
      .get('/api/users?limit=200')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ── GET /api/users/:id ─────────────────────────────────────────────────────

  it('Admin fetches user by ID (200)', async () => {
    const res = await request(app)
      .get(`/api/users/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(targetId);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 404 NOT_FOUND for non-existent user UUID', async () => {
    const res = await request(app)
      .get('/api/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 VALIDATION_ERROR for malformed user ID', async () => {
    const res = await request(app)
      .get('/api/users/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ── PATCH /api/users/:id ───────────────────────────────────────────────────

  it('Admin updates user role (200)', async () => {
    const res = await request(app)
      .patch(`/api/users/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'VIEWER' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('VIEWER');
  });

  it('Admin updates user name (200)', async () => {
    const res = await request(app)
      .patch(`/api/users/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
  });

  it('returns 400 VALIDATION_ERROR for empty update body', async () => {
    const res = await request(app)
      .patch(`/api/users/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ── DELETE /api/users/:id ──────────────────────────────────────────────────

  it('Admin deactivates another user (200)', async () => {
    const extra = await createTestUser({ role: 'VIEWER' });
    userIds.push(extra.id);

    const res = await request(app)
      .delete(`/api/users/${extra.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.status).toBe('INACTIVE');
  });

  it('returns 400 SELF_DEACTIVATION when admin deactivates themselves', async () => {
    const res = await request(app)
      .delete(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SELF_DEACTIVATION');
  });

  it('returns 404 NOT_FOUND when deactivating non-existent user', async () => {
    const res = await request(app)
      .delete('/api/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
