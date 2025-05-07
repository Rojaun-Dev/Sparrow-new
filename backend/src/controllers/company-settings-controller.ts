import { Request, Response } from 'express';
import { CompanySettingsService } from '../services/company-settings-service';
import { z } from 'zod';

export class CompanySettingsController {
  private companySettingsService: CompanySettingsService;

  constructor() {
    this.companySettingsService = new CompanySettingsService();
  }

  /**
   * Get company settings
   */
  getCompanySettings = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const settings = await this.companySettingsService.getCompanySettings(companyId);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      res.status(500).json({ error: 'Failed to retrieve company settings' });
    }
  };

  /**
   * Update all company settings
   */
  updateCompanySettings = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const settings = await this.companySettingsService.updateCompanySettings(req.body, companyId);
      res.json(settings);
    } catch (error) {
      console.error('Error updating company settings:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid settings data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update company settings' });
      }
    }
  };

  /**
   * Update shipping rates
   */
  updateShippingRates = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const settings = await this.companySettingsService.updateShippingRates(req.body, companyId);
      res.json(settings);
    } catch (error) {
      console.error('Error updating shipping rates:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid shipping rates data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update shipping rates' });
      }
    }
  };

  /**
   * Update handling fees
   */
  updateHandlingFees = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const settings = await this.companySettingsService.updateHandlingFees(req.body, companyId);
      res.json(settings);
    } catch (error) {
      console.error('Error updating handling fees:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid handling fees data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update handling fees' });
      }
    }
  };

  /**
   * Update customs fees
   */
  updateCustomsFees = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const settings = await this.companySettingsService.updateCustomsFees(req.body, companyId);
      res.json(settings);
    } catch (error) {
      console.error('Error updating customs fees:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid customs fees data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update customs fees' });
      }
    }
  };

  /**
   * Update tax rates
   */
  updateTaxRates = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const settings = await this.companySettingsService.updateTaxRates(req.body, companyId);
      res.json(settings);
    } catch (error) {
      console.error('Error updating tax rates:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid tax rates data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update tax rates' });
      }
    }
  };

  /**
   * Update notification settings
   */
  updateNotificationSettings = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const settings = await this.companySettingsService.updateNotificationSettings(req.body, companyId);
      res.json(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid notification settings data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update notification settings' });
      }
    }
  };

  /**
   * Update theme settings
   */
  updateThemeSettings = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const settings = await this.companySettingsService.updateThemeSettings(req.body, companyId);
      res.json(settings);
    } catch (error) {
      console.error('Error updating theme settings:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid theme settings data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update theme settings' });
      }
    }
  };

  /**
   * Calculate shipping cost
   */
  calculateShippingCost = async (req: Request, res: Response) => {
    try {
      const companyId = req.companyId;
      const { weight, expressShipping, location } = req.body;
      
      if (typeof weight !== 'number' || weight <= 0) {
        return res.status(400).json({ error: 'Valid weight must be provided' });
      }
      
      const cost = await this.companySettingsService.calculateShippingCost(
        companyId,
        weight,
        expressShipping,
        location
      );
      
      res.json({ cost });
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      res.status(500).json({ error: 'Failed to calculate shipping cost', message: error.message });
    }
  };
} 