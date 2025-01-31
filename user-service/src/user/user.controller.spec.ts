import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

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
            login: jest.fn().mockResolvedValue({ access_token: 'mocked_jwt_token' }),
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

  it('should login and return JWT', async () => {
    expect(await userController.login('test@example.com', 'password123'))
      .toEqual({ access_token: 'mocked_jwt_token' });
  });

  it('should retrieve user details', async () => {
    expect(await userController.getUser(1, 'mocked_jwt_token')).toEqual({ id: 1, email: 'test@example.com' });
  });
});
