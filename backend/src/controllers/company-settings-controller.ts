import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CompanySettingsService } from '../services/company-settings-service';
import { z } from 'zod';
import { CompaniesService } from '../services/companies-service';

export class CompanySettingsController {
  private companySettingsService: CompanySettingsService;
  private companiesService: CompaniesService;

  constructor() {
    this.companySettingsService = new CompanySettingsService();
    this.companiesService = new CompaniesService();
  }

  /**
   * Get company settings
   */
  getCompanySettings = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const settings = await this.companySettingsService.getCompanySettings(companyId);
      return res.json(settings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      return res.status(500).json({ error: 'Failed to retrieve company settings' });
    }
  };

  /**
   * Update all company settings
   */
  updateCompanySettings = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const settings = await this.companySettingsService.updateCompanySettings(req.body, companyId);
      return res.json(settings);
    } catch (error) {
      console.error('Error updating company settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid settings data', details: error.errors });
      } else {
        return res.status(500).json({ error: 'Failed to update company settings' });
      }
    }
  };

  /**
   * Update notification settings
   */
  updateNotificationSettings = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const settings = await this.companySettingsService.updateNotificationSettings(req.body, companyId);
      return res.json(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid notification settings data', details: error.errors });
      } else {
        return res.status(500).json({ error: 'Failed to update notification settings' });
      }
    }
  };

  /**
   * Update theme settings
   */
  updateThemeSettings = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const settings = await this.companySettingsService.updateThemeSettings(req.body, companyId);
      return res.json(settings);
    } catch (error) {
      console.error('Error updating theme settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid theme settings data', details: error.errors });
      } else {
        return res.status(500).json({ error: 'Failed to update theme settings' });
      }
    }
  };

  /**
   * Get payment settings
   */
  getPaymentSettings = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const paymentSettings = await this.companySettingsService.getPaymentSettings(companyId);
      return res.json(paymentSettings);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      return res.status(500).json({ error: 'Failed to retrieve payment settings' });
    }
  };

  /**
   * Update payment settings
   */
  updatePaymentSettings = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const settings = await this.companySettingsService.updatePaymentSettings(req.body, companyId);
      return res.json(settings);
    } catch (error) {
      console.error('Error updating payment settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid payment settings data', details: error.errors });
      } else {
        return res.status(500).json({ error: 'Failed to update payment settings' });
      }
    }
  };

  /**
   * Get pickup locations for a company
   */
  getPickupLocations = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      
      // For development/testing, use a default company ID if none is provided
      if (!companyId) {
        // Log a warning for debugging
        console.warn('No company ID found in request, using mock data for pickup locations');
        
        // Return mock data for development 
        return res.json({ 
          locations: [
            "Kingston Main Office - 123 Hope Road",
            "Montego Bay Branch - 45 Gloucester Avenue",
            "Portmore Collection Point - Portmore Mall"
          ],
          success: true
        });
      }
      
      const company = await this.companiesService.getCompanyById(companyId);
      
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      const locations = company.locations || [];
      
      return res.json({ 
        locations,
        success: true
      });
    } catch (error) {
      console.error('Error fetching pickup locations:', error);
      return res.status(500).json({ error: 'Failed to retrieve pickup locations' });
    }
  };
} 