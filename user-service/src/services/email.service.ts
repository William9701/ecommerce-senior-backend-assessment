import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

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
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
