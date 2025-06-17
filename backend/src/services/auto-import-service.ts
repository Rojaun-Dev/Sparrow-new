import { chromium } from 'playwright';
import { CompanySettingsService } from './company-settings-service';
import { ImportService } from './import-service';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { AuditLogsService, AuditLogData } from './audit-logs-service';
import { randomUUID } from 'crypto';

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

export class AutoImportService {
  private companySettingsService: CompanySettingsService;
  private importService: ImportService;
  private auditLogsService: AuditLogsService;
  private activeImports: Map<string, AutoImportStatus>;
  private downloadPath: string;

  constructor() {
    this.companySettingsService = new CompanySettingsService();
    this.importService = new ImportService();
    this.auditLogsService = new AuditLogsService();
    this.activeImports = new Map();
    this.downloadPath = path.join(os.tmpdir(), 'sparrowx-magaya-imports');
    
    // Ensure download directory exists
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  /**
   * Start an auto-import process from Magaya
   */
  async startAutoImport(options: AutoImportOptions): Promise<{ id: string }> {
    // Get company settings to retrieve Magaya credentials
    const settings = await this.companySettingsService.getCompanySettings(options.companyId);
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
   * This method is called asynchronously and should not throw errors directly
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
      
      // Launch browser with more generous timeout for slow connections
      browser = await chromium.launch({ 
        headless: true,
        timeout: 60000 // 60 second timeout for slow connections
      });
      
      // Create context with download path
      const context = await browser.newContext({
        acceptDownloads: true,
        downloadsPath: downloadFolder,
        viewport: { width: 1920, height: 1080 } // Set larger viewport for better reliability
      });
      
      // Navigate to Magaya LiveTrack
      const page = await context.newPage();
      
      // Add additional logging for navigation events
      page.on('console', (msg: { text: () => string }) => console.log(`Browser console: ${msg.text()}`));
      page.on('pageerror', (err: Error) => console.error(`Browser page error: ${err.message}`));
      
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
      await page.click(loginButtonSelector);
      console.log('Login button clicked');
      
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
        
        // Wait for the Cargo Detail entry in the left menu to appear
        // We need to locate the Cargo Detail menu item in the left sidebar
        console.log('Waiting for menu to load...');
        
        // First wait for the sidebar menu to appear
        await page.waitForSelector('.entryView', { 
          timeout: 30000,
          state: 'visible'
        });
        
        console.log('Menu loaded successfully');
      } catch (loginError) {
        console.error('Login failed:', loginError);
        throw new Error(`Login failed: ${loginError instanceof Error ? loginError.message : 'Unknown error'}`);
      }
      
      // Find and click on Cargo Detail item in the sidebar menu
      console.log('Looking for Cargo Detail menu item');
      
      // Using the exact HTML structure from the provided files
      // First wait a bit to ensure the sidebar is fully rendered
      await page.waitForTimeout(2000);
      
      // Looking specifically for the Cargo Detail menu item with its specific structure
      const cargoDetailSelector = '.entryView div .cargo_detail_icon';
      const cargoDetailFound = await page.$(cargoDetailSelector)
        .then((element: any) => !!element)
        .catch(() => false);
      
      if (!cargoDetailFound) {
        // Try alternative selector
        const altSelector = '.entryView:has-text("Cargo Detail")';
        const altFound = await page.$(altSelector)
          .then((element: any) => !!element)
          .catch(() => false);
          
        if (!altFound) {
          console.error('Could not find Cargo Detail menu item');
          throw new Error('Could not find Cargo Detail menu item in the sidebar');
        }
        
        // Click using alternative selector
        console.log('Clicking on Cargo Detail using alternative selector');
        await page.click(altSelector);
      } else {
        // Click on the parent of the icon to activate the menu item
        console.log('Clicking on Cargo Detail menu item using icon parent');
        await page.click(`${cargoDetailSelector} >> xpath=./ancestor::div[contains(@class, "entryView")]`);
      }
      
      // Wait for the cargo detail page to load
      status.progress = 40;
      this.activeImports.set(importId, status);
      console.log('Waiting for Cargo Detail page to load');
      
      // Wait for the cargo detail page to fully load
      await page.waitForTimeout(5000); // Give more time for page transition
      
      // Try multiple selectors for the date filter button since the UI may vary
      console.log('Looking for Dates dropdown button');
      
      // First try the specific XPath the user provided
      const dateFilterXPath = '//*[@id="combo-1069-inputEl"]';
      const dateFilterExists = await page.$(dateFilterXPath)
        .then((element: any) => !!element)
        .catch(() => false);
        
      if (dateFilterExists) {
        console.log('Found date filter by XPath ID');
        // First click to open the combo box
        await page.click(dateFilterXPath);
      } else {
        // Try various other selectors
        const dateButtonSelectors = [
          'button[title="Dates"]',
          'button:has-text("Dates")',
          '.x-btn:has-text("Dates")',
          '.x-form-trigger' // Fallback to any combo box trigger
        ];
        
        let dateButtonFound = false;
        for (const selector of dateButtonSelectors) {
          const exists = await page.$(selector)
            .then((element: any) => !!element)
            .catch(() => false);
            
          if (exists) {
            console.log(`Found date button using selector: ${selector}`);
            await page.click(selector);
            dateButtonFound = true;
            break;
          }
        }
        
        if (!dateButtonFound) {
          console.error('Could not find Dates button using any known selector');
          throw new Error('Could not find Dates button on the Cargo Detail page');
        }
      }
      
      // Wait for dropdown to appear
      await page.waitForTimeout(1000);
      
      // Select date range based on option
      let dateValue = '';
      switch (options.dateRange) {
        case 'today':
          dateValue = 'today';
          break;
        case 'this_week':
          dateValue = 'thisWeekToDate';
          break;
        case 'this_month':
          dateValue = 'thisMonthToDate';
          break;
        default:
          dateValue = 'thisWeekToDate';
      }
      
      console.log(`Selecting date range with value: ${dateValue}`);
      
      // Try multiple approaches to select the date range
      const dateSelectors = [
        `[data-value="${dateValue}"]`,
        `.x-boundlist-item:has-text("${dateValue === 'today' ? 'Today' : 
          dateValue === 'thisWeekToDate' ? 'This Week to Date' : 'This Month to Date'}")`,
        `div[role="option"]:has-text("${dateValue === 'today' ? 'Today' : 
          dateValue === 'thisWeekToDate' ? 'This Week to Date' : 'This Month to Date'}")`
      ];
      
      let dateOptionFound = false;
      for (const selector of dateSelectors) {
        const exists = await page.$(selector)
          .then((element: any) => !!element)
          .catch(() => false);
          
        if (exists) {
          console.log(`Found date option using selector: ${selector}`);
          await page.click(selector);
          dateOptionFound = true;
          break;
        }
      }
      
      if (!dateOptionFound) {
        console.error(`Could not find date option with value: ${dateValue}`);
        throw new Error(`Could not find date option: ${dateValue}`);
      }
      
      console.log('Date range selected');
      
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
      const currentSettings = await this.companySettingsService.getCompanySettings(options.companyId);
      if (currentSettings?.integrationSettings) {
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
    } catch (error) {
      // Update status to failed
      const status = this.activeImports.get(importId);
      if (status) {
        status.status = 'failed';
        status.error = error.message;
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
          error: error.message
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