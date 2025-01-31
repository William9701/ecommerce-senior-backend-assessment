import { Controller, Post, Body, Get,Req, Param, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body('email') email: string, @Body('password') password: string) {
    return this.userService.register(email, password);
  }

  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string) {
    return this.userService.login(email, password);
  }

  @Post('logout')
  async logout(@Body('id') id: number) {
    return this.userService.logout(id);
  }


  @Get(':id')
  @UseGuards(JwtAuthGuard) // 🔒 Protect this route
  async getUser(@Param('id') id: number, @Req() req) {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from header
    console.log('getUser', id, token);
    return this.userService.getUser(id, token);
  }
  

}

