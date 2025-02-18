import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController, UserProfileController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../redis/redis.module'; //
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthMiddleware } from '../auth/auth.middleware';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // ✅ Register the User entity
    JwtModule.register({
      secret:
        process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    RedisModule, // ✅ Import the RedisModule
    RabbitMQModule, // Import RabbitMQModule
    MonitoringModule, // Import MonitoringModule
  ],
  controllers: [UserController, UserProfileController],
  providers: [
    UserService,
    EmailService,
    JwtAuthGuard,
    AuthMiddleware,
    RedisService,
  ],
  exports: [UserService, EmailService],
})
export class UserModule {}
