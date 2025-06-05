import { Request, Response, NextFunction } from 'express';
import { BillingService, generateInvoiceSchema } from '../services/billing-service';
import { ApiResponse } from '../utils/response';
import { UsersService } from '../services/users-service';
import { EmailService } from '../services/email-service';
import { CompaniesService } from '../services/companies-service';

interface AuthRequest extends Request {
  companyId?: string;
}

export class BillingController {
  private service: BillingService;
  private usersService: UsersService;
  private emailService: EmailService;
  private companiesService: CompaniesService;

  constructor() {
    this.service = new BillingService();
    this.usersService = new UsersService();
    this.emailService = new EmailService();
    this.companiesService = new CompaniesService();
  }

  /**
   * Calculate fees for a package
   */
  calculatePackageFees = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { packageId } = req.params;
      const companyId = req.companyId as string;
      
      const fees = await this.service.calculatePackageFees(packageId, companyId);
      return ApiResponse.success(res, fees);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Generate an invoice for packages
   */
  generateInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { sendNotification = false, ...invoiceData } = req.body;
      
      // Validate request body
      try {
        generateInvoiceSchema.parse(invoiceData);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const invoice = await this.service.generateInvoice(invoiceData, companyId);

      // Send notification if requested
      if (sendNotification && invoice && invoice.userId) {
        try {
          // Get the user to get their email and notification preferences
          const user = await this.usersService.getUserById(invoice.userId, companyId);

          // Only send if the user has email notifications enabled
          if (user && 
              user.email && 
              user.notificationPreferences?.email && 
              user.notificationPreferences?.billingUpdates?.email) {
            
            // Get company name
            const company = await this.companiesService.getCompanyById(companyId);
            const companyName = company ? company.name : 'Cautious Robot';
            
            // Format data for the email
            await this.emailService.sendInvoiceGeneratedEmail(
              user.email,
              user.firstName,
              {
                invoiceNumber: invoice.invoiceNumber || '',
                issueDate: new Date(invoice.issueDate).toLocaleDateString(),
                dueDate: new Date(invoice.dueDate).toLocaleDateString(),
                status: invoice.status || '',
                amount: invoice.totalAmount || 0,
                packageCount: invoice.items?.filter((item: any) => item.packageId).length || 0,
                companyName,
                invoiceId: invoice.id
              }
            );
          }
        } catch (emailError) {
          console.error('Failed to send invoice notification:', emailError);
          // Don't fail the request if email sending fails
        }
      }

      return ApiResponse.success(res, invoice, 'Invoice generated successfully', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Generate invoice for all unbilled packages of a user
   */
  generateInvoiceForUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const companyId = req.companyId as string;
      const { sendNotification = false } = req.body;

      const invoice = await this.service.generateInvoiceForUser(userId, companyId);

      // Send notification if requested
      if (sendNotification && invoice && invoice.userId) {
        try {
          // Get the user to get their email and notification preferences
          const user = await this.usersService.getUserById(invoice.userId, companyId);

          // Only send if the user has email notifications enabled
          if (user && 
              user.email && 
              user.notificationPreferences?.email && 
              user.notificationPreferences?.billingUpdates?.email) {
            
            // Get company name
            const company = await this.companiesService.getCompanyById(companyId);
            const companyName = company ? company.name : 'Cautious Robot';
            
            // Format data for the email
            await this.emailService.sendInvoiceGeneratedEmail(
              user.email,
              user.firstName,
              {
                invoiceNumber: invoice.invoiceNumber || '',
                issueDate: new Date(invoice.issueDate).toLocaleDateString(),
                dueDate: new Date(invoice.dueDate).toLocaleDateString(),
                status: invoice.status || '',
                amount: invoice.totalAmount || 0,
                packageCount: invoice.items?.filter((item: any) => item.packageId).length || 0,
                companyName,
                invoiceId: invoice.id
              }
            );
          }
        } catch (emailError) {
          console.error('Failed to send invoice notification:', emailError);
          // Don't fail the request if email sending fails
        }
      }

      return ApiResponse.success(res, invoice, 'Invoice generated successfully for user', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Preview invoice calculations without creating an invoice
   */
  previewInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      
      // Validate request body
      try {
        generateInvoiceSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const preview = await this.service.previewInvoice(req.body, companyId);
      return ApiResponse.success(res, preview);
    } catch (error) {
      next(error);
      return undefined;
    }
  };
} 