import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

const mockUser = { id: 1, email: 'test@example.com', password: 'hashedpass', createdAt: new Date() };

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<User>;

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
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should register a user', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null); // Ensure no user is found for registration
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');

    const result = await userService.register('test@example.com', 'password123');
    expect(result).toEqual({ message: 'User registered successfully' });
  });

  it('should login a user and return JWT', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser); // Simulate existing user
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const result = await userService.login('test@example.com', 'password123');
    expect(result).toEqual({ access_token: 'mocked_jwt_token' });
  });

  it('should return user details', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser); // Ensure findOne returns the mock user
    const result = await userService.getUser(1, 'mocked_jwt_token');
    expect(result).toEqual(mockUser);
  });
  
});
