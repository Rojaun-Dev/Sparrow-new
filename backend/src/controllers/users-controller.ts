import { Request, Response, NextFunction } from 'express';
import { UsersService, createUserSchema, updateUserSchema, UserRole } from '../services/users-service';
import { ApiResponse } from '../utils/response';
import bcrypt from 'bcrypt';
import { parse as csvParse, format as csvFormat } from 'fast-csv';
import { PassThrough } from 'stream';
import { AuditLogsService } from '../services/audit-logs-service';

interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
  userRole?: string;
  user?: {
    id: string;
  };
}

export class UsersController {
  private service: UsersService;
  private auditLogsService: AuditLogsService;

  constructor() {
    this.service = new UsersService();
    this.auditLogsService = new AuditLogsService();
  }

  /**
   * Get all users for a company
   */
  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const users = await this.service.getAllUsers(companyId);
      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get a user by ID
   */
  getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      
      // If a regular user is trying to access another user's profile, block it
      if (req.userRole === 'customer' && id !== req.userId) {
        return ApiResponse.forbidden(res, 'You can only access your own profile');
      }
      
      const user = await this.service.getUserById(id, companyId);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Create a new user
   */
  createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { password, ...userData } = req.body;
      
      // Validate request body
      try {
        createUserSchema.parse(userData);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      // Hash password if provided
      let passwordHash;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }
      
      const user = await this.service.createUser({
        ...userData,
        ...(passwordHash && { passwordHash })
      }, companyId);
      
      return ApiResponse.success(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Update a user
   */
  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const adminUserId = req.userId as string;
      const adminUserRole = req.userRole;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      // If a regular user is trying to update another user's profile, block it
      if (req.userRole === 'customer' && id !== req.userId) {
        return ApiResponse.forbidden(res, 'You can only update your own profile');
      }

      // If it's a password update, handle separately
      if (req.body.password) {
        const { password, ...userData } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Validate request body
        try {
          updateUserSchema.parse(userData);
        } catch (error) {
          return ApiResponse.validationError(res, error);
        }
        
        const user = await this.service.updateUser(id, {
          ...userData,
          passwordHash
        }, companyId);
        
        // Audit log for password change (optional, not logging password)
        await this.auditLogsService.createLog({
          userId: adminUserId,
          companyId,
          action: 'update_user_password',
          entityType: 'user',
          entityId: id,
          details: { updatedFields: ['password'] },
          ipAddress,
          userAgent
        });
        
        return ApiResponse.success(res, user, 'User updated successfully');
      }
      
      // For regular updates
      try {
        updateUserSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      // Fetch old user for audit comparison
      const oldUser = await this.service.getUserById(id, companyId);
      const user = await this.service.updateUser(id, req.body, companyId);

      // Audit log for TRN change (only if changed)
      if (req.body.trn !== undefined && req.body.trn !== oldUser.trn) {
        await this.auditLogsService.createLog({
          userId: adminUserId,
          companyId,
          action: 'update_user_trn',
          entityType: 'user',
          entityId: id,
          details: { oldTrn: oldUser.trn, newTrn: req.body.trn },
          ipAddress,
          userAgent
        });
      }
      // Optionally, log other field changes as well

      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Deactivate a user (soft delete)
   */
  deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const adminUserId = req.userId as string;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      // Prevent self-deactivation
      if (id === req.userId) {
        return ApiResponse.badRequest(res, 'You cannot deactivate your own account');
      }
      
      await this.service.deactivateUser(id, companyId);
      // Audit log
      await this.auditLogsService.createLog({
        userId: adminUserId,
        companyId,
        action: 'deactivate_user',
        entityType: 'user',
        entityId: id,
        details: null,
        ipAddress,
        userAgent
      });
      return ApiResponse.success(res, null, 'User deactivated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Reactivate a user
   */
  reactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const adminUserId = req.userId as string;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await this.service.reactivateUser(id, companyId);
      // Audit log
      await this.auditLogsService.createLog({
        userId: adminUserId,
        companyId,
        action: 'reactivate_user',
        entityType: 'user',
        entityId: id,
        details: null,
        ipAddress,
        userAgent
      });
      return ApiResponse.success(res, null, 'User reactivated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get users by role
   */
  getUsersByRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { role } = req.params;
      const companyId = req.companyId as string;
      const users = await this.service.getUsersByRole(role, companyId);
      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Get all users across all companies
   */
  getAllUsersAcrossCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        page,
        limit,
        sort,
        order,
        role,
        companyId,
        isActive,
        search,
        createdFrom,
        createdTo
      } = req.query;

      // Convert query parameters to the correct types
      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        role: role as string,
        companyId: companyId as string,
        isActive: isActive ? isActive === 'true' : undefined,
        search: search as string,
        createdFrom: createdFrom as string,
        createdTo: createdTo as string
      };

      const users = await this.service.getAllUsersAcrossCompanies(params);
      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Create a new admin user for any company
   */
  createAdminUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId, password, ...userData } = req.body;
      
      if (!companyId) {
        return ApiResponse.badRequest(res, 'Company ID is required');
      }
      
      // Allow super_admin as well
      if (!userData.role || !['admin_l1', 'admin_l2', 'super_admin'].includes(userData.role)) {
        return ApiResponse.badRequest(res, 'Role must be admin_l1, admin_l2, or super_admin');
      }
      
      // Validate request body
      try {
        createUserSchema.parse(userData);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      // Hash password if provided
      let passwordHash;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      } else {
        return ApiResponse.badRequest(res, 'Password is required');
      }
      
      const user = await this.service.createUser({
        ...userData,
        passwordHash
      }, companyId);
      
      return ApiResponse.success(res, user, 'Admin user created successfully', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Get system-wide statistics
   */
  getSystemStatistics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getSystemStatistics();
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Get users for a specific company with filtering
   */
  getCompanyUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id: companyId } = req.params;
      
      // Extract query parameters
      const { 
        page, 
        limit, 
        sort, 
        order, 
        role, 
        isActive, 
        search,
        createdFrom,
        createdTo
      } = req.query;
      
      // Sanitize role param: always pass valid enum values or undefined
      const validRoleValues = ['customer', 'admin_l1', 'admin_l2', 'super_admin'] as const;
      type ValidRole = typeof validRoleValues[number];
      let roleParam: ValidRole[] | undefined = undefined;
      if (role !== undefined) {
        let rawRoles: string[] = [];
        if (Array.isArray(role)) {
          rawRoles = role.map(r => String(r));
        } else if (typeof role === 'string') {
          rawRoles = String(role).split(',');
        } else if (typeof role === 'object' && role !== null) {
          rawRoles = [String(role)];
        }
        const filteredRoles = rawRoles.filter((r): r is ValidRole => validRoleValues.includes(r as ValidRole));
        if (filteredRoles.length > 0) roleParam = filteredRoles as ValidRole[];
      }
      // Sanitize isActive param: only accept 'true' or 'false' as string
      let isActiveParam: boolean | undefined = undefined;
      if (typeof isActive === 'string') {
        if (isActive === 'true') isActiveParam = true;
        else if (isActive === 'false') isActiveParam = false;
      }
      // Use destructured createdFrom/createdTo from req.query directly
      const params: {
        companyId: string;
        role?: ValidRole[];
        isActive?: boolean;
        search?: string;
        sort?: string;
        order?: 'asc' | 'desc';
        createdFrom?: string;
        createdTo?: string;
      } = {
        companyId,
        ...(roleParam ? { role: roleParam } : {}),
        isActive: isActiveParam,
        search: search as string,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        createdFrom: createdFrom as string,
        createdTo: createdTo as string
      };
      
      const result = await this.service.getUsersForCompany(params);
      
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Deactivate a user across all companies
   */
  deactivateUserSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Prevent self-deactivation
      if (id === req.userId) {
        return ApiResponse.badRequest(res, 'You cannot deactivate your own account');
      }
      
      await this.service.deactivateUserSuperAdmin(id);
      return ApiResponse.success(res, null, 'User deactivated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Reactivate a user across all companies
   */
  reactivateUserSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.reactivateUserSuperAdmin(id);
      return ApiResponse.success(res, null, 'User reactivated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Hard delete a user
   */
  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const adminUserId = req.userId as string;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await this.service.deleteUser(id, companyId);
      // Audit log
      await this.auditLogsService.createLog({
        userId: adminUserId,
        companyId,
        action: 'delete_user',
        entityType: 'user',
        entityId: id,
        details: null,
        ipAddress,
        userAgent
      });
      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Export users (customers/employees) as CSV for a company
   */
  exportUsersCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const userRole = req.userRole;
      // Only allow admin_l1 or admin_l2
      if (!['admin_l1', 'admin_l2'].includes(userRole || '')) {
        return ApiResponse.forbidden(res, 'You do not have permission to export users');
      }
      // Extract filters from query params
      const {
        role,
        isActive,
        search,
        sort,
        order,
        createdFrom,
        createdTo
      } = req.query;
      // Sanitize role param: always pass valid enum values or undefined
      const validRoleValues = ['customer', 'admin_l1', 'admin_l2', 'super_admin'] as const;
      type ValidRole = typeof validRoleValues[number];
      let roleParam: ValidRole[] | undefined = undefined;
      if (role !== undefined) {
        let rawRoles: string[] = [];
        if (Array.isArray(role)) {
          rawRoles = role.map(r => String(r));
        } else if (typeof role === 'string') {
          rawRoles = String(role).split(',');
        } else if (typeof role === 'object' && role !== null) {
          rawRoles = [String(role)];
        }
        const filteredRoles = rawRoles.filter((r): r is ValidRole => validRoleValues.includes(r as ValidRole));
        if (filteredRoles.length > 0) roleParam = filteredRoles as ValidRole[];
      }
      // Sanitize isActive param: only accept 'true' or 'false' as string
      let isActiveParam: boolean | undefined = undefined;
      if (typeof isActive === 'string') {
        if (isActive === 'true') isActiveParam = true;
        else if (isActive === 'false') isActiveParam = false;
      }
      // Use destructured createdFrom/createdTo from req.query directly
      const params: {
        companyId: string;
        role?: ValidRole[];
        isActive?: boolean;
        search?: string;
        sort?: string;
        order?: 'asc' | 'desc';
        createdFrom?: string;
        createdTo?: string;
      } = {
        companyId,
        ...(roleParam ? { role: roleParam } : {}),
        isActive: isActiveParam,
        search: search as string,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        createdFrom: createdFrom as string,
        createdTo: createdTo as string
      };
      // Get data
      const users = await this.service.exportUsersCsvData(params);
      // Set headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      // Stream CSV
      const csvStream = csvFormat({ headers: true });
      const passThrough = new PassThrough();
      csvStream.pipe(passThrough);
      users.forEach(user => csvStream.write(user));
      csvStream.end();
      passThrough.pipe(res);
    } catch (error) {
      next(error);
      return undefined;
    }
  };
} 