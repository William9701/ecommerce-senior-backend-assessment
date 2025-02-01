import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { Response } from 'express';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
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
            del: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: EmailService,
          useValue: { sendWelcomeEmail: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
    emailService = module.get<EmailService>(EmailService);
  });

  // ✅ Test: User Registration
  it('should register a user and send a welcome email', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');
    jest
      .spyOn(emailService, 'sendWelcomeEmail')
      .mockResolvedValue(Promise.resolve());

    const result = await userService.register(
      'test@example.com',
      'password123',
    );
    expect(result).toEqual({ message: 'User registered successfully' });
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
  });

  it('should throw an error if email is already in use', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);

    await expect(
      userService.register('test@example.com', 'password123'),
    ).rejects.toThrow(BadRequestException);
  });

  // ✅ Test: User Login
  it('should login a user and return a JWT token', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    jest.spyOn(redisService, 'set').mockResolvedValue(Promise.resolve('OK'));
    jest.spyOn(jwtService, 'sign').mockReturnValue('mocked_jwt_token'); // Mock JWT generation

    const mockRes = {
      cookie: jest.fn(),
      json: jest.fn().mockReturnValue({ token: 'mocked_jwt_token' }), // Mock res.json()
    } as unknown as Response;

    const result = await userService.login(
      'test@example.com',
      'password123',
      mockRes,
    );

    expect(result).toEqual({ token: 'mocked_jwt_token' });
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'session_id',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        maxAge: 3600000,
      }),
    );
    expect(mockRes.json).toHaveBeenCalledWith({ token: 'mocked_jwt_token' }); // Check that json() is called with the expected value
  });

  it('should throw an error if user is not found during login', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

    await expect(
      userService.login('test@example.com', 'password123', {} as Response),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw an error if password is incorrect', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

    await expect(
      userService.login('test@example.com', 'wrongpassword', {} as Response),
    ).rejects.toThrow(BadRequestException);
  });

  // ✅ Test: Get User By ID
  it('should return user details', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);

    const result = await userService.getUser(1);
    expect(result).toEqual(mockUser);
  });

  it('should throw an error if user is not found', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

    await expect(userService.getUser(1)).rejects.toThrow(NotFoundException);
  });

  // ✅ Test: Logout User
  it('should log out user by deleting session and clearing cookie', async () => {
    jest.spyOn(redisService, 'del').mockResolvedValue(Promise.resolve(1));

    const mockRes = {
      clearCookie: jest.fn(),
      json: jest.fn().mockReturnValue({ message: 'Logged out successfully' }), // ✅ Ensure json returns a value
    } as unknown as Response;

    const result = await userService.logout('session123', mockRes);

    expect(redisService.del).toHaveBeenCalledWith('session:session123');
    expect(mockRes.clearCookie).toHaveBeenCalledWith('session_id');
    expect(result).toEqual({ message: 'Logged out successfully' });
  });

  it('should handle errors when Redis fails during logout', async () => {
    jest
      .spyOn(redisService, 'del')
      .mockRejectedValue(new InternalServerErrorException('Redis error'));

    const mockRes = {
      clearCookie: jest.fn(),
      json: jest.fn(),
    } as unknown as Response;

    await expect(userService.logout('session123', mockRes)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
