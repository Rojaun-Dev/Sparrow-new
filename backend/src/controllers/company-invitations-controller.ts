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

      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  };

  /**
   * Send a new invitation
   */
  sendInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      await this.companyInvitationsService.sendInvitation(
        { email },
        req.userId || ''
      );

      res.status(201).json({ message: 'Invitation sent successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  };

  /**
   * Resend an invitation
   */
  resendInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid invitation ID' });
      }

      await this.companyInvitationsService.resendInvitation(id, req.userId || '');

      res.json({ message: 'Invitation resent successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  };

  /**
   * Revoke an invitation
   */
  revokeInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid invitation ID' });
      }

      await this.companyInvitationsService.revokeInvitation(id);

      res.json({ message: 'Invitation revoked successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  };

  /**
   * Verify an invitation token
   */
  verifyInvitation = async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }

      const result = await this.companyInvitationsService.verifyInvitation(token);
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
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
        return res.status(400).json({ message: 'Token is required' });
      }

      if (!user || !company) {
        return res.status(400).json({ message: 'User and company data are required' });
      }

      await this.companyInvitationsService.registerFromInvitation(token, user, company);
      res.status(201).json({ message: 'Company registered successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  };
} 