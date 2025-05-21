import { Request, Response } from 'express';
import { CompanyInvitationsService } from '../services/company-invitations-service';
import { AppError } from '../utils/app-error';
import { SendInvitationRequest, RegisterFromInvitationRequest } from '../types/company-invitation';

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export class CompanyInvitationsController {
  private companyInvitationsService: CompanyInvitationsService;

  constructor() {
    this.companyInvitationsService = new CompanyInvitationsService();
  }

  /**
   * Send an invitation to register a company
   * @route POST /api/companies/invite
   */
  async sendInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body as SendInvitationRequest;
      
      if (!email || !email.trim()) {
        throw new AppError('Email is required', 400);
      }



      await this.companyInvitationsService.sendInvitation(
        { email: email.trim() },
        req.user?.id || ''
      );

      res.status(200).json({
        success: true,
        message: 'Invitation sent successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error('Error sending invitation:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to send invitation'
        });
      }
    }
  }

  /**
   * Verify an invitation token
   * @route GET /api/companies/verify-invitation/:token
   */
  async verifyInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      
      if (!token) {
        throw new AppError('Token is required', 400);
      }

      const result = await this.companyInvitationsService.verifyInvitation(token);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error('Error verifying invitation:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to verify invitation'
        });
      }
    }
  }

  /**
   * Register a company from an invitation
   * @route POST /api/companies/register/:token
   */
  async registerFromInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { user, company } = req.body as RegisterFromInvitationRequest;
      
      if (!token) {
        throw new AppError('Token is required', 400);
      }

      if (!user || !company) {
        throw new AppError('User and company information are required', 400);
      }

      await this.companyInvitationsService.registerFromInvitation(token, user, company);

      res.status(201).json({
        success: true,
        message: 'Company registered successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error('Error registering company:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to register company'
        });
      }
    }
  }
} 