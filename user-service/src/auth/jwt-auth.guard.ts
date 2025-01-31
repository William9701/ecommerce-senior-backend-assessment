import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService, // Inject Redis Service
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let authHeader = request.headers.authorization;
    let token: string | null = null;

    if (authHeader) {
      token = authHeader.split(' ')[1];
    } else if (request.params.id) {
      // If no token in headers, check Redis for stored token
      token = await this.redisService.get(`user:${request.params.id}:token`);
    }

    if (!token) {
      throw new UnauthorizedException('You have to be logged in to access this resource');
    }

    try {
      const decoded = this.jwtService.verify(token);
      request.user = decoded; // Attach user info to request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
