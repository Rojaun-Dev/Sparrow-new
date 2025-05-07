import { Request, Response } from 'express';
import { FeesService, createFeeSchema, updateFeeSchema } from '../services/fees-service';
import { feeTypeEnum } from '../db/schema/fees';
import { ApiResponse } from '../utils/response';
import { z } from 'zod';

export class FeesController {
  private feesService: FeesService;

  constructor() {
    this.feesService = new FeesService();
  }

  /**
   * Get all fees for a company
   */
  async getAll(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const fees = await this.feesService.getAll(companyId);
      return ApiResponse.success(res, fees);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Get active fees for a company
   */
  async getActive(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const fees = await this.feesService.getActiveFees(companyId);
      return ApiResponse.success(res, fees);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Get fees by type
   */
  async getByType(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const { type } = req.params;
      
      if (!type || !feeTypeEnum.enumValues.includes(type)) {
        return ApiResponse.badRequest(res, `Invalid fee type. Must be one of: ${feeTypeEnum.enumValues.join(', ')}`);
      }
      
      const fees = await this.feesService.getByType(type, companyId);
      return ApiResponse.success(res, fees);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Get fee by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;
      
      if (!id) {
        return ApiResponse.badRequest(res, 'Fee ID is required');
      }
      
      const fee = await this.feesService.getById(id, companyId);
      return ApiResponse.success(res, fee);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Create a new fee
   */
  async create(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const feeData = req.body;
      
      try {
        // Validate the input data
        createFeeSchema.parse(feeData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return ApiResponse.validationError(res, validationError);
        }
      }
      
      const fee = await this.feesService.create(feeData, companyId);
      return ApiResponse.created(res, fee);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return ApiResponse.conflict(res, error.message);
      }
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Update a fee
   */
  async update(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;
      const feeData = req.body;
      
      if (!id) {
        return ApiResponse.badRequest(res, 'Fee ID is required');
      }
      
      try {
        // Validate the input data
        updateFeeSchema.parse(feeData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return ApiResponse.validationError(res, validationError);
        }
      }
      
      const fee = await this.feesService.update(id, feeData, companyId);
      return ApiResponse.success(res, fee);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Deactivate a fee
   */
  async deactivate(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;
      
      if (!id) {
        return ApiResponse.badRequest(res, 'Fee ID is required');
      }
      
      const fee = await this.feesService.deactivate(id, companyId);
      return ApiResponse.success(res, fee);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Activate a fee
   */
  async activate(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;
      
      if (!id) {
        return ApiResponse.badRequest(res, 'Fee ID is required');
      }
      
      const fee = await this.feesService.activate(id, companyId);
      return ApiResponse.success(res, fee);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Delete a fee (permanent)
   */
  async delete(req: Request, res: Response) {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;
      
      if (!id) {
        return ApiResponse.badRequest(res, 'Fee ID is required');
      }
      
      await this.feesService.delete(id, companyId);
      return ApiResponse.success(res, { message: 'Fee deleted successfully' });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }
      return ApiResponse.error(res, error.message);
    }
  }
} 