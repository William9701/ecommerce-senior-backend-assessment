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

    // Check that cookie method was called correctly
    expect(mockRes.cookie).toHaveBeenCalledWith('session_id', expect.any(String), expect.objectContaining({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour expiration
    }));

    // Check that json method was called with the success message
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Login successful', token: 'mocked_jwt_token' });
  });

  it('should retrieve user details', async () => {
    expect(await userService.getUser(1)).toEqual({ id: 1, email: 'test@example.com' });
  });
  

  it('should retrieve user details', async () => {
    expect(await userService.getUser(1)).toEqual({ id: 1, email: 'test@example.com' });
  });
});
