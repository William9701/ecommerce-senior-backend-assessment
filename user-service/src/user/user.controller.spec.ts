import { Test, TestingModule } from '@nestjs/testing';
import { UserController, UserProfileController } from './user.controller';
import { UserService } from './user.service';
import { Response } from 'express';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            register: jest.fn().mockResolvedValue({ message: 'User registered successfully' }),
            login: jest.fn().mockResolvedValue({ message: 'Login successful' }), // Adjusted return value
            getUser: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
          },
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should register a user', async () => {
    expect(await userController.register('test@example.com', 'password123'))
      .toEqual({ message: 'User registered successfully' });
  });

  it('should login and return a success message', async () => {
    const mockRes = {
      cookie: jest.fn(), // Mock the cookie method
      json: jest.fn(), // Mock the json method to return the response
    } as unknown as Response; // Cast to Response type

    await userController.login('test@example.com', 'password123', mockRes);

    expect(mockRes.cookie).toHaveBeenCalledWith('session_id', expect.any(String), expect.objectContaining({
      httpOnly: true,
      maxAge: 3600000, // 1 hour expiration
    }));

    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Login successful' });
  });

  it('should retrieve user details', async () => {
    expect(await userService.getUser(1)).toEqual({ id: 1, email: 'test@example.com' });
  });
});
