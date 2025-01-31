import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';  // Assuming RedisService is in src/redis

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    

    const sessionId = req.cookies.session_id; // Read cookie automatically
    if (!sessionId) {
      throw new UnauthorizedException('Session expired Pls login to access this route');
    }

    // Retrieve token from Redis
    const sessionData = await this.redisService.get(`session:${sessionId}`);
    if (!sessionData) {
      throw new UnauthorizedException('Invalid session');
    }

    const { userId, token } = JSON.parse(sessionData);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Attach token automatically to the request header
    req.headers['authorization'] = `Bearer ${token}`;
    next();
  }
}
