import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../redis/redis.module'; //



@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // ✅ Register the User entity
    JwtModule.register({
      secret: "02b5ac8542cba171c14ae5d871b5f401c296fe7d95300c22993d7648db7097e6", // Ensure JWT is registered
      signOptions: { expiresIn: '1h' },
    }),
    RedisModule, // ✅ Import the RedisModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})


export class UserModule {}
