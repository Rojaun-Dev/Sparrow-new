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
   * Get integration settings
   */
  getIntegrationSettings = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const integrationSettings = await this.companySettingsService.getIntegrationSettings(companyId);
      return res.json(integrationSettings);
    } catch (error) {
      console.error('Error fetching integration settings:', error);
      return res.status(500).json({ error: 'Failed to retrieve integration settings' });
    }
  };

  /**
   * Update integration settings
   */
  updateIntegrationSettings = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const settings = await this.companySettingsService.updateIntegrationSettings(req.body, companyId);
      return res.json(settings);
    } catch (error) {
      console.error('Error updating integration settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid integration settings data', details: error.errors });
      } else {
        return res.status(500).json({ error: 'Failed to update integration settings' });
      }
    }
  };

  /**
   * Generate API key for company
   */
  generateApiKey = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const companyId = req.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }
      
      // Generate a new secure API key
      console.log(`Generating new API key for company ${companyId} by user ${req.user?.id}`);
      const apiKey = await this.companySettingsService.generateApiKey(companyId);
      
      // Log success (but don't log the actual key)
      console.log(`Successfully generated new API key for company ${companyId}`);
      
      return res.json({ 
        success: true,
        apiKey,
        message: 'API key generated successfully'
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to generate API key',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
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

  /**
   * Get company information by subdomain
   * This is a public endpoint that doesn't require authentication
   */
  getCompanyBySubdomain = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { subdomain } = req.params;
      
      if (!subdomain) {
        return res.status(400).json({ error: 'Subdomain is required' });
      }
      
      const company = await this.companiesService.getCompanyBySubdomain(subdomain);
      
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      // Return only public information
      return res.json({
        id: company.id,
        name: company.name,
        subdomain: company.subdomain,
        logo: (company.images as any)?.logo || null,
        success: true
      });
    } catch (error) {
      console.error('Error fetching company by subdomain:', error);
      return res.status(500).json({ error: 'Failed to retrieve company information' });
    }
  };

  /**
   * Get company information by API key
   * This is a public endpoint that doesn't require authentication
   * Used for iframe integration and API authentication
   */
  getCompanyByApiKey = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const { apiKey, domain } = req.query;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }
      
      // Find company by API key
      const settings = await this.companySettingsService.findCompanyByApiKey(apiKey as string);
      
      if (!settings || !settings.company) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      
      // Check if domain is allowed for iframe embedding
      if (domain) {
        const domainStr = domain as string;
        const integrationSettings = settings.integrationSettings || {};
        
        // Check if this is an iframe request and if iframe integration is enabled
        if (req.headers['sec-fetch-dest'] === 'iframe' && 
            (!integrationSettings.iframeIntegration?.enabled ||
             (integrationSettings.iframeIntegration.allowedDomains?.length &&
              !integrationSettings.iframeIntegration.allowedDomains.includes(domainStr)))) {
          return res.status(403).json({ error: 'Domain not authorized for iframe embedding' });
        }
        
        // Check if this is a redirect request and if redirect integration is enabled
        if (req.headers.referer && 
            (!integrationSettings.redirectIntegration?.enabled ||
             (integrationSettings.redirectIntegration.allowedDomains?.length &&
              !integrationSettings.redirectIntegration.allowedDomains.includes(domainStr)))) {
          return res.status(403).json({ error: 'Domain not authorized for redirect integration' });
        }
        
        // Check API origin
        if (integrationSettings.allowedOrigins?.length &&
            !integrationSettings.allowedOrigins.includes(domainStr)) {
          return res.status(403).json({ error: 'Origin not allowed for API access' });
        }
      }
      
      // Return company information
      return res.json({
        id: settings.company.id,
        name: settings.company.name,
        subdomain: settings.company.subdomain,
        logo: settings.company.images?.logo || null
      });
      
    } catch (error) {
      console.error('Error validating API key:', error);
      return res.status(500).json({ error: 'Failed to validate API key' });
    }
  };
} 