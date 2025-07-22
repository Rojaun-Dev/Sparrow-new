import { DutyFeesRepository } from '../repositories/duty-fees-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { AppError } from '../utils/app-error';
import { CreateDutyFeeRequest, UpdateDutyFeeRequest, DutyFee } from '../types/duty-fee';

export class DutyFeesService {
  private dutyFeesRepository: DutyFeesRepository;
  private packagesRepository: PackagesRepository;

  constructor() {
    this.dutyFeesRepository = new DutyFeesRepository();
    this.packagesRepository = new PackagesRepository();
  }

  /**
   * Get all duty fees for a company
   */
  async getAllDutyFees(companyId: string): Promise<DutyFee[]> {
    return this.dutyFeesRepository.findAll(companyId);
  }

  /**
   * Get duty fees for a specific package
   */
  async getDutyFeesByPackageId(packageId: string, companyId: string): Promise<DutyFee[]> {
    // Verify package exists and belongs to company
    const packageExists = await this.packagesRepository.findById(packageId, companyId);
    if (!packageExists) {
      throw new AppError('Package not found', 404);
    }

    const dutyFees = await this.dutyFeesRepository.findByPackageId(packageId, companyId);
    return dutyFees as DutyFee[];
  }

  /**
   * Get a specific duty fee by ID
   */
  async getDutyFeeById(id: string, companyId: string): Promise<DutyFee> {
    const dutyFee = await this.dutyFeesRepository.findById(id, companyId);
    if (!dutyFee) {
      throw new AppError('Duty fee not found', 404);
    }
    return dutyFee as DutyFee;
  }

  /**
   * Create a new duty fee
   */
  async createDutyFee(data: CreateDutyFeeRequest, companyId: string): Promise<DutyFee> {
    // Verify package exists and belongs to company
    const existingPackage = await this.packagesRepository.findById(data.packageId, companyId);
    if (!existingPackage) {
      throw new AppError('Package not found', 404);
    }

    // Check if package is in a state that allows duty fee modification
    const restrictedStatuses = ['ready_for_pickup', 'delivered'];
    if (restrictedStatuses.includes(existingPackage.status)) {
      throw new AppError('Cannot add duty fees to packages that are ready for pickup or delivered', 400);
    }

    // Validate custom fee type when fee type is "Other"
    if (data.feeType === 'Other' && (!data.customFeeType || data.customFeeType.trim() === '')) {
      throw new AppError('Custom fee type is required when fee type is "Other"', 400);
    }

    // Create the duty fee
    const dutyFee = await this.dutyFeesRepository.create(data, companyId);
    if (!dutyFee) {
      throw new AppError('Failed to create duty fee', 500);
    }

    return dutyFee as DutyFee;
  }

  /**
   * Update a duty fee
   */
  async updateDutyFee(id: string, data: UpdateDutyFeeRequest, companyId: string): Promise<DutyFee> {
    // Check if duty fee exists
    const existingDutyFee = await this.dutyFeesRepository.findById(id, companyId);
    if (!existingDutyFee) {
      throw new AppError('Duty fee not found', 404);
    }

    // Check if the associated package allows duty fee modification
    const existingPackage = await this.packagesRepository.findById(existingDutyFee.packageId, companyId);
    if (!existingPackage) {
      throw new AppError('Associated package not found', 404);
    }

    const restrictedStatuses = ['ready_for_pickup', 'delivered'];
    if (restrictedStatuses.includes(existingPackage.status)) {
      throw new AppError('Cannot modify duty fees for packages that are ready for pickup or delivered', 400);
    }

    // Validate custom fee type when fee type is "Other"
    if (data.feeType === 'Other' && (!data.customFeeType || data.customFeeType.trim() === '')) {
      throw new AppError('Custom fee type is required when fee type is "Other"', 400);
    }

    // Update the duty fee
    const updatedDutyFee = await this.dutyFeesRepository.update(id, data, companyId);
    if (!updatedDutyFee) {
      throw new AppError('Failed to update duty fee', 500);
    }

    return updatedDutyFee as DutyFee;
  }

  /**
   * Delete a duty fee
   */
  async deleteDutyFee(id: string, companyId: string): Promise<void> {
    // Check if duty fee exists
    const existingDutyFee = await this.dutyFeesRepository.findById(id, companyId);
    if (!existingDutyFee) {
      throw new AppError('Duty fee not found', 404);
    }

    // Check if the associated package allows duty fee modification
    const existingPackage = await this.packagesRepository.findById(existingDutyFee.packageId, companyId);
    if (!existingPackage) {
      throw new AppError('Associated package not found', 404);
    }

    const restrictedStatuses = ['ready_for_pickup', 'delivered'];
    if (restrictedStatuses.includes(existingPackage.status)) {
      throw new AppError('Cannot delete duty fees from packages that are ready for pickup or delivered', 400);
    }

    // Delete the duty fee
    await this.dutyFeesRepository.delete(id, companyId);
  }

  /**
   * Get duty fees grouped by currency for a specific package
   */
  async getPackageFeesGroupedByCurrency(packageId: string, companyId: string) {
    // Verify package exists and belongs to company
    const packageExists = await this.packagesRepository.findById(packageId, companyId);
    if (!packageExists) {
      throw new AppError('Package not found', 404);
    }

    return this.dutyFeesRepository.getPackageFeesGroupedByCurrency(packageId, companyId);
  }

  /**
   * Get total duty fees for a package in a specific currency
   */
  async getPackageFeeTotal(packageId: string, currency: 'USD' | 'JMD', companyId: string): Promise<number> {
    // Verify package exists and belongs to company
    const packageExists = await this.packagesRepository.findById(packageId, companyId);
    if (!packageExists) {
      throw new AppError('Package not found', 404);
    }

    return this.dutyFeesRepository.getTotalByPackageAndCurrency(packageId, currency, companyId);
  }
}