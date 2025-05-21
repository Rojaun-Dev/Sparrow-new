import crypto from 'crypto';
import { CompanyInvitationsRepository } from '../repositories/company-invitations-repository';
import { CompanyInvitation, CreateCompanyInvitation, SendInvitationRequest, VerifyInvitationResponse } from '../types/company-invitation';
import { EmailService } from './email-service';
import { AppError } from '../utils/app-error';
import { UsersService } from './users-service';
import { CompaniesService } from './companies-service';
import bcrypt from 'bcrypt';

export class CompanyInvitationsService {
  private companyInvitationsRepo: CompanyInvitationsRepository;
  private emailService: EmailService;
  private usersService: UsersService;
  private companiesService: CompaniesService;

  constructor() {
    this.companyInvitationsRepo = new CompanyInvitationsRepository();
    this.emailService = new EmailService();
    this.usersService = new UsersService();
    this.companiesService = new CompaniesService();
  }

  /**
   * Generate a unique invitation token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate expiration date (24 hours from now)
   */
  private calculateExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate;
  }

  /**
   * Send invitation to create a company
   */
  async sendInvitation(data: SendInvitationRequest, currentUserId: string): Promise<void> {
    // Check if there's already a pending invitation for this email
    const pendingInvitations = await this.companyInvitationsRepo.findPendingByEmail(data.email);
    
    if (pendingInvitations.length > 0) {
      throw new AppError('There is already a pending invitation for this email', 400);
    }

    // Create a new invitation
    const token = this.generateToken();
    const expiresAt = this.calculateExpirationDate();

    const invitation: CreateCompanyInvitation = {
      email: data.email,
      token,
      expiresAt,
      createdBy: currentUserId
    };

    await this.companyInvitationsRepo.create(invitation);

    // Send invitation email
    const invitationLink = `${process.env.APP_BASE_URL}/register/company/invite?token=${token}`;
    
    await this.emailService.sendCompanyInvitation(
      data.email,
      invitationLink
    );
  }

  /**
   * Verify if an invitation token is valid
   */
  async verifyInvitation(token: string): Promise<VerifyInvitationResponse> {
    const invitation = await this.companyInvitationsRepo.findValidByToken(token);

    if (!invitation) {
      return { isValid: false };
    }

    return { 
      isValid: true,
      email: invitation.email
    };
  }

  /**
   * Complete the registration process from an invitation
   */
  async registerFromInvitation(token: string, userData: any, companyData: any): Promise<void> {
    // Verify the invitation is valid
    const invitation = await this.companyInvitationsRepo.findValidByToken(token);
    
    if (!invitation) {
      throw new AppError('Invalid or expired invitation', 400);
    }

    // Format address as a string
    const addressParts = [
      companyData.addressLine1,
      companyData.addressLine2,
      companyData.city,
      companyData.state,
      companyData.postalCode,
      companyData.country
    ].filter(Boolean);

    // Create the company with required fields
    const company = await this.companiesService.createCompany({
      name: companyData.name,
      subdomain: companyData.subdomain,
      email: companyData.email,
      phone: companyData.phone,
      address: addressParts.join(', '),
      website: companyData.website,
      locations: companyData.locations,
      bankInfo: companyData.bankInfo
    });

    if (!company) {
      throw new AppError('Failed to create company', 500);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Create the user as admin_l2
    await this.usersService.createUser({
      email: invitation.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: 'admin_l2',
      passwordHash
    }, company.id);

    // Mark the invitation as accepted
    await this.companyInvitationsRepo.updateStatus(invitation.id, 'accepted');

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      invitation.email,
      userData.firstName
    );
  }

  /**
   * List all invitations with pagination
   */
  async listInvitations(page: number = 1, limit: number = 10, status?: string, search?: string) {
    const invitations = await this.companyInvitationsRepo.findAll(page, limit, status, search);
    const total = await this.companyInvitationsRepo.countAll(status, search);

    return {
      invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(id: number, currentUserId: string): Promise<void> {
    const invitation = await this.companyInvitationsRepo.findById(id);
    
    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.status !== 'pending') {
      throw new AppError('Cannot resend an invitation that is not pending', 400);
    }

    // Generate a new token and expiration date
    const token = this.generateToken();
    const expiresAt = this.calculateExpirationDate();

    // Update the invitation
    await this.companyInvitationsRepo.update(id, {
      token,
      expiresAt,
      updatedAt: new Date()
    });

    // Send invitation email
    const invitationLink = `${process.env.APP_BASE_URL}/register/company/invite?token=${token}`;
    
    await this.emailService.sendCompanyInvitation(
      invitation.email,
      invitationLink
    );
  }

  /**
   * Revoke/cancel an invitation
   */
  async revokeInvitation(id: number): Promise<void> {
    const invitation = await this.companyInvitationsRepo.findById(id);
    
    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.status !== 'pending') {
      throw new AppError('Cannot revoke an invitation that is not pending', 400);
    }

    // Cancel the invitation
    await this.companyInvitationsRepo.updateStatus(id, 'cancelled');
  }
} 