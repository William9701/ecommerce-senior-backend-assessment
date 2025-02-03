import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { Response } from 'express';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedpass',
  createdAt: new Date(),
};

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let redisService: RedisService;
  let emailService: EmailService;
  let rabbitMQService: RabbitMQService;
  let monitoringService: MonitoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockReturnValue(mockUser),
            save: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mocked_jwt_token') },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn().mockResolvedValue(Promise.resolve('OK')),
            del: jest.fn().mockResolvedValue(Promise.resolve(1)),
          },
        },
        {
          provide: EmailService,
          useValue: { sendWelcomeEmail: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: RabbitMQService,
          useValue: {
            sendToQueue: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: MonitoringService,
          useValue: { increaseRegistrationCount: jest.fn(), increaseLoginCount: jest.fn() },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
    emailService = module.get<EmailService>(EmailService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
    monitoringService = module.get<MonitoringService>(MonitoringService);
  });

  it('should register a user and send a welcome email', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');
    jest.spyOn(rabbitMQService, 'sendToQueue').mockResolvedValue(Promise.resolve());
    jest.spyOn(monitoringService, 'increaseRegistrationCount');

    const result = await userService.register('Retest@example.com', 'Password123!');
    expect(result).toEqual({ message: 'User registered successfully' });
    expect(monitoringService.increaseRegistrationCount).toHaveBeenCalled();
  });

  it('should throw BadRequestException if email is already in use', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);
    await expect(userService.register('test@example.com', 'password123')).rejects.toThrow(BadRequestException);
  });

  it('should login a user and return a JWT token', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    jest.spyOn(redisService, 'set').mockResolvedValue(Promise.resolve('OK'));
    jest.spyOn(jwtService, 'sign').mockReturnValue('mocked_jwt_token');
    jest.spyOn(monitoringService, 'increaseLoginCount');

    const mockRes = {
      cookie: jest.fn(),
      json: jest.fn().mockReturnValue({ token: 'mocked_jwt_token' }),
    } as unknown as Response;

    const result = await userService.login('test@example.com', 'password123', mockRes);

    expect(result).toEqual({ token: 'mocked_jwt_token' });
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'session_id',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, maxAge: 3600000 })
    );
    expect(monitoringService.increaseLoginCount).toHaveBeenCalled();
  });

  it('should throw NotFoundException if user is not found during login', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
    await expect(userService.login('nonexistent@example.com', 'password123', {} as Response)).rejects.toThrow(NotFoundException);
  });

  it('should throw UnauthorizedException if password is incorrect', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
    await expect(userService.login('test@example.com', 'wrongpassword', {} as Response)).rejects.toThrow(UnauthorizedException);
  });

  it('should logout user by deleting session from Redis and clearing cookie', async () => {
    jest.spyOn(redisService, 'del').mockResolvedValue(Promise.resolve(1));
    const mockRes = { clearCookie: jest.fn(), json: jest.fn() } as unknown as Response;
    await userService.logout('session-id', mockRes);

    expect(redisService.del).toHaveBeenCalledWith('session:session-id');
    expect(mockRes.clearCookie).toHaveBeenCalledWith('session_id');
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
  });
});
