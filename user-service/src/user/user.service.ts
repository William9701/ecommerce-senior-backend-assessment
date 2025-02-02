import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../email/email.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import * as EmailValidator from 'email-validator';
import { logger } from '../utils/logger'; // Import logger
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async register(email: string, password: string): Promise<{ message: string }> {
    logger.info(`Register request received for ${email}`);

    this.validateInput(email, password);

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      logger.warn(`Email already in use: ${email}`);
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = this.userRepository.create({ email, password: hashedPassword });

    await this.userRepository.save(user);
    this.monitoringService.increaseRegistrationCount(); // Increment registration metric
    logger.info(`User successfully registered: ${email}`);

    await this.sendWelcomeEmail(email);

    return { message: 'User registered successfully' };
  }

  private validateInput(email: string, password: string): void {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (!EmailValidator.validate(email)) {
      throw new BadRequestException('Invalid email format');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password too weak. Must contain at least 8 characters, a number, and a special character.',
      );
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async sendWelcomeEmail(email: string): Promise<void> {
    try {
      await this.rabbitMQService.sendToQueue(JSON.stringify({ email }));
    } catch (error) {
      logger.error(`Failed to send welcome email to ${email}`, error.message);
    }
  }

  async login(email: string, password: string, res: Response) {
    logger.info(`Login attempt for ${email}`);
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      logger.warn(`User not found: ${email}`);
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    const sessionId = uuidv4();

    try {
      await this.redisService.set(
        `session:${sessionId}`,
        JSON.stringify({ userId: user.id, token }),
        3600,
      );
      this.monitoringService.increaseLoginCount(); // Increment login metric
      logger.info(`Session stored in Redis for ${email}`);
    } catch (error) {
      logger.error(`Redis error for ${email}: ${error.message}`);
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
      logger.error(`Cookie error for ${email}: ${error.message}`);
      throw new InternalServerErrorException('Error setting authentication cookie');
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
    await this.redisService.del(`session:${sessionId}`);
    res.clearCookie('session_id');
    return res.json({ message: 'Logged out successfully' });
  }
}
