import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmailService } from '../services/email.service';
import { connect } from 'amqplib';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  const connection = await connect('amqp://localhost');
  const channel = await connection.createChannel();
  await channel.assertQueue('emailQueue', { durable: true });

  console.log('📨 Email worker listening for jobs...');

  channel.consume('emailQueue', async (msg) => {
    if (msg !== null) {
      const { email } = JSON.parse(msg.content.toString());
      console.log(`📨 Processing email job for ${email}`);

      try {
        await emailService.sendWelcomeEmail(email);
        channel.ack(msg); // Mark job as completed
      } catch (error) {
        console.error('❌ Email sending failed:', error);
      }
    }
  });
}

bootstrap().catch(console.error);
