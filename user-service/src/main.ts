import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('User Authentication API')
    .setDescription('API for user authentication including registration, login, and profile management')
    .setVersion('1.0')
    .addBearerAuth() // Enables JWT Bearer Authentication in Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // API docs available at /api-docs

  await app.listen(process.env.PORT ?? 3005);
}

bootstrap();
