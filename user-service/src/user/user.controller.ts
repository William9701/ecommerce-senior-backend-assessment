import { Controller, Post, Body, Get, Req, Res, Param, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@ApiTags('Users') 
@Controller('api/users')
export class UserProfileController {
  constructor(private readonly userService: UserService) {}
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: number) {
    return this.userService.getUser(id);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req, @Res() res: Response) {
    const sessionId = req.cookies.session_id;
    return this.userService.logout(sessionId, res);
  }
}

@ApiTags('Authentication') 
@Controller("api/")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiBody({
    type: RegisterDto,  // Ensuring Swagger uses DTO schema
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.userService.register(registerDto.email, registerDto.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  @ApiBody({
    type: LoginDto, // Ensuring Swagger uses DTO schema
  })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return this.userService.login(loginDto.email, loginDto.password, res);
  }
}
