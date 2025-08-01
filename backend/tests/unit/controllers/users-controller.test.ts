import { UsersController } from '../../../src/controllers/users-controller';
import { UsersService } from '../../../src/services/users-service';
import { AuditLogsService } from '../../../src/services/audit-logs-service';
import { ApiResponse } from '../../../src/utils/response';
import { mockRequest, mockResponse, createTestUser, withTenant, withAdminTenant, expectError } from '../../helpers/test-utils';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../../src/services/users-service');
jest.mock('../../../src/services/audit-logs-service');
jest.mock('../../../src/utils/response');
jest.mock('bcrypt');

const MockedUsersService = UsersService as jest.MockedClass<typeof UsersService>;
const MockedAuditLogsService = AuditLogsService as jest.MockedClass<typeof AuditLogsService>;
const MockedApiResponse = ApiResponse as jest.Mocked<typeof ApiResponse>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockAuditLogsService: jest.Mocked<AuditLogsService>;
  let mockNext: jest.Mock;

  const testCompanyId = 'test-company-id';
  const testUserId = 'test-user-id';
  const testUser = createTestUser(testCompanyId);

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh mock instances
    MockedUsersService.mockClear();
    MockedAuditLogsService.mockClear();
    
    controller = new UsersController();
    mockUsersService = MockedUsersService.mock.instances[0] as jest.Mocked<UsersService>;
    mockAuditLogsService = MockedAuditLogsService.mock.instances[0] as jest.Mocked<AuditLogsService>;
    mockNext = jest.fn();

    // Mock ApiResponse methods
    MockedApiResponse.success = jest.fn();
    MockedApiResponse.forbidden = jest.fn();
    MockedApiResponse.badRequest = jest.fn();
    MockedApiResponse.validationError = jest.fn();
  });

  describe('getAllUsers', () => {
    it('should return all users for a company', async () => {
      const users = [testUser, createTestUser(testCompanyId)];
      mockUsersService.getAllUsers = jest.fn().mockResolvedValue(users);

      const req = mockRequest({ 
        ...withTenant(testCompanyId),
        companyId: testCompanyId 
      });
      const res = mockResponse();

      await controller.getAllUsers(req as any, res as any, mockNext);

      expect(mockUsersService.getAllUsers).toHaveBeenCalledWith(testCompanyId);
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, users);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockUsersService.getAllUsers = jest.fn().mockRejectedValue(error);

      const req = mockRequest({ 
        ...withTenant(testCompanyId),
        companyId: testCompanyId 
      });
      const res = mockResponse();

      await controller.getAllUsers(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(MockedApiResponse.success).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user by ID for admin', async () => {
      mockUsersService.getUserById = jest.fn().mockResolvedValue(testUser);

      const req = mockRequest({
        params: { id: testUserId },
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userRole: 'admin_l1',
        userId: 'admin-user-id'
      });
      const res = mockResponse();

      await controller.getUserById(req as any, res as any, mockNext);

      expect(mockUsersService.getUserById).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, testUser);
    });

    it('should allow customer to access their own profile', async () => {
      mockUsersService.getUserById = jest.fn().mockResolvedValue(testUser);

      const req = mockRequest({
        params: { id: testUserId },
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        userRole: 'customer',
        userId: testUserId
      });
      const res = mockResponse();

      await controller.getUserById(req as any, res as any, mockNext);

      expect(mockUsersService.getUserById).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, testUser);
    });

    it('should prevent customer from accessing another user profile', async () => {
      const req = mockRequest({
        params: { id: 'other-user-id' },
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        userRole: 'customer',
        userId: testUserId
      });
      const res = mockResponse();

      await controller.getUserById(req as any, res as any, mockNext);

      expect(MockedApiResponse.forbidden).toHaveBeenCalledWith(res, 'You can only access your own profile');
      expect(mockUsersService.getUserById).not.toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    const validUserData = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'customer'
    };

    it('should create user successfully', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed-password';
      const createdUser = { ...testUser, ...validUserData };

      mockedBcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      mockUsersService.createUser = jest.fn().mockResolvedValue(createdUser);
      mockAuditLogsService.createLog = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        body: { ...validUserData, password },
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userId: 'admin-user-id',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      });
      const res = mockResponse();

      await controller.createUser(req as any, res as any, mockNext);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        { ...validUserData, passwordHash: hashedPassword },
        testCompanyId
      );
      expect(mockAuditLogsService.createLog).toHaveBeenCalledWith({
        userId: 'admin-user-id',
        companyId: testCompanyId,
        action: 'user_registration',
        entityType: 'user',
        entityId: createdUser.id,
        details: {
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          role: createdUser.role
        },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      });
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, createdUser, 'User created successfully', 201);
    });

    it('should create user without password', async () => {
      const createdUser = { ...testUser, ...validUserData };
      mockUsersService.createUser = jest.fn().mockResolvedValue(createdUser);
      mockAuditLogsService.createLog = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        body: validUserData,
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userId: 'admin-user-id',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      });
      const res = mockResponse();

      await controller.createUser(req as any, res as any, mockNext);

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersService.createUser).toHaveBeenCalledWith(validUserData, testCompanyId);
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, createdUser, 'User created successfully', 201);
    });

    it('should handle validation errors', async () => {
      const invalidUserData = { email: 'invalid-email' };
      
      const req = mockRequest({
        body: invalidUserData,
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userId: 'admin-user-id'
      });
      const res = mockResponse();

      await controller.createUser(req as any, res as any, mockNext);

      expect(MockedApiResponse.validationError).toHaveBeenCalled();
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    it('should update user successfully', async () => {
      const oldUser = { ...testUser };
      const updatedUser = { ...testUser, ...updateData };

      mockUsersService.getUserById = jest.fn().mockResolvedValue(oldUser);
      mockUsersService.updateUser = jest.fn().mockResolvedValue(updatedUser);

      const req = mockRequest({
        params: { id: testUserId },
        body: updateData,
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userRole: 'admin_l1',
        userId: 'admin-user-id',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      });
      const res = mockResponse();

      await controller.updateUser(req as any, res as any, mockNext);

      expect(mockUsersService.getUserById).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(testUserId, updateData, testCompanyId);
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, updatedUser, 'User updated successfully');
    });

    it('should prevent customer from updating another user', async () => {
      const req = mockRequest({
        params: { id: 'other-user-id' },
        body: updateData,
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        userRole: 'customer',
        userId: testUserId
      });
      const res = mockResponse();

      await controller.updateUser(req as any, res as any, mockNext);

      expect(MockedApiResponse.forbidden).toHaveBeenCalledWith(res, 'You can only update your own profile');
      expect(mockUsersService.updateUser).not.toHaveBeenCalled();
    });

    it('should handle password updates', async () => {
      const password = 'newpassword123';
      const hashedPassword = 'hashed-new-password';
      const updatedUser = { ...testUser, ...updateData };

      mockedBcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      mockUsersService.updateUser = jest.fn().mockResolvedValue(updatedUser);
      mockAuditLogsService.createLog = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        params: { id: testUserId },
        body: { ...updateData, password },
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userRole: 'admin_l1',
        userId: 'admin-user-id',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      });
      const res = mockResponse();

      await controller.updateUser(req as any, res as any, mockNext);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        testUserId,
        { ...updateData, passwordHash: hashedPassword },
        testCompanyId
      );
      expect(mockAuditLogsService.createLog).toHaveBeenCalledWith({
        userId: 'admin-user-id',
        companyId: testCompanyId,
        action: 'update_user_password',
        entityType: 'user',
        entityId: testUserId,
        details: { updatedFields: ['password'] },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      mockUsersService.deactivateUser = jest.fn().mockResolvedValue(undefined);
      mockAuditLogsService.createLog = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        params: { id: testUserId },
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userId: 'admin-user-id',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      });
      const res = mockResponse();

      await controller.deactivateUser(req as any, res as any, mockNext);

      expect(mockUsersService.deactivateUser).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(mockAuditLogsService.createLog).toHaveBeenCalledWith({
        userId: 'admin-user-id',
        companyId: testCompanyId,
        action: 'deactivate_user',
        entityType: 'user',
        entityId: testUserId,
        details: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      });
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, null, 'User deactivated successfully');
    });

    it('should prevent self-deactivation', async () => {
      const req = mockRequest({
        params: { id: 'admin-user-id' },
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userId: 'admin-user-id'
      });
      const res = mockResponse();

      await controller.deactivateUser(req as any, res as any, mockNext);

      expect(MockedApiResponse.badRequest).toHaveBeenCalledWith(res, 'You cannot deactivate your own account');
      expect(mockUsersService.deactivateUser).not.toHaveBeenCalled();
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should enforce tenant isolation in getAllUsers', async () => {
      const companyAId = 'company-a';
      const companyBId = 'company-b';
      const usersA = [createTestUser(companyAId)];

      mockUsersService.getAllUsers = jest.fn().mockResolvedValue(usersA);

      const req = mockRequest({ 
        ...withTenant(companyAId),
        companyId: companyAId 
      });
      const res = mockResponse();

      await controller.getAllUsers(req as any, res as any, mockNext);

      expect(mockUsersService.getAllUsers).toHaveBeenCalledWith(companyAId);
      expect(mockUsersService.getAllUsers).not.toHaveBeenCalledWith(companyBId);
    });

    it('should enforce tenant isolation in getUserById', async () => {
      const companyAId = 'company-a';
      const userA = createTestUser(companyAId);

      mockUsersService.getUserById = jest.fn().mockResolvedValue(userA);

      const req = mockRequest({
        params: { id: userA.id },
        ...withAdminTenant(companyAId, 'admin_l1'),
        companyId: companyAId,
        userRole: 'admin_l1',
        userId: 'admin-user-id'
      });
      const res = mockResponse();

      await controller.getUserById(req as any, res as any, mockNext);

      expect(mockUsersService.getUserById).toHaveBeenCalledWith(userA.id, companyAId);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockUsersService.getAllUsers = jest.fn().mockRejectedValue(error);

      const req = mockRequest({ 
        ...withTenant(testCompanyId),
        companyId: testCompanyId 
      });
      const res = mockResponse();

      await controller.getAllUsers(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle validation errors in createUser', async () => {
      const req = mockRequest({
        body: { invalidField: 'value' },
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId,
        userId: 'admin-user-id'
      });
      const res = mockResponse();

      await controller.createUser(req as any, res as any, mockNext);

      expect(MockedApiResponse.validationError).toHaveBeenCalled();
    });
  });
});