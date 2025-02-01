import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: +process.env.SMTP_PORT! || 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(email: string) {
    const mailOptions = {
      from: `"Your App" <${process.env.SMTP_SENDER}>`,
      to: email,
      subject: 'Welcome to Our Platform!',
      text: 'Thank you for registering. We’re excited to have you on board!',
    };

    try {
      this.logger.log(`Sending welcome email to ${email}`);
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
