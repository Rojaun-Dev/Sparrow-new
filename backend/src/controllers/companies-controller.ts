import { Request, Response } from 'express';
import { CompaniesService } from '../services/companies-service';

const companiesService = new CompaniesService();

/**
 * Get all companies
 */
export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    // Parse pagination params as numbers
    const query = { ...req.query };
    if (query.page) query.page = parseInt(query.page as string, 10);
    if (query.limit) query.limit = parseInt(query.limit as string, 10);
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
export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
export const createCompany = async (req: Request, res: Response) => {
  try {
    const company = await companiesService.createCompany(req.body);
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
export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await companiesService.updateCompany(id, req.body);
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
export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await companiesService.deleteCompany(id);
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