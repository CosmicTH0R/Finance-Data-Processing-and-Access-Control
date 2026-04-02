import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { prisma, deleteUsers } from './helpers/setup';

describe('Auth Endpoints', () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await deleteUsers(createdUserIds);
  });

  // ── POST /api/auth/register ────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a JWT (201)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `register-${Date.now()}@test.com`,
          password: 'Test@1234',
          name: 'New User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe('string');
      // Password must never be returned
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.role).toBe('VIEWER'); // default role

      createdUserIds.push(res.body.data.user.id);
    });

    it('should return 409 CONFLICT when email is already registered', async () => {
      const email = `dup-${Date.now()}@test.com`;

      const first = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'Test@1234', name: 'First' });
      createdUserIds.push(first.body.data.user.id);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'Test@1234', name: 'Duplicate' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 VALIDATION_ERROR for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'Test@1234', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 VALIDATION_ERROR for password that is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `weak-${Date.now()}@test.com`, password: 'short', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    let loginEmail: string;

    beforeAll(async () => {
      loginEmail = `login-${Date.now()}@test.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: loginEmail, password: 'Test@1234', name: 'Login Tester' });
      createdUserIds.push(res.body.data.user.id);
    });

    it('should return a JWT on valid credentials (200)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: loginEmail, password: 'Test@1234' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 INVALID_CREDENTIALS on wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: loginEmail, password: 'WrongPass@999' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 INVALID_CREDENTIALS for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'Test@1234' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 403 ACCOUNT_INACTIVE for deactivated user', async () => {
      const inactiveEmail = `inactive-${Date.now()}@test.com`;
      const user = await prisma.user.create({
        data: {
          email: inactiveEmail,
          password: await bcrypt.hash('Test@1234', 10),
          name: 'Inactive User',
          status: 'INACTIVE',
        },
      });
      createdUserIds.push(user.id);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: inactiveEmail, password: 'Test@1234' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
    });
  });
});
