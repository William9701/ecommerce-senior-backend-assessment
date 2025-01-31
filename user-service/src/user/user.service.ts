import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service'; // Import Redis service
import { v4 as uuidv4 } from 'uuid';

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

  async login(email: string, password: string, res: Response) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    console.log("i am here 1");
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    console.log("i am here 2");

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    const sessionId = uuidv4();

    try {
      await this.redisService.set(`session:${sessionId}`, JSON.stringify({ userId: user.id, token }), 3600);
      console.log("Stored in Redis successfully");
    } catch (error) {
      console.error("Redis error:", error);
      throw new InternalServerErrorException("Error storing session in Redis");
    }

    console.log("i am here 3");

    try {
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });
      console.log("Cookie set successfully", sessionId);
      console.log("Set-Cookie Debug:", res.getHeaders()['set-cookie']);
    } catch (error) {
      console.error("Error setting cookie:", error);
      throw new InternalServerErrorException("Error setting authentication cookie");
    }

    console.log("i am here 4");

    return res.json({ token });
}

  
  

  async getUser(id: number) {
    
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Obi not found');
    }
    return user;
  }

  async logout(sessionId: string, res: Response) {
    await this.redisService.del(`session:${sessionId}`); // Remove session from Redis
    res.clearCookie('session_id'); // Clear the session cookie
    return { message: 'Logged out successfully' };
  }
}


