import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service'; // Import Redis service
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../email/email.service'; // Import EmailService
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import * as EmailValidator from 'email-validator'; // For email validation

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService, // Inject Redis service
    private emailService: EmailService, // Inject EmailService
    private rabbitMQService: RabbitMQService, // Inject RabbitMQ service
  ) {}

  async register(email: string, password: string) {
    // Check for missing fields
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
  
    // Check if the email format is valid
    const isEmailValid = EmailValidator.validate(email); // Alternatively, you can use regex
    if (!isEmailValid) {
      throw new BadRequestException('Invalid email format');
    }
  
    // Check if the password meets the strength criteria (e.g., min 8 chars, includes number, special char)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException('Password too weak. Must contain at least 8 characters, a number, and a special character.');
    }
  
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });
    await this.userRepository.save(user);
  
    // ✅ Send welcome email asynchronously
    // Send message to RabbitMQ
    await this.rabbitMQService.sendToQueue(JSON.stringify({ email }));
  
    return { message: 'User registered successfully' };
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    const sessionId = uuidv4();

    try {
      await this.redisService.set(
        `session:${sessionId}`,
        JSON.stringify({ userId: user.id, token }),
        3600,
      );
    } catch (error) {
      console.error('Redis error:', error);
      throw new InternalServerErrorException('Error storing session in Redis');
    }

    try {
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });
    } catch (error) {
      console.error('Error setting cookie:', error);
      throw new InternalServerErrorException(
        'Error setting authentication cookie',
      );
    }

    return res.json({ token });
  }

  async getUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async logout(sessionId: string, res: Response) {
    await this.redisService.del(`session:${sessionId}`); // Remove session from Redis
    res.clearCookie('session_id'); // Clear the session cookie
    return res.json({ message: 'Logged out successfully' });
  }
}
