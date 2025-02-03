import { Test, TestingModule } from '@nestjs/testing';
import { UserController, UserProfileController } from './user.controller';
import { UserService } from './user.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { ExecutionContext } from '@nestjs/common';

describe('UserController & UserProfileController', () => {
  let userController: UserController;
  let userProfileController: UserProfileController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController, UserProfileController],
      providers: [
        {
          provide: UserService,
          useValue: {
            register: jest.fn().mockResolvedValue({ message: 'User registered successfully' }),
            login: jest.fn().mockImplementation(async (email: string, password: string, res: Response) => {
              res.cookie('session_id', 'mocked_session_id', {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 3600000,
              });
              return res.json({ message: 'Login successful', token: 'mocked_jwt_token' });
            }),
            getUser: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
            logout: jest.fn().mockImplementation((sessionId: string, res: Response) => {
              res.clearCookie('session_id');
              return res.json({ message: 'User logged out successfully' });
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked_jwt_token'),
            verify: jest.fn().mockReturnValue({ userId: 1, email: 'test@example.com' }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue('mocked_value'),
            del: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn((context: ExecutionContext) => true),
          },
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userProfileController = module.get<UserProfileController>(UserProfileController);
    userService = module.get<UserService>(UserService);
  });

  it('should register a user', async () => {
    expect(await userController.register({ email: 'test@example.com', password: 'password123' }))
      .toEqual({ message: 'User registered successfully' });
  });

  it('should login and return a success message', async () => {
    const mockRes = {
      cookie: jest.fn(),
      json: jest.fn(),
    } as unknown as Response;

    await userController.login({ email: 'test@example.com', password: 'password123' }, mockRes);

    expect(mockRes.cookie).toHaveBeenCalledWith('session_id', expect.any(String), expect.objectContaining({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 3600000,
    }));

    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Login successful', token: 'mocked_jwt_token' });
  });

  it('should retrieve user details', async () => {
    expect(await userProfileController.getUser(1)).toEqual({ id: 1, email: 'test@example.com' });
  });

  it('should logout a user', async () => {
    const mockReq = { cookies: { session_id: 'mocked_session_id' } };
    const mockRes = { clearCookie: jest.fn(), json: jest.fn() } as unknown as Response;

    await userProfileController.logout(mockReq, mockRes);

    expect(mockRes.clearCookie).toHaveBeenCalledWith('session_id');
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'User logged out successfully' });
  });
});
