import { z } from 'zod';
import { InvoicesRepository } from '../repositories/invoices-repository';
import { InvoiceItemsRepository } from '../repositories/invoice-items-repository';
import { UsersRepository } from '../repositories/users-repository';
import { PackagesService } from './packages-service';
import { AppError } from '../utils/app-error';
import { invoiceStatusEnum } from '../db/schema/invoices';

// Validation schema for invoice creation
export const createInvoiceSchema = z.object({
  userId: z.string().uuid(),
  invoiceNumber: z.string().min(3).max(50).optional(), // Auto-generated if not provided
  status: z.enum(invoiceStatusEnum.enumValues).default('draft'),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  subtotal: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

// Validation schema for invoice update
export const updateInvoiceSchema = createInvoiceSchema.partial();

// Backend Invoice type
export interface Invoice {
  id: string;
  companyId: string;
  userId: string;
  invoiceNumber: string;
  status: string;
  issueDate: Date | string;
  dueDate: Date | string;
  subtotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  notes?: string;
  items?: any[];
  feeBreakdown?: Record<string, number>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class InvoicesService {
  private invoicesRepository: InvoicesRepository;
  private invoiceItemsRepository: InvoiceItemsRepository;
  private usersRepository: UsersRepository;
  private packagesService: PackagesService;

  constructor() {
    this.invoicesRepository = new InvoicesRepository();
    this.invoiceItemsRepository = new InvoiceItemsRepository();
    this.usersRepository = new UsersRepository();
    this.packagesService = new PackagesService();
  }

  /**
   * Get all invoices for a company (paginated)
   */
  async getAllInvoices(companyId: string, params: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    // Default values
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    return this.invoicesRepository.search(companyId, { page, pageSize, sortBy, sortOrder });
  }

  /**
   * Get an invoice by ID with company isolation
   */
  async getInvoiceById(id: string, companyId: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findById(id, companyId);
    
    if (!invoice) {
      throw AppError.notFound('Invoice not found');
    }
    // Fetch invoice items and attach to invoice
    const InvoiceItemsRepository = (await import('../repositories/invoice-items-repository')).InvoiceItemsRepository;
    const invoiceItemsRepo = new InvoiceItemsRepository();
    let items = await invoiceItemsRepo.findByInvoiceId(id, companyId);
    // Convert unitPrice and lineTotal to numbers for each item
    items = items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })) as any[];
    const fullInvoice = { ...invoice, items } as Invoice;
    // Runtime check for required properties
    if (
      typeof fullInvoice.userId !== 'string' ||
      fullInvoice.totalAmount === undefined || fullInvoice.totalAmount === null || isNaN(Number(fullInvoice.totalAmount)) ||
      typeof fullInvoice.status !== 'string'
    ) {
      throw new Error('Invoice is missing required properties (userId, totalAmount, status)');
    }
    return fullInvoice;
  }

  /**
   * Get invoices by user ID with company isolation
   */
  async getInvoicesByUserId(userId: string, companyId: string) {
    // Verify user exists in this company
    const user = await this.usersRepository.findById(userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    return this.invoicesRepository.findByUserId(userId, companyId);
  }

  /**
   * Get invoices by status with company isolation
   */
  async getInvoicesByStatus(status: string, companyId: string) {
    // Validate status
    if (!Object.values(invoiceStatusEnum.enumValues).includes(status as any)) {
      throw AppError.badRequest('Invalid invoice status');
    }
    
    return this.invoicesRepository.findByStatus(status, companyId);
  }

  /**
   * Create a new invoice with company isolation
   */
  async createInvoice(data: z.infer<typeof createInvoiceSchema>, companyId: string) {
    // Validate data
    const validatedData = createInvoiceSchema.parse(data);
    
    // Check if user exists in this company
    const user = await this.usersRepository.findById(validatedData.userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Generate invoice number if not provided
    if (!validatedData.invoiceNumber) {
      validatedData.invoiceNumber = await this.generateInvoiceNumber(companyId);
    }
    
    // Set issue date to now if not provided
    if (!validatedData.issueDate) {
      validatedData.issueDate = new Date();
    }
    
    // Set due date to 30 days from issue date if not provided
    if (!validatedData.dueDate) {
      const dueDate = new Date(validatedData.issueDate);
      dueDate.setDate(dueDate.getDate() + 30);
      validatedData.dueDate = dueDate;
    }
    
    return this.invoicesRepository.create(validatedData, companyId);
  }

  /**
   * Update an invoice with company isolation
   */
  async updateInvoice(id: string, data: z.infer<typeof updateInvoiceSchema>, companyId: string) {
    // Validate data
    const validatedData = updateInvoiceSchema.parse(data);
    
    // Check if invoice exists
    const invoice = await this.invoicesRepository.findById(id, companyId);
    if (!invoice) {
      throw AppError.notFound('Invoice not found');
    }
    
    // Allow full updates only for draft invoices
    if (invoice.status === 'draft') {
      // If changing user, verify the new user exists
      if (validatedData.userId && validatedData.userId !== invoice.userId) {
        const user = await this.usersRepository.findById(validatedData.userId, companyId);
        if (!user) {
          throw AppError.notFound('User not found');
        }
      }
      return this.invoicesRepository.update(id, validatedData, companyId);
    }

    // For issued or overdue invoices, only allow status update to 'paid'
    if ((invoice.status === 'issued' || invoice.status === 'overdue') && validatedData.status === 'paid') {
      return this.invoicesRepository.update(id, { status: 'paid' }, companyId);
    }

    // Otherwise, do not allow updates
    throw AppError.badRequest('Cannot update invoices unless they are in draft status (except marking issued/overdue invoices as paid)');
  }

  /**
   * Finalize an invoice (change status from draft to issued)
   */
  async finalizeInvoice(id: string, companyId: string) {
    // Check if invoice exists
    const invoice = await this.invoicesRepository.findById(id, companyId);
    if (!invoice) {
      throw AppError.notFound('Invoice not found');
    }
    
    // Only finalize draft invoices
    if (invoice.status !== 'draft') {
      throw AppError.badRequest('Only draft invoices can be finalized');
    }
    
    // Set issue date to now if not already set
    const updateData: any = {
      status: 'issued',
      issueDate: invoice.issueDate || new Date(),
    };
    
    // Set due date to 30 days from issue date if not already set
    if (!invoice.dueDate) {
      const dueDate = new Date(updateData.issueDate);
      dueDate.setDate(dueDate.getDate() + 30);
      updateData.dueDate = dueDate;
    }
    
    return this.invoicesRepository.update(id, updateData, companyId);
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(id: string, companyId: string) {
    // Check if invoice exists
    const invoice = await this.invoicesRepository.findById(id, companyId);
    if (!invoice) {
      throw AppError.notFound('Invoice not found');
    }
    
    // Don't allow cancellation of paid invoices
    if (invoice.status === 'paid') {
      throw AppError.badRequest('Cannot cancel paid invoices');
    }
    
    // Get packages associated with this invoice before unlinking
    const packages = await this.packagesService.getPackagesByInvoiceId(id, companyId);
    
    // Delete all invoice items to unlink packages from the cancelled invoice
    await this.invoiceItemsRepository.deleteByInvoiceId(id, companyId);
    
    // Revert package statuses back to 'processed' if they were 'ready_for_pickup'
    // This allows them to be included in future invoices
    if (packages && packages.length > 0) {
      const revertPromises = packages
        .filter(pkg => pkg.status === 'ready_for_pickup')
        .map(pkg => 
          this.packagesService.updatePackage(pkg.id, { status: 'processed' }, companyId)
        );
      
      if (revertPromises.length > 0) {
        await Promise.all(revertPromises);
        console.log(`Reverted ${revertPromises.length} packages back to 'processed' status after invoice cancellation`);
      }
    }
    
    // Update the invoice status to cancelled
    const updatedInvoice = await this.invoicesRepository.update(id, { status: 'cancelled' }, companyId);
    
    console.log(`Cancelled invoice ${id} and unlinked ${packages?.length || 0} packages`);
    
    return updatedInvoice;
  }

  /**
   * Delete an invoice with company isolation (only for draft invoices)
   */
  async deleteInvoice(id: string, companyId: string) {
    // Check if invoice exists
    const invoice = await this.invoicesRepository.findById(id, companyId);
    if (!invoice) {
      throw AppError.notFound('Invoice not found');
    }
    
    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      throw AppError.badRequest('Only draft invoices can be deleted');
    }
    
    return this.invoicesRepository.delete(id, companyId);
  }

  /**
   * Search invoices with various filters
   */
  async searchInvoices(
    companyId: string,
    searchParams: {
      invoiceNumber?: string;
      userId?: string;
      status?: string;
      issueDateFrom?: Date;
      issueDateTo?: Date;
      dueDateFrom?: Date;
      dueDateTo?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    return this.invoicesRepository.search(companyId, searchParams);
  }

  /**
   * Generate a sequential invoice number
   */
  private async generateInvoiceNumber(companyId: string): Promise<string> {
    // Get company code (first 3 chars of company ID)
    const companyCode = companyId.substring(0, 3).toUpperCase();
    
    // Get current date components
    const now = new Date();
    const year = now.getFullYear().toString().substring(2); // Last 2 digits
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Get the count of invoices for this company
    const invoices = await this.invoicesRepository.findAll(companyId);
    const count = invoices.length + 1;
    
    // Format: [Company Code]-[Year]-[Month]-[Sequential Number]
    // Example: ABC-23-05-0042
    return `${companyCode}-${year}-${month}-${count.toString().padStart(4, '0')}`;
  }

  /**
   * Get invoice by package ID
   * @param packageId - The package ID
   * @param companyId - The company ID
   */
  async getInvoiceByPackageId(packageId: string, companyId: string) {
    try {
      const invoice = await this.invoicesRepository.findByPackageId(packageId, companyId);
      
      if (!invoice) {
        throw new AppError('Invoice not found for this package', 404);
      }
      
      return invoice;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error(`Failed to get invoice for package: ${error.message}`);
    }
  }
} 