import { Request, Response, NextFunction } from 'express';
import { DutyFeesService } from '../services/duty-fees-service';
import { createDutyFeeSchema, updateDutyFeeSchema, dutyFeeParamsSchema, packageParamsSchema } from '../validation/duty-fee-schemas';
import { ApiResponse } from '../utils/response';
import { AuditLogsService } from '../services/audit-logs-service';

interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
  role?: string;
}

export class DutyFeesController {
  private service: DutyFeesService;
  private auditLogsService: AuditLogsService;

  constructor() {
    this.service = new DutyFeesService();
    this.auditLogsService = new AuditLogsService();
  }

  /**
   * Get all duty fees for a company
   */
  getAllDutyFees = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const dutyFees = await this.service.getAllDutyFees(companyId);
      return ApiResponse.success(res, dutyFees);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get duty fees for a specific package
   */
  getDutyFeesByPackageId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { packageId } = packageParamsSchema.parse(req.params);
      
      const dutyFees = await this.service.getDutyFeesByPackageId(packageId, companyId);
      return ApiResponse.success(res, dutyFees);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get a specific duty fee by ID
   */
  getDutyFeeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { id } = dutyFeeParamsSchema.parse(req.params);
      
      const dutyFee = await this.service.getDutyFeeById(id, companyId);
      return ApiResponse.success(res, dutyFee);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Create a new duty fee
   */
  createDutyFee = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const userId = req.userId as string;
      
      const validatedData = createDutyFeeSchema.parse(req.body);
      const dutyFee = await this.service.createDutyFee(validatedData, companyId);

      // Log the action
      await this.auditLogsService.createLog({
        userId,
        companyId,
        action: 'CREATE_DUTY_FEE',
        entityType: 'duty_fee',
        entityId: dutyFee.id,
        details: {
          packageId: dutyFee.packageId,
          feeType: dutyFee.feeType,
          amount: dutyFee.amount,
          currency: dutyFee.currency,
        },
      });

      return ApiResponse.success(res, dutyFee, 'Duty fee created successfully', 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Update a duty fee
   */
  updateDutyFee = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const userId = req.userId as string;
      
      const { id } = dutyFeeParamsSchema.parse(req.params);
      const validatedData = updateDutyFeeSchema.parse(req.body);
      
      const updatedDutyFee = await this.service.updateDutyFee(id, validatedData, companyId);

      // Log the action
      await this.auditLogsService.createLog({
        userId,
        companyId,
        action: 'UPDATE_DUTY_FEE',
        entityType: 'duty_fee',
        entityId: id,
        details: {
          changes: validatedData,
        },
      });

      return ApiResponse.success(res, updatedDutyFee);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Delete a duty fee
   */
  deleteDutyFee = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const userId = req.userId as string;
      
      const { id } = dutyFeeParamsSchema.parse(req.params);
      await this.service.deleteDutyFee(id, companyId);

      // Log the action
      await this.auditLogsService.createLog({
        userId,
        companyId,
        action: 'DELETE_DUTY_FEE',
        entityType: 'duty_fee',
        entityId: id,
        details: {},
      });

      return ApiResponse.success(res, { message: 'Duty fee deleted successfully' });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get duty fees grouped by currency for a package
   */
  getPackageFeesGroupedByCurrency = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { packageId } = packageParamsSchema.parse(req.params);
      
      const groupedFees = await this.service.getPackageFeesGroupedByCurrency(packageId, companyId);
      return ApiResponse.success(res, groupedFees);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get total duty fees for a package in a specific currency
   */
  getPackageFeeTotal = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { packageId } = packageParamsSchema.parse(req.params);
      const currency = req.query.currency as 'USD' | 'JMD' || 'USD';
      
      if (!['USD', 'JMD'].includes(currency)) {
        return ApiResponse.error(res, 'Invalid currency. Must be USD or JMD', 400);
      }
      
      const total = await this.service.getPackageFeeTotal(packageId, currency, companyId);
      return ApiResponse.success(res, { total, currency });
    } catch (error) {
      return next(error);
    }
  };
}