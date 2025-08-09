import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { AppError } from '../utils/app-error';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  private getTemplatePath(filename: string): string {
    // Try multiple possible template locations
    const possiblePaths = [
      // If templates were copied to dist/templates during build
      path.join(__dirname, '../templates', filename),
      // If running from development src/services
      path.join(__dirname, '../templates', filename),
      // If running from production dist/services but templates in src
      path.join(__dirname, '../../../templates', filename),
      // If running from production dist/services and templates in src/templates
      path.join(__dirname, '../../src/templates', filename),
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        return templatePath;
      }
    }

    // If no template found, throw a more descriptive error
    throw new Error(`Template not found: ${filename}. Searched in: ${possiblePaths.join(', ')}`);
  }

  constructor() {
    // For production, you'd configure real email settings
    // For development, you might use a service like Ethereal (fake SMTP service) or a real service
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@sparrowx.com';

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
      const templatePath = this.getTemplatePath('reset-password.html');
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
        from: `"SparrowX" <${this.fromEmail}>`,
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
      const templatePath = this.getTemplatePath('password-changed.html');
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
        from: `"SparrowX" <${this.fromEmail}>`,
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
      const templatePath = this.getTemplatePath('company-invitation.html');
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
        from: `"SparrowX" <${this.fromEmail}>`,
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
      const templatePath = this.getTemplatePath('company-welcome.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Replace variables in the template
      const html = template({
        firstName,
        loginUrl: `${process.env.CLIENT_URL}/`,
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"SparrowX" <${this.fromEmail}>`,
        to,
        subject: 'Welcome to SparrowX!',
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
      const templatePath = this.getTemplatePath('package-added.html');
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
        packageUrl: `${process.env.CLIENT_URL}/packages/${packageData.packageId}`,
        companyName: packageData.companyName || 'SparrowX',
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"${packageData.companyName || 'SparrowX'}" <${this.fromEmail}>`,
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
      const templatePath = this.getTemplatePath('prealert-matched.html');
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
        packageUrl: `${process.env.CLIENT_URL}/packages/${matchData.packageId}`,
        companyName: matchData.companyName || 'SparrowX',
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"${matchData.companyName || 'SparrowX'}" <${this.fromEmail}>`,
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
      const templatePath = this.getTemplatePath('invoice-generated.html');
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
        invoiceUrl: `${process.env.CLIENT_URL}/invoices/${invoiceData.invoiceId}`,
        companyName: invoiceData.companyName || 'SparrowX',
        year: new Date().getFullYear()
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"${invoiceData.companyName || 'SparrowX'}" <${this.fromEmail}>`,
        to,
        subject: 'New Invoice Generated',
        html
      });
    } catch (error) {
      console.error('Failed to send invoice generated email:', error);
      // Don't throw here, this is not critical for the user flow
    }
  }

  /**
   * Send a notification when a payment is processed
   */
  async sendPaymentConfirmationEmail(
    to: string,
    firstName: string,
    paymentData: {
      invoiceNumber: string;
      paymentMethod: string;
      amount: string | number;
      paymentDate: string;
      transactionId?: string;
      status: string;
      companyName: string;
      invoiceId: string;
      paymentId: string;
      currencyInfo?: {
        currency: string;
        exchangeRate?: number;
        originalAmount?: number;
        convertedAmount?: number;
        baseCurrency?: string;
      };
    }
  ): Promise<void> {
    try {
      // Load the email template
      const templatePath = this.getTemplatePath('payment-confirmation.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const template = handlebars.compile(templateSource);
      
      // Format currency display
      const formatCurrency = (amount: number | string | undefined, currency: string) => {
        if (amount === undefined) return 'N/A';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(numAmount);
      };
      
      // Prepare currency information for display
      const currencyInfo = paymentData.currencyInfo || { currency: 'USD' };
      const displayCurrency = currencyInfo.currency || 'USD';
      const baseCurrency = currencyInfo.baseCurrency || 'USD';
      
      // Format amounts for display
      const formattedAmount = formatCurrency(paymentData.amount, baseCurrency);
      const formattedConvertedAmount = currencyInfo.convertedAmount 
        ? formatCurrency(currencyInfo.convertedAmount, displayCurrency)
        : null;
      
      // Format exchange rate for display
      const formattedExchangeRate = currencyInfo.exchangeRate 
        ? currencyInfo.exchangeRate.toFixed(4) 
        : null;
      
      // Determine if currency conversion happened
      const currencyConverted = 
        displayCurrency !== baseCurrency && 
        currencyInfo.exchangeRate !== undefined && 
        currencyInfo.convertedAmount !== undefined;
      
      // Replace variables in the template
      const html = template({
        firstName,
        invoiceNumber: paymentData.invoiceNumber,
        paymentMethod: paymentData.paymentMethod,
        amount: formattedAmount,
        paymentDate: paymentData.paymentDate,
        transactionId: paymentData.transactionId || 'N/A',
        status: paymentData.status,
        invoiceUrl: `${process.env.CLIENT_URL}/invoices/${paymentData.invoiceId}`,
        receiptUrl: `${process.env.CLIENT_URL}/payments/${paymentData.paymentId}`,
        companyName: paymentData.companyName || 'SparrowX',
        year: new Date().getFullYear(),
        
        // Currency information
        displayCurrency,
        baseCurrency,
        currencyConverted,
        convertedAmount: formattedConvertedAmount,
        exchangeRate: formattedExchangeRate,
        originalAmount: formattedAmount
      });
      
      // Send the email
      await this.transporter.sendMail({
        from: `"${paymentData.companyName || 'SparrowX'}" <${this.fromEmail}>`,
        to,
        subject: 'Payment Confirmation',
        html
      });
      
      console.log(`Payment confirmation email sent to ${to} for invoice ${paymentData.invoiceNumber}`);
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
      // Don't throw here, this is not critical for the user flow
    }
  }
} 