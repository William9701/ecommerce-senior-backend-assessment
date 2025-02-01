import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class EmailConsumer implements OnModuleInit {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly emailService: EmailService
  ) {}

  async onModuleInit() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for RabbitMQService
      await this.rabbitMQService.consumeQueue(async (msg) => {
        const { email } = JSON.parse(msg.content.toString());
        this.logger.log(`Received message for email: ${email}`);
        try {
          await this.emailService.sendWelcomeEmail(email);
          this.rabbitMQService.ackMessage(msg);
          this.logger.log(`Welcome email sent to ${email}`);
        } catch (error) {
          this.logger.error(`Failed to send welcome email to ${email}`, error);
          this.rabbitMQService.nackMessage(msg); // Requeue the message
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize email consumer', error);
    }
  }
  
}
