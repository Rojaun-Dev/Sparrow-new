import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { AppError } from '../utils/app-error';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    // For production, you'd configure real email settings
    // For development, you might use a service like Ethereal (fake SMTP service) or a real service
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@cautious-robot.com';

    // Check if we're in development
    if (process.env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
          pass: process.env.EMAIL_PASS || 'ethereal_password'
        }
      });
    } else {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string, firstName: string, resetUrl: string): Promise<void> {
    try {
      const fullResetUrl = `${resetUrl}?token=${resetToken}`;
      
      // Load the email template
      const templatePath = path.join(__dirname, '../templates/reset-password.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Replace variables in the template
      const html = template({
        firstName,
        resetUrl: fullResetUrl,
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"Cautious Robot" <${this.fromEmail}>`,
        to,
        subject: 'Reset Your Password',
        html
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new AppError('Failed to send password reset email', 500);
    }
  }

  /**
   * Send a password change confirmation email
   */
  async sendPasswordChangedEmail(to: string, firstName: string): Promise<void> {
    try {
      // Load the email template
      const templatePath = path.join(__dirname, '../templates/password-changed.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Replace variables in the template
      const html = template({
        firstName,
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"Cautious Robot" <${this.fromEmail}>`,
        to,
        subject: 'Your Password Has Been Changed',
        html
      });
    } catch (error) {
      console.error('Failed to send password changed email:', error);
      // Don't throw here, this is not critical for the user flow
    }
  }
} 