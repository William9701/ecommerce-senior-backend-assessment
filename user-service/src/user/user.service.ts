import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service'; // Import Redis service

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService // Inject Redis service
  ) {}

  async register(email: string, password: string) {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ email, password: hashedPassword });
    await this.userRepository.save(user);

    return { message: 'User registered successfully' };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    const cachedToken = await this.redisService.set(`token`, token, 3600);
    console.log('Redis SET result:', cachedToken);

    return { access_token: token };
  }

  async getUser(id: number, token: string) {
    console.log('getUser', id, token);
    const cachedToken = await this.redisService.get(`token`);
    console.log('cachedToken', cachedToken);
    if (!cachedToken || cachedToken !== token) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async logout(id: number) {
    await this.redisService.del(`user:${id}:token`); // Remove token from Redis
    return { message: 'Logged out successfully' };
  }
}
