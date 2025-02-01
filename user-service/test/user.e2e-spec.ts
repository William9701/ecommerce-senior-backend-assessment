import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('User API (e2e)', () => {
  let app: INestApplication;
  let jwtToken;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/register')
      .send({ email: 'te@example.com', password: 'Password123!' }); // This password meets the criteria
    
    // Allow both new registration and existing user cases
    expect([201, 400]).toContain(response.status);
  
    if (response.status === 201) {
      expect(response.body.message).toBe('User registered successfully');
    } else {
      expect(response.body.message).toBe('Email already in use'); // Adjust this to match your API response
    }
  });
  
  it('/register (POST) with missing fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/register')
      .send({ email: 'test2550@example.com' }); // Missing password
    
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email and password are required');
  });
  

  it('/register (POST) with invalid email format', async () => {
    const response = await request(app.getHttpServer())
      .post('/register')
      .send({ email: 'invalid-email', password: 'password123' });
  
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid email format');
  });
  
  it('/register (POST) with weak password', async () => {
    const response = await request(app.getHttpServer())
      .post('/register')
      .send({ email: 'test2550@example.com', password: '123' });
  
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Password too weak. Must contain at least 8 characters, a number, and a special character.');
  });
  
 
  it('/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({ email: 'test2550@example.com', password: 'password123' });
  
    expect(response.status).toBe(201);
    jwtToken = response.body.token; // Ensure the token is correctly extracted
  });

 
  
  

  it('/users/:id (GET)', async () => {
    // 1. Login to get the session_id cookie
    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect([200, 201]).toContain(loginResponse.status); // Accept 200 or 201
    expect(loginResponse.headers['set-cookie']).toBeDefined(); // Ensure cookie is set
  
    // Extract the session_id from cookies
    const cookies = loginResponse.headers['set-cookie'][0].split(';');
    const sessionCookie = cookies.find((c) => c.startsWith('session_id='));
    expect(sessionCookie).toBeDefined();
  
    if (!sessionCookie) {
      throw new Error('Session cookie is not defined');
    }
  
    // 2. Use the session_id cookie to make an authenticated request
    const userResponse = await request(app.getHttpServer())
      .get('/users/1')
      .set('Cookie', sessionCookie); // Use session_id cookie for auth
  
    // 3. Validate the response
    expect(userResponse.status).toBe(200);
    expect(userResponse.body).toHaveProperty('id');
    expect(userResponse.body.id).toBe(1);
  });

  it('/users/:id (GET) with invalid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/1')
      .set('Authorization', 'Bearer invalid_token'); // Test with invalid token
  
    expect(response.status).toBe(401); // Unauthorized
    expect(response.body.message).toBe('Session expired or invalid Pls login to access this route');
  });
  
  

  afterAll(async () => {
    try {
      const dataSource: DataSource = app.get(DataSource); // Ensure this is your database source instance
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  
    await app.close();
  });
});
