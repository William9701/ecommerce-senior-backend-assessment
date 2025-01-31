import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('You have to be logged in to see other users');
    }

    const token = authHeader.split(' ')[1];
    console.log('token', token);
    try {
      const decoded = this.jwtService.verify(token);
      request.user = decoded;
      console.log('decoded', decoded);
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
