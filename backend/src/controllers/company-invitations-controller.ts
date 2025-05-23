import { Response } from 'express';
import { CompanyInvitationsService } from '../services/company-invitations-service';
import { AppError } from '../utils/app-error';
import { AuthRequest } from '../middleware/auth';

export class CompanyInvitationsController {
  private companyInvitationsService: CompanyInvitationsService;

  constructor() {
    this.companyInvitationsService = new CompanyInvitationsService();
  }

  /**
   * List all invitations with pagination
   */
  listInvitations = async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await this.companyInvitationsService.listInvitations(
        page,
        limit,
        status,
        search
      );

      return res.status(200).json({
        success: true,
        message: 'Invitations retrieved successfully',
        data: {
          data: result.invitations,
          pagination: {
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Send a new invitation
   */
  sendInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      await this.companyInvitationsService.sendInvitation(
        { email },
        req.userId || ''
      );

      return res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: null
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Resend an invitation
   */
  resendInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid invitation ID'
        });
      }

      await this.companyInvitationsService.resendInvitation(id);

      return res.status(200).json({
        success: true,
        message: 'Invitation resent successfully',
        data: null
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Revoke an invitation
   */
  revokeInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid invitation ID'
        });
      }

      await this.companyInvitationsService.revokeInvitation(id);

      return res.status(200).json({
        success: true,
        message: 'Invitation revoked successfully',
        data: null
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Verify an invitation token
   */
  verifyInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const result = await this.companyInvitationsService.verifyInvitation(token);
      return res.status(200).json({
        success: true,
        message: 'Invitation verified successfully',
        data: result
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Register a company from an invitation
   */
  registerFromInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.params;
      const { user, company } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      if (!user || !company) {
        return res.status(400).json({
          success: false,
          message: 'User and company data are required'
        });
      }

      await this.companyInvitationsService.registerFromInvitation(token, user, company);
      return res.status(201).json({
        success: true,
        message: 'Company registered successfully',
        data: null
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
} 