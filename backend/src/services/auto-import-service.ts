import { chromium } from 'playwright';
import { CompanySettingsService } from './company-settings-service';
import { ImportService } from './import-service';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { AuditLogsService, AuditLogData } from './audit-logs-service';
import { randomUUID } from 'crypto';
import cron, { ScheduledTask } from 'node-cron';
import { db } from '../db';
import { users } from '../db/schema/users';
import { eq, and, or } from 'drizzle-orm';

interface AutoImportOptions {
  userId?: string;
  dateRange: 'today' | 'this_week' | 'this_month';
  companyId: string;
  initiatorUserId: string;
  networkId?: string;
}

interface AutoImportStatus {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  result?: any;
  startTime: Date;
  endTime?: Date;
  progress?: number;
  companyId: string;
  userId?: string;
}

interface CompanySettings {
  integrationSettings?: {
    magayaIntegration?: {
      enabled: boolean;
      username: string;
      password: string;
      networkId?: string;
      dateRangePreference?: 'today' | 'this_week' | 'this_month';
      autoImportEnabled?: boolean;
      lastImportDate?: string;
      cronEnabled?: boolean;
      cronInterval?: number;
    };
  };
}

export class AutoImportService {
  private companySettingsService: CompanySettingsService;
  private importService: ImportService;
  private auditLogsService: AuditLogsService;
  private activeImports: Map<string, AutoImportStatus>;
  private activeCronJobs: Map<string, ScheduledTask>; // Track active cron jobs by companyId
  private downloadPath: string;

  constructor() {
    this.companySettingsService = new CompanySettingsService();
    this.importService = new ImportService();
    this.auditLogsService = new AuditLogsService();
    this.activeImports = new Map();
    this.activeCronJobs = new Map();
    this.downloadPath = path.join(os.tmpdir(), 'sparrowx-magaya-imports');
    
    // Ensure download directory exists
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
    
    // Setup any existing cron jobs
    this.setupCronJobs().catch(err => {
      console.error('Error setting up cron jobs:', err);
    });
  }

  /**
   * Setup cron jobs for all companies that have cron jobs enabled
   */
  private async setupCronJobs(): Promise<void> {
    try {
      // Get all company settings with magaya integration and cron enabled
      const allSettings: any[] = await this.companySettingsService.getAllCompanySettings();
      
      for (const settings of allSettings) {
        const magayaSettings: any = settings?.integrationSettings?.magayaIntegration;
        
        if (magayaSettings?.enabled && 
            magayaSettings?.autoImportEnabled && 
            magayaSettings?.cronEnabled && 
            magayaSettings?.cronInterval) {
          
          await this.scheduleCronJob(settings.companyId, magayaSettings.cronInterval);
        }
      }
      
      console.log(`Setup ${this.activeCronJobs.size} cron jobs for auto-import`);
    } catch (error) {
      console.error('Failed to setup cron jobs:', error);
    }
  }

  /**
   * Schedule a cron job for auto importing data for a specific company
   */
  async scheduleCronJob(companyId: string, intervalHours: number): Promise<void> {
    // First, remove any existing cron job for this company
    this.removeCronJob(companyId);
    
    // Attempt to find an admin user for this company to act as initiator
    const adminUsers = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        or(eq(users.role, 'admin_l1'), eq(users.role, 'admin_l2'))
      ))
      .limit(1);
    
    if (!adminUsers || adminUsers.length === 0) {
      console.error(`Cannot setup cron job for company ${companyId}: No admin users found`);
      return;
    }
    
    const initiatorUserId = adminUsers[0].id;
    
    // Convert hours to cron expression
    // For testing use: '*/1 * * * *' (every minute)
    // For production use proper hour intervals: `0 */${intervalHours} * * *` (e.g., every 8 hours)
    const cronExpression = `0 */${intervalHours} * * *`;
    
    // Create and save the cron job
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Running scheduled auto-import for company ${companyId}`);
        
        // Get the latest settings in case they've changed
        const settings = await this.companySettingsService.getCompanySettings(companyId) as CompanySettings;
        const magayaSettings = settings?.integrationSettings?.magayaIntegration;
        
        if (!magayaSettings?.enabled || !magayaSettings?.autoImportEnabled) {
          console.log(`Auto-import disabled for company ${companyId}, skipping scheduled import`);
          return;
        }
        
        // Run the import task using the admin user as initiator
        await this.startAutoImport({
          dateRange: magayaSettings.dateRangePreference || 'this_week',
          companyId: companyId,
          initiatorUserId: initiatorUserId,
          networkId: magayaSettings.networkId
        });
        
        console.log(`Completed scheduled auto-import for company ${companyId}`);
      } catch (error) {
        console.error(`Error in scheduled auto-import for company ${companyId}:`, error);
      }
    });
    
    // Save the job to our map
    this.activeCronJobs.set(companyId, job);
    
    console.log(`Scheduled cron job for company ${companyId} to run every ${intervalHours} hours`);
    
    // Log this setup in audit logs
    await this.auditLogsService.createLog({
      userId: initiatorUserId,
      companyId: companyId,
      action: 'auto_import_cron_scheduled',
      entityType: 'settings',
      entityId: companyId,
      details: {
        intervalHours,
        cronExpression
      }
    }).catch(e => console.error('Failed to log cron job setup:', e));
  }

  /**
   * Remove a scheduled cron job for a company
   */
  removeCronJob(companyId: string): void {
    const existingJob = this.activeCronJobs.get(companyId);
    if (existingJob) {
      console.log(`Stopping cron job for company ${companyId}`);
      existingJob.stop();
      this.activeCronJobs.delete(companyId);
    }
  }

  /**
   * Update cron settings for a company
   */
  async updateCronSettings(companyId: string, settings: {
    cronEnabled?: boolean,
    cronInterval?: number
  }, userId: string): Promise<void> {
    // Get current settings
    const currentSettings = await this.companySettingsService.getCompanySettings(companyId) as CompanySettings;
    const magayaSettings: any = currentSettings?.integrationSettings?.magayaIntegration || {};
    
    // Update settings
    const updatedMagayaSettings: any = {
      ...magayaSettings,
      cronEnabled: settings.cronEnabled !== undefined ? settings.cronEnabled : magayaSettings.cronEnabled,
      cronInterval: settings.cronInterval || magayaSettings.cronInterval
    };
    
    // Save settings
    const updatedSettings = {
      ...currentSettings.integrationSettings,
      magayaIntegration: updatedMagayaSettings
    };
    
    await this.companySettingsService.updateIntegrationSettings(updatedSettings, companyId);
    
    // Log the changes
    await this.auditLogsService.createLog({
      userId: userId,
      companyId: companyId,
      action: 'auto_import_cron_settings_updated',
      entityType: 'settings',
      entityId: companyId,
      details: {
        cronEnabled: updatedMagayaSettings.cronEnabled,
        cronInterval: updatedMagayaSettings.cronInterval
      }
    });
    
    // If cron is enabled and interval is valid, schedule or update the job
    if (updatedMagayaSettings.enabled !== false &&
        updatedMagayaSettings.autoImportEnabled !== false &&
        updatedMagayaSettings.cronEnabled && 
        updatedMagayaSettings.cronInterval) {
      await this.scheduleCronJob(companyId, updatedMagayaSettings.cronInterval);
    } else {
      // Otherwise remove any existing job
      this.removeCronJob(companyId);
      
      console.log(`Cron job disabled for company ${companyId}`);
    }
  }

  /**
   * Start an auto-import process from Magaya
   */
  async startAutoImport(options: AutoImportOptions): Promise<{ id: string }> {
    // Get company settings to retrieve Magaya credentials
    const settings = await this.companySettingsService.getCompanySettings(options.companyId) as CompanySettings;
    const magayaSettings = settings?.integrationSettings?.magayaIntegration;
    
    if (!magayaSettings?.enabled) {
      throw new Error('Magaya integration is not enabled for this company');
    }
    
    if (!magayaSettings.username || !magayaSettings.password) {
      throw new Error('Magaya credentials are not configured');
    }
    
    // Generate a unique ID for this import
    const importId = randomUUID();
    
    // Create initial status
    const status: AutoImportStatus = {
      id: importId,
      status: 'pending',
      startTime: new Date(),
      companyId: options.companyId,
      userId: options.userId,
    };
    
    this.activeImports.set(importId, status);
    
    // Log auto import initiation
    await this.auditLogsService.createLog({
      userId: options.initiatorUserId,
      companyId: options.companyId,
      action: 'auto_import_initiated',
      entityType: 'package',
      entityId: importId,
      details: {
        targetUserId: options.userId,
        method: 'magaya_auto_import',
        dateRange: options.dateRange,
      }
    });
    
    // Start import process asynchronously
    this.runImportProcess(importId, {
      ...options,
      username: magayaSettings.username,
      password: magayaSettings.password,
      networkId: magayaSettings.networkId
    }).catch(error => {
      console.error('Error in auto import process:', error);
      
      // Update status
      const status = this.activeImports.get(importId);
      if (status) {
        status.status = 'failed';
        status.error = error.message;
        status.endTime = new Date();
        this.activeImports.set(importId, status);
      }
      
      // Log failure
      this.auditLogsService.createLog({
        userId: options.initiatorUserId,
        companyId: options.companyId,
        action: 'auto_import_failed',
        entityType: 'package',
        entityId: importId,
        details: {
          error: error.message
        }
      }).catch(e => console.error('Failed to log auto import failure:', e));
    });
    
    return { id: importId };
  }

  /**
   * Get status of an auto-import process
   */
  getImportStatus(importId: string, companyId: string): AutoImportStatus | undefined {
    const status = this.activeImports.get(importId);
    
    // Only return status if it belongs to the requesting company
    if (status && status.companyId === companyId) {
      return status;
    }
    
    return undefined;
  }

  /**
   * Get all active imports for a company
   */
  getAllImportsForCompany(companyId: string): AutoImportStatus[] {
    const imports: AutoImportStatus[] = [];
    
    for (const status of this.activeImports.values()) {
      if (status.companyId === companyId) {
        imports.push(status);
      }
    }
    
    return imports;
  }

  /**
   * Run the Magaya import process using Playwright
   * This method is called asynchronously and should not throw errors directly... or atleast it should.
   */
  private async runImportProcess(importId: string, options: AutoImportOptions & { username: string; password: string; networkId?: string }): Promise<void> {
    // Update status to in progress
    const status = this.activeImports.get(importId);
    if (!status) return;
    
    status.status = 'in_progress';
    status.progress = 10;
    this.activeImports.set(importId, status);

    let browser;
    try {
      // Create a unique download folder for this import
      const downloadFolder = path.join(this.downloadPath, importId);
      if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder, { recursive: true });
      }
      
      console.log(`Starting Magaya LiveTrack auto-import for company ${options.companyId}`);
      
      // Launch browser in headless mode for production
      browser = await chromium.launch({ 
        headless: true, // Set to false for debugging
        timeout: 60000, // 60 second timeout for slow connections
        slowMo: 100 // Slow down operations by 100ms for better visibility
      });
      
      // Create context with download path
      const context = await browser.newContext({
        acceptDownloads: true,
        // Set viewport for better reliability
        viewport: { width: 1920, height: 1080 } 
      });
      
      // Navigate to Magaya LiveTrack
      const page = await context.newPage();
      
      // Add additional logging for navigation events
      page.on('console', (msg: { text: () => string }) => console.log(`Browser console: ${msg.text()}`));
      page.on('pageerror', (err: Error) => console.error(`Browser page error: ${err.message}`));
      
      // Add more detailed debugging
      page.on('request', request => console.log(`Request: ${request.url()}`));
      page.on('response', response => console.log(`Response: ${response.url()} - ${response.status()}`));
      
      // Enable screenshots for debugging
      const screenshotPath = path.join(downloadFolder, 'screenshots');
      if (!fs.existsSync(screenshotPath)) {
        fs.mkdirSync(screenshotPath, { recursive: true });
      }
      
      // Helper function to take screenshots at key points
      const takeScreenshot = async (name: string) => {
        try {
          await page.screenshot({ 
            path: path.join(screenshotPath, `${name}-${Date.now()}.png`),
            fullPage: true 
          });
          console.log(`Screenshot saved: ${name}`);
        } catch (e) {
          console.error(`Failed to take screenshot ${name}:`, e);
        }
      };
      
      console.log('Navigating to Magaya LiveTrack login page');
      await page.goto('https://tracking.magaya.com/#livetrack', { 
        timeout: 30000,
        waitUntil: 'networkidle' // Wait until network is idle
      });
      
      // Wait for the login form with better error handling
      status.progress = 20;
      this.activeImports.set(importId, status);
      
      console.log('Waiting for login form to load');
      
      // First check if network ID field is present
      const networkIdSelector = '//*[@id="numberfield-1012-inputEl"]';
      const networkIdExists = await page.waitForSelector(networkIdSelector, { 
        timeout: 20000,
        state: 'visible' 
      }).then(() => true).catch(() => false);
      
      // Use exact XPaths for login fields
      console.log('Filling login form fields using XPaths...');
      
      // Fill Network ID field if provided
      if (options.networkId) {
        if (networkIdExists) {
          console.log(`Filling Network ID: ${options.networkId}`);
          await page.fill(networkIdSelector, options.networkId);
          console.log('Network ID field filled');
        } else {
          console.warn('Network ID field not found, but networkId was provided');
        }
      } else {
        console.log('No Network ID provided, skipping this field');
      }
      
      // Fill username field
      console.log(`Filling username: ${options.username}`);
      
      const usernameSelector = '//*[@id="textfield-1013-inputEl"]';
      await page.waitForSelector(usernameSelector, { 
        timeout: 20000,
        state: 'visible'
      });
      await page.fill(usernameSelector, options.username);
      console.log('Username field filled');
      
      // Fill password field
      console.log('Filling password field');
      
      const passwordSelector = '//*[@id="textfield-1014-inputEl"]';
      await page.waitForSelector(passwordSelector, { 
        timeout: 20000,
        state: 'visible'
      });
      await page.fill(passwordSelector, options.password);
      console.log('Password field filled');
      
      // Click login button
      const loginButtonSelector = '//*[@id="btnmainlogin"]';
      await page.waitForSelector(loginButtonSelector, { 
        timeout: 20000,
        state: 'visible'
      });
      
      console.log('Clicking login button');
      await takeScreenshot('before-login');
      await page.click(loginButtonSelector);
      console.log('Login button clicked');
      await takeScreenshot('after-login-click');
      
      // Wait for the main page to load
      status.progress = 30;
      this.activeImports.set(importId, status);
      
      // Wait for successful login and check for error messages
      try {
        // First check if there's a login error message
        console.log('Checking for login error messages');
        const errorExists = await page.waitForSelector('.x-message-error, .error-message, .alert-error', { 
          timeout: 5000,
          state: 'visible' 
        }).then(() => true).catch(() => false);
        
        if (errorExists) {
          const errorMessage = await page.locator('.error-message, .alert-error, .x-message-error')
            .textContent()
            .then((text: string | null) => text?.trim() || 'Unknown login error')
            .catch(() => 'Login failed');
          
          throw new Error(`Login failed: ${errorMessage}`);
        }
        
        console.log('No login errors detected, waiting for dashboard to load');
        
        // Wait for the main dashboard to load - try multiple selectors
        console.log('Waiting for dashboard to load...');
        
        // Try multiple selectors that might indicate successful login
        const dashboardSelectors = [
          '.entryView', // Original selector
          '.x-panel-body', // General panel body
          '.x-grid-view', // Grid view that often appears after login
          '.x-toolbar', // Toolbar that's usually present in the dashboard
          '#ext-comp-1001', // Common component ID in Magaya
          'div.x-panel-default' // Default panel class
        ];
        
        let dashboardLoaded = false;
        for (const selector of dashboardSelectors) {
          try {
            console.log(`Trying selector: ${selector}`);
            await page.waitForSelector(selector, { 
              timeout: 5000, // Short timeout for each attempt
              state: 'visible'
            });
            console.log(`Dashboard detected using selector: ${selector}`);
            dashboardLoaded = true;
            break;
          } catch (e) {
            console.log(`Selector ${selector} not found, trying next...`);
          }
        }
        
        if (!dashboardLoaded) {
          // If none of the selectors worked, try waiting for any content to load
          console.log('No specific selectors found, waiting for any content...');
          await page.waitForFunction(`
            document.body.textContent && document.body.textContent.length > 100
          `, { timeout: 10000 });
        }
        
        // Give a little extra time for everything to render
        await page.waitForTimeout(3000);
        
        console.log('Dashboard appears to be loaded');
        await takeScreenshot('dashboard-loaded');
      } catch (loginError) {
        console.error('Login failed:', loginError);
        throw new Error(`Login failed: ${loginError instanceof Error ? loginError.message : 'Unknown error'}`);
      }
      
      // Find and click on Cargo Detail item in the sidebar menu
      console.log('Looking for Cargo Detail menu item');
      
      // First wait a bit to ensure the sidebar is fully rendered
      await page.waitForTimeout(3000);
      
      // Try multiple selectors for finding the Cargo Detail menu item
      const cargoDetailSelectors = [
        // Original selector
        '.entryView div .cargo_detail_icon',
        // Text-based selectors
        'div:has-text("Cargo Detail")',
        '[title*="Cargo Detail"]',
        'span:has-text("Cargo Detail")',
        // Generic menu item selectors
        '.x-menu-item:has-text("Cargo")',
        '.x-menu-item:has-text("Detail")',
        // By XPath
        '//div[contains(text(), "Cargo Detail")]',
        '//span[contains(text(), "Cargo Detail")]'
      ];
      
      let cargoDetailFound = false;
      for (const selector of cargoDetailSelectors) {
        try {
          console.log(`Trying to find Cargo Detail with selector: ${selector}`);
          const element = await page.$(selector);
          if (element) {
            console.log(`Found Cargo Detail using selector: ${selector}`);
            await element.click();
            cargoDetailFound = true;
            break;
          }
        } catch (e) {
          console.log(`Selector ${selector} not found or couldn't be clicked`);
        }
      }
      
      if (!cargoDetailFound) {
        // If we can't find the Cargo Detail specifically, try to find any menu item
        // that might lead to the cargo/shipment data
        const genericSelectors = [
          'div:has-text("Shipment")',
          'div:has-text("Cargo")',
          'div:has-text("Tracking")',
          '.x-grid-view', // Sometimes the grid is already visible
          '.x-panel-body' // Or a panel with data
        ];
        
        for (const selector of genericSelectors) {
          try {
            console.log(`Trying generic selector: ${selector}`);
            const element = await page.$(selector);
            if (element) {
              console.log(`Found alternative navigation element: ${selector}`);
              await element.click();
              cargoDetailFound = true;
              break;
            }
          } catch (e) {
            console.log(`Generic selector ${selector} not found or couldn't be clicked`);
          }
        }
      }
      
      if (!cargoDetailFound) {
        console.log('Could not find Cargo Detail menu item, but will try to continue anyway');
      } else {
        console.log('Successfully clicked on a menu item that should lead to cargo data');
      }
      
      // Wait for the cargo detail page to load
      status.progress = 40;
      this.activeImports.set(importId, status);
      console.log('Waiting for Cargo Detail page to load');
      
      // Wait for the cargo detail page to fully load
      await page.waitForTimeout(5000); // Give more time for page transition
      await takeScreenshot('after-cargo-detail-click');
      
      // Directly type into the date range field instead of using dropdown
      console.log('Setting date range by directly typing into the field');
      
      // Update to use the correct date input field ID (combo-1069 is dates, combo-1070 is search filter)
      const dateInputSelector = '//*[@id="combo-1069-inputEl"]';
      const dateInputExists = await page.$(dateInputSelector)
        .then((element: any) => !!element)
        .catch(() => false);
        
      if (dateInputExists) {
        console.log('Found date input field');
        
        // Map our date range options to the actual text to type
        let dateDisplayText = '';
        switch (options.dateRange) {
          case 'today':
            dateDisplayText = 'Today';
            break;
          case 'this_week':
            dateDisplayText = 'This week to date';
            break;
          case 'this_month':
            dateDisplayText = 'This month to date';
            break;
          default:
            dateDisplayText = 'This week to date';
        }
        
        // Clear any existing value and type the date range
        await page.fill(dateInputSelector, '');
        await page.type(dateInputSelector, dateDisplayText);
        
        // Press Enter to confirm
        await page.press(dateInputSelector, 'Enter');
        
        console.log(`Date range set to: "${dateDisplayText}"`);
      } else {
        console.error('Could not find date input field using selector: ' + dateInputSelector);
        throw new Error('Could not find date input field');
      }
      
      // Wait for data to load
      status.progress = 50;
      this.activeImports.set(importId, status);
      await page.waitForTimeout(5000); // Give more time for data to load
      
      // Click on Actions dropdown - try multiple selectors
      console.log('Looking for Actions button');
      
      // First try the specific XPath the user provided
      const actionsXPath = '//*[@id="splitbutton-1211"]';
      const actionsXPathExists = await page.$(actionsXPath)
        .then((element: any) => !!element)
        .catch(() => false);
        
      if (actionsXPathExists) {
        console.log('Found Actions button by XPath ID');
        await page.click(actionsXPath);
      } else {
        // Try various other selectors
        const actionSelectors = [
          'button[title="Actions"]',
          'button:has-text("Actions")',
          '.x-btn:has-text("Actions")',
          '.x-btn:has(span:has-text("Actions"))'
        ];
        
        let actionsFound = false;
        for (const selector of actionSelectors) {
          const exists = await page.$(selector)
            .then((element: any) => !!element)
            .catch(() => false);
            
          if (exists) {
            console.log(`Found Actions button using selector: ${selector}`);
            await page.click(selector);
            actionsFound = true;
            break;
          }
        }
        
        if (!actionsFound) {
          console.error('Could not find Actions button using any known selector');
          throw new Error('Could not find Actions button on the Cargo Detail page');
        }
      }
      
      // Wait for the dropdown menu to appear
      await page.waitForTimeout(1000);
      
      // Click on Export - try multiple selectors
      console.log('Looking for Export option');
      
      // First try the specific XPath the user provided
      const exportXPath = '//*[@id="menuitem-1236-itemEl"]';
      const exportXPathExists = await page.$(exportXPath)
        .then((element: any) => !!element)
        .catch(() => false);
        
      if (exportXPathExists) {
        console.log('Found Export option by XPath ID');
        await page.click(exportXPath);
      } else {
        // Try various other selectors
        const exportSelectors = [
          '[title="Export"]', 
          'span:has-text("Export")',
          '.x-menu-item:has-text("Export")',
          '.x-menu-item-text:has-text("Export")'
        ];
        
        let exportFound = false;
        for (const selector of exportSelectors) {
          const exists = await page.$(selector)
            .then((element: any) => !!element)
            .catch(() => false);
            
          if (exists) {
            console.log(`Found Export option using selector: ${selector}`);
            await page.click(selector);
            exportFound = true;
            break;
          }
        }
        
        if (!exportFound) {
          console.error('Could not find Export option using any known selector');
          throw new Error('Could not find Export option in the Actions menu');
        }
      }
      
      // Wait for the submenu to appear
      await page.waitForTimeout(1000);
      
      // Click on Download option
      status.progress = 60;
      this.activeImports.set(importId, status);
      
      console.log('Looking for Download option');
      
      // Create a variable for the download promise
      let downloadPromise;
      
      // First try the specific XPath the user provided
      const downloadXPath = '//*[@id="button-1262"]';
      const downloadXPathExists = await page.$(downloadXPath)
        .then((element: any) => !!element)
        .catch(() => false);
        
      if (downloadXPathExists) {
        console.log('Found Download button by XPath ID');
        // Start download and wait for it
        downloadPromise = page.waitForEvent('download', { timeout: 60000 });
        await page.click(downloadXPath);
        console.log('Clicked Download button');
      } else {
        // Try various other selectors
        const downloadSelectors = [
          '[title="Download"]',
          'span:has-text("Download")',
          '.x-menu-item:has-text("Download")',
          '.x-menu-item-text:has-text("Download")'
        ];
        
        let downloadFound = false;
        
        for (const selector of downloadSelectors) {
          const exists = await page.$(selector)
            .then((element: any) => !!element)
            .catch(() => false);
            
          if (exists) {
            console.log(`Found Download option using selector: ${selector}`);
            // Start download and wait for it
            downloadPromise = page.waitForEvent('download', { timeout: 60000 });
            await page.click(selector);
            console.log(`Clicked Download option using selector: ${selector}`);
            downloadFound = true;
            break;
          }
        }
        
        if (!downloadFound) {
          console.error('Could not find Download option using any known selector');
          throw new Error('Could not find Download option in the Export submenu');
        }
      }
      
      if (!downloadPromise) {
        console.error('Download promise was not initialized');
        throw new Error('Failed to start download process');
      }
      
      console.log('Waiting for download to start');
      const download = await downloadPromise;
      console.log('Download started');
      
      // Wait for download to complete
      status.progress = 70;
      this.activeImports.set(importId, status);
      console.log('Waiting for download to complete');
      const filePath = await download.path();
      console.log(`Download completed: ${filePath}`);
      
      if (!filePath) {
        throw new Error('Download failed - no file path received');
      }
      
      // Read the CSV file
      console.log('Reading downloaded CSV file');
      const csvContent = fs.readFileSync(filePath, 'utf8');
      
      // Import CSV using existing import service
      status.progress = 80;
      this.activeImports.set(importId, status);
      console.log('Starting to import CSV data');
      
      const result = await this.importService.importPackagesFromCsv(
        csvContent,
        options.userId,
        options.companyId
      );
      console.log('CSV import completed successfully');
      
      // Update status to completed
      status.status = 'completed';
      status.progress = 100;
      status.result = result;
      status.endTime = new Date();
      this.activeImports.set(importId, status);
      
      // Log successful import completion
      const auditData: AuditLogData = {
        userId: options.initiatorUserId,
        companyId: options.companyId,
        action: 'auto_import_completed',
        entityType: 'package',
        entityId: importId,
        details: {
          targetUserId: options.userId,
          method: 'magaya_auto_import',
          result: {
            totalRecords: result.totalRecords,
            successCount: result.successCount,
            failedCount: result.failedCount,
            skippedCount: result.skippedCount,
          }
        }
      };
      
      await this.auditLogsService.createLog(auditData);
      
      // Update company settings with last import date
      const currentSettings = await this.companySettingsService.getCompanySettings(options.companyId) as CompanySettings;
      if (currentSettings?.integrationSettings?.magayaIntegration) {
        const updatedSettings = {
          ...currentSettings.integrationSettings,
          magayaIntegration: {
            ...currentSettings.integrationSettings.magayaIntegration,
            lastImportDate: new Date().toISOString()
          }
        };
        
        await this.companySettingsService.updateIntegrationSettings(updatedSettings, options.companyId);
      }
      
      // Clean up download file
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Try to clean up the download folder
        if (fs.existsSync(downloadFolder)) {
          fs.rmdirSync(downloadFolder, { recursive: true });
        }
      } catch (cleanupErr) {
        console.error('Failed to clean up download files:', cleanupErr);
      }
    } catch (error: any) {
      // Update status to failed
      const status = this.activeImports.get(importId);
      if (status) {
        status.status = 'failed';
        status.error = error.message || 'Unknown error';
        status.endTime = new Date();
        this.activeImports.set(importId, status);
      }
      
      // Log failure
      await this.auditLogsService.createLog({
        userId: options.initiatorUserId,
        companyId: options.companyId,
        action: 'auto_import_failed',
        entityType: 'package',
        entityId: importId,
        details: {
          error: error.message || 'Unknown error'
        }
      });
      
      throw error; // Re-throw for outer catch
    } finally {
      // Close the browser
      if (browser) {
        await browser.close();
      }
    }
  }
} 