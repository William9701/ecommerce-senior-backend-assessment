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
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            await this.emailService.sendWelcomeEmail(email);
            this.rabbitMQService.ackMessage(msg);
            this.logger.log(`Welcome email sent to ${email}`);
            break; // Exit the loop after successful email sending
          } catch (error) {
            retryCount++;
            this.logger.error(`Attempt ${retryCount} failed to send welcome email to ${email}`, error);

            if (retryCount === maxRetries) {
              this.rabbitMQService.nackMessage(msg); // Requeue the message after 3 failed attempts
              this.logger.error(`Message failed after ${maxRetries} attempts. Requeued.`);
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize email consumer', error);
    }
  }
}
