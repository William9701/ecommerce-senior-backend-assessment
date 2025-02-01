import { Controller, Post, Body, Get, Req, Res, Param, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@Controller('users')
export class UserProfileController {
  constructor(private readonly userService: UserService) {}

  @Get('logout')
  @UseGuards(JwtAuthGuard) // Ensure only authenticated users can log out
  async logout(@Req() req, @Res() res: Response) {
    const sessionId = req.cookies.session_id;
    console.log("sessionId", sessionId);
    return this.userService.logout(sessionId, res);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Now retrieves token automatically
  async getUser(@Param('id') id: number, @Req() req) {
    return this.userService.getUser(id);
  }
}

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body('email') email: string, @Body('password') password: string) {
    return this.userService.register(email, password);
  }

  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string, @Res() res: Response) {
    
    return this.userService.login(email, password, res);
  }

  
}


