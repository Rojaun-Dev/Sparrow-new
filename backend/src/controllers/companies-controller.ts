import { Request, Response } from 'express';
import { CompaniesService } from '../services/companies-service';
import { AuthRequest } from '../middleware/auth';
import { AuditLogsService } from '../services/audit-logs-service';

const companiesService = new CompaniesService();
const auditLogsService = new AuditLogsService();

/**
 * Get all companies
 */
export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    // Parse pagination params as numbers without mutating req.query
    const query: any = { ...req.query };
    if (typeof req.query.page === 'string') query.page = parseInt(req.query.page, 10);
    if (typeof req.query.limit === 'string') query.limit = parseInt(req.query.limit, 10);
    const companies = await companiesService.getAllCompanies(query);
    return res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get company by ID
 */
export const getCompanyById = async (req: AuthRequest, res: Response) => {
  try {
    let { id } = req.params;
    // Special case: if id is 'me', use the authenticated user's companyId
    if (id === 'me') {
      if (!req.companyId) {
        return res.status(400).json({
          success: false,
          message: 'No company ID provided for current user',
        });
      }
      id = req.companyId;
    }
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'No company ID provided',
      });
    }
    const company = await companiesService.getCompanyById(id);
    return res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch company',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create company
 */
export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const company = await companiesService.createCompany(req.body);
    
    // Audit log for company registration
    if (company) {
      await auditLogsService.createLog({
        userId: userId || 'system',
        companyId: company.id,
        action: 'company_registration',
        entityType: 'company',
        entityId: company.id,
        details: {
          name: company.name,
          subdomain: company.subdomain,
          email: company.email,
          phone: company.phone,
          address: company.address
        },
        ipAddress,
        userAgent
      });
    }
    
    return res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error creating company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update company
 */
export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId as string;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Get company before update for audit log
    const companyBefore = await companiesService.getCompanyById(id);
    const company = await companiesService.updateCompany(id, req.body);
    
    // Audit log for company update
    if (company && companyBefore) {
      await auditLogsService.createLog({
        userId: userId || 'system',
        companyId: id,
        action: 'company_update',
        entityType: 'company',
        entityId: id,
        details: {
          changes: Object.keys(req.body).reduce((acc: Record<string, {from: any, to: any}>, key) => {
            const k = key as keyof typeof companyBefore;
            if (companyBefore[k] !== req.body[key]) {
              acc[key] = {
                from: companyBefore[k],
                to: req.body[key]
              };
            }
            return acc;
          }, {})
        },
        ipAddress,
        userAgent
      });
    }
    
    return res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update company',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete company
 */
export const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId as string;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Get company before deletion for audit log
    const company = await companiesService.getCompanyById(id);
    await companiesService.deleteCompany(id);
    
    // Audit log for company deletion
    if (company) {
      await auditLogsService.createLog({
        userId: userId || 'system',
        companyId: id,
        action: 'company_deletion',
        entityType: 'company',
        entityId: id,
        details: {
          name: company.name,
          subdomain: company.subdomain,
          email: company.email
        },
        ipAddress,
        userAgent
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get company statistics
 */
export const getCompanyStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const statistics = await companiesService.getCompanyStatistics(id);
    return res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching company statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch company statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 