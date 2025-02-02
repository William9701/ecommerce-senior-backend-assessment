import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);

  async onModuleInit() {
    try {
      this.connection = await amqp.connect({
        protocol: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'rabbitmq',  // Use the container name
        port: Number(process.env.RABBITMQ_PORT) || 5672,
        username: process.env.RABBITMQ_USER || 'guest',
        password: process.env.RABBITMQ_PASS || 'guest',
      });
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue('emailQueue', { durable: true });
      this.logger.log('RabbitMQ connection and channel established successfully');
    } catch (error) {
      this.logger.error('Failed to establish RabbitMQ connection and channel', error);
      throw new Error('Failed to establish RabbitMQ connection and channel');
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('RabbitMQ connection and channel closed successfully');
    } catch (error) {
      this.logger.error('Failed to close RabbitMQ connection and channel', error);
    }
  }

  async sendToQueue(message: string) {
    try {
      if (!this.channel) {
        throw new Error('Channel is not initialized');
      }
      this.channel.sendToQueue('emailQueue', Buffer.from(message), { persistent: true });
      this.logger.log('Message sent to emailQueue');
    } catch (error) {
      this.logger.error('Failed to send message to emailQueue', error);
    }
  }

  async consumeQueue(callback: (msg: amqp.Message) => void) {
    try {
      if (!this.channel) {
        this.logger.error('Channel is not initialized. Retrying in 5 seconds...');
        setTimeout(() => this.consumeQueue(callback), 5000); // Retry after 5 sec
        return;
      }
      this.channel.consume('emailQueue', callback, { noAck: false });
      this.logger.log('Consuming messages from emailQueue');
    } catch (error) {
      this.logger.error('Failed to consume messages from emailQueue', error);
    }
  }
  

  ackMessage(msg: amqp.Message) {
    if (this.channel) {
      this.channel.ack(msg);
    } else {
      this.logger.error('Channel is not initialized');
    }
  }

  nackMessage(msg: amqp.Message) {
    if (this.channel) {
      this.channel.nack(msg, false, true);
    } else {
      this.logger.error('Channel is not initialized');
    }
  }
}
