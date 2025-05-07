import { Request, Response, NextFunction } from 'express';
import { CompaniesService, createCompanySchema, updateCompanySchema } from '../services/companies-service';
import { ApiResponse } from '../utils/response';

export class CompaniesController {
  private service: CompaniesService;

  constructor() {
    this.service = new CompaniesService();
  }

  /**
   * Get all companies (super admin only)
   */
  getAllCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companies = await this.service.getAllCompanies();
      return ApiResponse.success(res, companies);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a company by ID
   */
  getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const company = await this.service.getCompanyById(id);
      return ApiResponse.success(res, company);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new company (super admin only)
   */
  createCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      try {
        createCompanySchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const company = await this.service.createCompany(req.body);
      return ApiResponse.success(res, company, 'Company created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a company by ID
   */
  updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Validate request body
      try {
        updateCompanySchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const company = await this.service.updateCompany(id, req.body);
      return ApiResponse.success(res, company, 'Company updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a company by ID (super admin only)
   */
  deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.deleteCompany(id);
      return ApiResponse.success(res, null, 'Company deleted successfully');
    } catch (error) {
      next(error);
    }
  };
} 