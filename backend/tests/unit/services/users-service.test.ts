import { UsersService, UserRole } from '../../../src/services/users-service';
import { UsersRepository } from '../../../src/repositories/users-repository';
import { AppError } from '../../../src/utils/app-error';
import { createTestUser } from '../../helpers/test-utils';

// Mock dependencies
jest.mock('../../../src/repositories/users-repository');

const MockedUsersRepository = UsersRepository as jest.MockedClass<typeof UsersRepository>;

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<UsersRepository>;

  const testCompanyId = 'test-company-id';
  const testUserId = 'test-user-id';
  const testUser = createTestUser(testCompanyId);

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh mock instances
    MockedUsersRepository.mockClear();
    
    service = new UsersService();
    mockRepository = MockedUsersRepository.mock.instances[0] as jest.Mocked<UsersRepository>;
  });

  describe('getAllUsers', () => {
    it('should return all users for a company', async () => {
      const users = [testUser, createTestUser(testCompanyId)];
      mockRepository.findAll = jest.fn().mockResolvedValue(users);

      const result = await service.getAllUsers(testCompanyId);

      expect(mockRepository.findAll).toHaveBeenCalledWith(testCompanyId);
      expect(result).toEqual(users);
    });

    it('should handle empty results', async () => {
      mockRepository.findAll = jest.fn().mockResolvedValue([]);

      const result = await service.getAllUsers(testCompanyId);

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findAll = jest.fn().mockRejectedValue(error);

      await expect(service.getAllUsers(testCompanyId)).rejects.toThrow(error);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      mockRepository.findById = jest.fn().mockResolvedValue(testUser);

      const result = await service.getUserById(testUserId, testCompanyId);

      expect(mockRepository.findById).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(result).toEqual(testUser);
    });

    it('should return null for non-existent user', async () => {
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      const result = await service.getUserById('non-existent-id', testCompanyId);

      expect(result).toBeNull();
    });

    it('should enforce company isolation', async () => {
      const otherCompanyId = 'other-company-id';
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      const result = await service.getUserById(testUserId, otherCompanyId);

      expect(mockRepository.findById).toHaveBeenCalledWith(testUserId, otherCompanyId);
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    const validUserData = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      phone: '+1-876-555-0123',
      address: '123 Test Street, Kingston, Jamaica',
      role: 'customer' as UserRole,
      passwordHash: 'hashed-password'
    };

    it('should create user successfully', async () => {
      const createdUser = { ...testUser, ...validUserData, id: 'new-user-id' };
      mockRepository.create = jest.fn().mockResolvedValue(createdUser);

      const result = await service.createUser(validUserData, testCompanyId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...validUserData,
        is_active: true
      }, testCompanyId);
      expect(result).toEqual(createdUser);
    });

    it('should create user with default role', async () => {
      const userDataWithoutRole = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        passwordHash: 'hashed-password',
        role: 'customer' as UserRole // Need to provide role
      };
      const createdUser = { ...testUser, ...userDataWithoutRole, role: 'customer' };
      mockRepository.create = jest.fn().mockResolvedValue(createdUser);

      const result = await service.createUser(userDataWithoutRole, testCompanyId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...userDataWithoutRole,
        is_active: true
      }, testCompanyId);
      expect(result).toEqual(createdUser);
    });

    it('should handle duplicate email error', async () => {
      const duplicateError = new Error('Duplicate email');
      mockRepository.create = jest.fn().mockRejectedValue(duplicateError);

      await expect(service.createUser(validUserData, testCompanyId)).rejects.toThrow(duplicateError);
    });

    it('should validate user data before creation', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        firstName: '',
        lastName: '',
        passwordHash: 'hashed-password'
      };

      await expect(service.createUser(invalidUserData as any, testCompanyId)).rejects.toThrow();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+1-876-555-9999'
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...testUser, ...updateData };
      mockRepository.findById = jest.fn().mockResolvedValue(testUser);
      mockRepository.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await service.updateUser(testUserId, updateData, testCompanyId);

      expect(mockRepository.findById).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(mockRepository.update).toHaveBeenCalledWith(testUserId, updateData, testCompanyId);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(service.updateUser(testUserId, updateData, testCompanyId)).rejects.toThrow(AppError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        email: 'invalid-email',
        firstName: 'A' // too short
      };

      await expect(service.updateUser(testUserId, invalidUpdateData, testCompanyId)).rejects.toThrow();
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should enforce company isolation during update', async () => {
      const otherCompanyId = 'other-company-id';
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(service.updateUser(testUserId, updateData, otherCompanyId)).rejects.toThrow(AppError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      mockRepository.findById = jest.fn().mockResolvedValue(testUser);
      mockRepository.update = jest.fn().mockResolvedValue({ ...testUser, is_active: false });

      await service.deactivateUser(testUserId, testCompanyId);

      expect(mockRepository.findById).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(mockRepository.update).toHaveBeenCalledWith(testUserId, { is_active: false }, testCompanyId);
    });

    it('should throw error if user not found', async () => {
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(service.deactivateUser(testUserId, testCompanyId)).rejects.toThrow(AppError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      const inactiveUser = { ...testUser, is_active: false };
      mockRepository.findById = jest.fn().mockResolvedValue(inactiveUser);
      mockRepository.update = jest.fn().mockResolvedValue({ ...testUser, is_active: true });

      await service.reactivateUser(testUserId, testCompanyId);

      expect(mockRepository.findById).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(mockRepository.update).toHaveBeenCalledWith(testUserId, { is_active: true }, testCompanyId);
    });

    it('should throw error if user not found', async () => {
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(service.reactivateUser(testUserId, testCompanyId)).rejects.toThrow(AppError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      const adminUsers = [
        { ...testUser, role: 'admin_l1' as UserRole },
        { ...testUser, id: 'admin-2', role: 'admin_l1' as UserRole }
      ];
      mockRepository.findByRole = jest.fn().mockResolvedValue(adminUsers);

      const result = await service.getUsersByRole('admin_l1', testCompanyId);

      expect(mockRepository.findByRole).toHaveBeenCalledWith('admin_l1', testCompanyId);
      expect(result).toEqual(adminUsers);
    });

    it('should return empty array for role with no users', async () => {
      mockRepository.findByRole = jest.fn().mockResolvedValue([]);

      const result = await service.getUsersByRole('admin_l2', testCompanyId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      mockRepository.findByEmail = jest.fn().mockResolvedValue(testUser);

      const result = await service.getUserByEmail(testUser.email, testCompanyId);

      expect(mockRepository.findByEmail).toHaveBeenCalledWith(testUser.email, testCompanyId);
      expect(result).toEqual(testUser);
    });

    it('should return null for non-existent email', async () => {
      mockRepository.findByEmail = jest.fn().mockResolvedValue(null);

      const result = await service.getUserByEmail('nonexistent@example.com', testCompanyId);

      expect(result).toBeNull();
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should enforce tenant isolation in getAllUsers', async () => {
      const companyAId = 'company-a';
      const companyBId = 'company-b';
      
      mockRepository.findAll = jest.fn().mockResolvedValue([createTestUser(companyAId)]);

      await service.getAllUsers(companyAId);

      expect(mockRepository.findAll).toHaveBeenCalledWith(companyAId);
      expect(mockRepository.findAll).not.toHaveBeenCalledWith(companyBId);
    });

    it('should enforce tenant isolation in getUserById', async () => {
      const companyAId = 'company-a';
      const companyBId = 'company-b';
      const userId = 'test-user-id';

      mockRepository.findById = jest.fn()
        .mockResolvedValueOnce(createTestUser(companyAId))
        .mockResolvedValueOnce(null);

      // Should find user in company A
      const resultA = await service.getUserById(userId, companyAId);
      expect(resultA).not.toBeNull();

      // Should not find same user in company B
      const resultB = await service.getUserById(userId, companyBId);
      expect(resultB).toBeNull();

      expect(mockRepository.findById).toHaveBeenCalledWith(userId, companyAId);
      expect(mockRepository.findById).toHaveBeenCalledWith(userId, companyBId);
    });
  });

  describe('Error handling', () => {
    it('should propagate repository errors', async () => {
      const dbError = new Error('Database connection lost');
      mockRepository.findAll = jest.fn().mockRejectedValue(dbError);

      await expect(service.getAllUsers(testCompanyId)).rejects.toThrow(dbError);
    });

    it('should throw AppError for business logic violations', async () => {
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(service.updateUser(testUserId, { firstName: 'Updated' }, testCompanyId))
        .rejects.toThrow(AppError);
    });

    it('should handle validation errors appropriately', async () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: '',
        lastName: '',
        passwordHash: 'valid-hash'
      };

      await expect(service.createUser(invalidData as any, testCompanyId)).rejects.toThrow();
    });
  });
});