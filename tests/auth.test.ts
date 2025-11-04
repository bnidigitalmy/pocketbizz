import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TestAuthHelper, TestDbHelper } from './helpers';
import { cleanTestData } from './factories';

describe('Authentication API', () => {
  let app: express.Express;
  let authHelper: TestAuthHelper;

  beforeAll(async () => {
    // Import app setup (you'll need to export this from index.ts)
    const { setupTestApp } = await import('../server/index');
    app = setupTestApp ? setupTestApp() : express();
    authHelper = new TestAuthHelper(app);
    
    // Verify database connection
    const connected = await TestDbHelper.verifyConnection();
    expect(connected).toBe(true);
  });

  afterAll(async () => {
    await authHelper.cleanup();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: cleanTestData.email('register'),
        password: 'SecurePass123!',
        fullName: 'Test User',
        businessName: 'Test Business',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.fullName).toBe(userData.fullName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: cleanTestData.email('weakpass'),
        password: 'weak',
        fullName: 'Test User',
        businessName: 'Test Business',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Password');
    });

    it('should reject duplicate email registration', async () => {
      const email = cleanTestData.email('duplicate');
      const userData = {
        email,
        password: 'SecurePass123!',
        fullName: 'Test User',
        businessName: 'Test Business',
      };

      // First registration
      await request(app).post('/api/auth/register').send(userData).expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const { user, password } = await authHelper.createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: password,
        })
        .expect(200);

      expect(response.body.user.email).toBe(user.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const { user } = await authHelper.createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      const { cookie } = await authHelper.createAuthenticatedUser();
      const agent = authHelper.getAuthenticatedAgent(cookie);

      await agent.post('/api/auth/logout').expect(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user for authenticated request', async () => {
      const { user, cookie } = await authHelper.createAuthenticatedUser();
      const agent = authHelper.getAuthenticatedAgent(cookie);

      const response = await agent.get('/api/auth/me').expect(200);

      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });
  });
});
