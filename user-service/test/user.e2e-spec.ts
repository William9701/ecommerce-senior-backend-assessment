import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

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
      .send({ email: 'test251@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully');
  });

  it('/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({ email: 'test251@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    jwtToken = response.body.token; // Adjust this based on your actual response structure
    });

    it('/users/:id (GET)', async () => {
      console.log('JWT Token:', jwtToken); // Debugging
    
      const response = await request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${jwtToken}`);
    
      console.log('GET /users/:id Response:', response.body); // Debugging
      expect(response.status).toBe(200);
    });

  afterAll(async () => {
    await app.close();
  });
});
