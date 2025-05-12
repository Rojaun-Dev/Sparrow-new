import { Request, Response } from 'express';
import { StatisticsRepository } from '../repositories/statistics-repository';
import { db } from '../db';

// Extended request type to include userId and companyId
interface ExtendedRequest extends Request {
  userId?: string;
  companyId?: string;
}

// Initialize repository
const statisticsRepository = new StatisticsRepository(db);

/**
 * Get statistics for customer dashboard
 */
export const getCustomerStatistics = async (req: ExtendedRequest, res: Response) => {
  try {
    const { userId } = req;
    const { companyId } = req;

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Company ID are required',
      });
    }

    const statistics = await statisticsRepository.getCustomerStatistics(userId, companyId);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get statistics for admin dashboard
 */
export const getAdminStatistics = async (req: ExtendedRequest, res: Response) => {
  try {
    const { companyId } = req;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required',
      });
    }

    const statistics = await statisticsRepository.getAdminStatistics(companyId);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get statistics for super admin dashboard
 */
export const getSuperAdminStatistics = async (_req: Request, res: Response) => {
  try {
    const statistics = await statisticsRepository.getSuperAdminStatistics();

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching super admin statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch super admin statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}; 