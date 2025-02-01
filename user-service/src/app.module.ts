import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthMiddleware } from './auth/auth.middleware';  // Import the middleware
import { RedisModule } from './redis/redis.module';
import { EmailService } from './services/email.service';


@Module({
  imports: [
    ConfigModule.forRoot(), // Load environment variables
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT! || 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Set to false in production
    }),
    UserModule,
    RedisModule, // Import the RedisModule
  ],
  providers: [EmailService],  // ✅ Register EmailService
  exports: [EmailService],   // ✅ Export EmailService
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the AuthMiddleware to the user routes
    consumer.apply(AuthMiddleware).forRoutes('users');
  }
}
// In this example, we've added the AuthMiddleware to the user routes by calling consumer.apply(AuthMiddleware).forRoutes('users'). This will ensure that the middleware is executed for all routes under the /users path. You can also pass multiple paths as arguments to forRoutes to apply the middleware to multiple paths.