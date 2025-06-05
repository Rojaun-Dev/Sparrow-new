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

  /**
   * Send a company invitation email
   */
  async sendCompanyInvitation(to: string, invitationLink: string): Promise<void> {
    try {
      // Load the email template
      const templatePath = path.join(__dirname, '../templates/company-invitation.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Replace variables in the template
      const html = template({
        invitationLink,
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"Cautious Robot" <${this.fromEmail}>`,
        to,
        subject: 'Invitation to Register Your Company',
        html
      });
    } catch (error) {
      console.error('Failed to send company invitation email:', error);
      throw new AppError('Failed to send company invitation email', 500);
    }
  }

  /**
   * Send a welcome email after company registration
   */
  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    try {
      // Load the email template
      const templatePath = path.join(__dirname, '../templates/company-welcome.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Replace variables in the template
      const html = template({
        firstName,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"Cautious Robot" <${this.fromEmail}>`,
        to,
        subject: 'Welcome to Cautious Robot!',
        html
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw here, this is not critical for the user flow
    }
  }

  /**
   * Send a notification when a package is added
   */
  async sendPackageAddedEmail(
    to: string,
    firstName: string,
    packageData: {
      trackingNumber: string;
      status: string;
      description: string;
      weight: string | number;
      dateAdded: string;
      companyName: string;
      packageId: string;
    }
  ): Promise<void> {
    try {
      // Load the email template
      const templatePath = path.join(__dirname, '../templates/package-added.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Replace variables in the template
      const html = template({
        firstName,
        trackingNumber: packageData.trackingNumber,
        status: packageData.status,
        description: packageData.description || 'No description provided',
        weight: packageData.weight || 'N/A',
        dateAdded: packageData.dateAdded,
        packageUrl: `${process.env.FRONTEND_URL}/packages/${packageData.packageId}`,
        companyName: packageData.companyName || 'Cautious Robot',
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"${packageData.companyName || 'Cautious Robot'}" <${this.fromEmail}>`,
        to,
        subject: 'New Package Added',
        html
      });
    } catch (error) {
      console.error('Failed to send package added email:', error);
      // Don't throw here, this is not critical for the user flow
    }
  }

  /**
   * Send a notification when a pre-alert is matched to a package
   */
  async sendPreAlertMatchedEmail(
    to: string,
    firstName: string,
    matchData: {
      preAlertTrackingNumber: string;
      packageTrackingNumber: string;
      courier: string;
      description: string;
      status: string;
      receivedDate: string;
      companyName: string;
      packageId: string;
    }
  ): Promise<void> {
    try {
      // Load the email template
      const templatePath = path.join(__dirname, '../templates/prealert-matched.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Replace variables in the template
      const html = template({
        firstName,
        preAlertTrackingNumber: matchData.preAlertTrackingNumber,
        packageTrackingNumber: matchData.packageTrackingNumber,
        courier: matchData.courier || 'N/A',
        description: matchData.description || 'No description provided',
        status: matchData.status,
        receivedDate: matchData.receivedDate || 'N/A',
        packageUrl: `${process.env.FRONTEND_URL}/packages/${matchData.packageId}`,
        companyName: matchData.companyName || 'Cautious Robot',
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"${matchData.companyName || 'Cautious Robot'}" <${this.fromEmail}>`,
        to,
        subject: 'Pre-Alert Matched to Package',
        html
      });
    } catch (error) {
      console.error('Failed to send pre-alert matched email:', error);
      // Don't throw here, this is not critical for the user flow
    }
  }

  /**
   * Send a notification when an invoice is generated
   */
  async sendInvoiceGeneratedEmail(
    to: string,
    firstName: string,
    invoiceData: {
      invoiceNumber: string;
      issueDate: string;
      dueDate: string;
      status: string;
      amount: string | number;
      packageCount: number;
      companyName: string;
      invoiceId: string;
    }
  ): Promise<void> {
    try {
      // Load the email template
      const templatePath = path.join(__dirname, '../templates/invoice-generated.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Replace variables in the template
      const html = template({
        firstName,
        invoiceNumber: invoiceData.invoiceNumber,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        status: invoiceData.status,
        amount: invoiceData.amount,
        packageCount: invoiceData.packageCount,
        invoiceUrl: `${process.env.FRONTEND_URL}/invoices/${invoiceData.invoiceId}`,
        companyName: invoiceData.companyName || 'Cautious Robot',
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"${invoiceData.companyName || 'Cautious Robot'}" <${this.fromEmail}>`,
        to,
        subject: 'New Invoice Generated',
        html
      });
    } catch (error) {
      console.error('Failed to send invoice generated email:', error);
      // Don't throw here, this is not critical for the user flow
    }
  }
} 