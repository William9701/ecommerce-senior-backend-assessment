import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service'; // Import Redis service
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../services/email.service'; // Import EmailService

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService, // Inject Redis service
    private emailService: EmailService, // Inject EmailService
  ) {}

  async register(email: string, password: string) {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ email, password: hashedPassword });
    await this.userRepository.save(user);

    // ✅ Send welcome email asynchronously
    try {
      await this.emailService.sendWelcomeEmail(email);
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }

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
      await this.redisService.set(`session:${sessionId}`, JSON.stringify({ userId: user.id, token }), 3600);
    } catch (error) {
      console.error("Redis error:", error);
      throw new InternalServerErrorException("Error storing session in Redis");
    }

    try {
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });
    } catch (error) {
      console.error("Error setting cookie:", error);
      throw new InternalServerErrorException("Error setting authentication cookie");
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


