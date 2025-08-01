import { PackagesController } from '../../../src/controllers/packages-controller';
import { PackagesService } from '../../../src/services/packages-service';
import { UsersService } from '../../../src/services/users-service';
import { EmailService } from '../../../src/services/email-service';
import { CompaniesService } from '../../../src/services/companies-service';
import { AuditLogsService } from '../../../src/services/audit-logs-service';
import { ApiResponse } from '../../../src/utils/response';
import { mockRequest, mockResponse, createTestPackage, withTenant, withAdminTenant } from '../../helpers/test-utils';

// Mock dependencies
jest.mock('../../../src/services/packages-service');
jest.mock('../../../src/services/users-service');
jest.mock('../../../src/services/email-service');
jest.mock('../../../src/services/companies-service');
jest.mock('../../../src/services/audit-logs-service');
jest.mock('../../../src/utils/response');

const MockedPackagesService = PackagesService as jest.MockedClass<typeof PackagesService>;
const MockedUsersService = UsersService as jest.MockedClass<typeof UsersService>;
const MockedEmailService = EmailService as jest.MockedClass<typeof EmailService>;
const MockedCompaniesService = CompaniesService as jest.MockedClass<typeof CompaniesService>;
const MockedAuditLogsService = AuditLogsService as jest.MockedClass<typeof AuditLogsService>;
const MockedApiResponse = ApiResponse as jest.Mocked<typeof ApiResponse>;

describe('PackagesController', () => {
  let controller: PackagesController;
  let mockPackagesService: jest.Mocked<PackagesService>;
  let mockNext: jest.Mock;

  const testCompanyId = 'test-company-id';
  const testUserId = 'test-user-id';
  const testPackage = createTestPackage(testCompanyId, testUserId);

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh mock instances
    MockedPackagesService.mockClear();
    MockedUsersService.mockClear();
    MockedEmailService.mockClear();
    MockedCompaniesService.mockClear();
    MockedAuditLogsService.mockClear();
    
    controller = new PackagesController();
    mockPackagesService = MockedPackagesService.mock.instances[0] as jest.Mocked<PackagesService>;
    mockNext = jest.fn();

    // Mock ApiResponse methods
    MockedApiResponse.success = jest.fn();
    MockedApiResponse.forbidden = jest.fn();
    MockedApiResponse.badRequest = jest.fn();
    MockedApiResponse.validationError = jest.fn();
    MockedApiResponse.notFound = jest.fn();
  });

  describe('getAllPackages', () => {
    it('should return paginated packages for a company', async () => {
      const packages = [testPackage, createTestPackage(testCompanyId, testUserId)];
      const paginatedResult = {
        data: packages,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      };

      mockPackagesService.getAllPackages = jest.fn().mockResolvedValue(paginatedResult);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        query: {
          page: '1',
          limit: '10',
          status: 'in_transit',
          search: 'test'
        }
      });
      const res = mockResponse();

      await controller.getAllPackages(req as any, res as any, mockNext);

      expect(mockPackagesService.getAllPackages).toHaveBeenCalledWith(
        testCompanyId,
        1,
        10,
        {
          status: 'in_transit',
          search: 'test'
        }
      );
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, paginatedResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default pagination values', async () => {
      const paginatedResult = {
        data: [testPackage],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockPackagesService.getAllPackages = jest.fn().mockResolvedValue(paginatedResult);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        query: {} // No pagination params
      });
      const res = mockResponse();

      await controller.getAllPackages(req as any, res as any, mockNext);

      expect(mockPackagesService.getAllPackages).toHaveBeenCalledWith(
        testCompanyId,
        1, // default page
        10, // default limit
        {}
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockPackagesService.getAllPackages = jest.fn().mockRejectedValue(error);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        query: {}
      });
      const res = mockResponse();

      await controller.getAllPackages(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(MockedApiResponse.success).not.toHaveBeenCalled();
    });
  });

  describe('getPackageById', () => {
    it('should return package by ID for admin', async () => {
      mockPackagesService.getPackageById = jest.fn().mockResolvedValue(testPackage);

      const req = mockRequest({
        params: { id: testPackage.id },
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId
      });
      const res = mockResponse();

      await controller.getPackageById(req as any, res as any, mockNext);

      expect(mockPackagesService.getPackageById).toHaveBeenCalledWith(testPackage.id, testCompanyId);
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, testPackage);
    });

    it('should handle package not found', async () => {
      mockPackagesService.getPackageById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        params: { id: 'non-existent-id' },
        ...withAdminTenant(testCompanyId, 'admin_l1'),
        companyId: testCompanyId
      });
      const res = mockResponse();

      await controller.getPackageById(req as any, res as any, mockNext);

      expect(MockedApiResponse.notFound).toHaveBeenCalledWith(res, 'Package not found');
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should enforce tenant isolation in getAllPackages', async () => {
      const companyAId = 'company-a';
      const companyBId = 'company-b';
      const packagesA = [createTestPackage(companyAId, testUserId)];
      const paginatedResult = {
        data: packagesA,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockPackagesService.getAllPackages = jest.fn().mockResolvedValue(paginatedResult);

      const req = mockRequest({
        ...withTenant(companyAId),
        companyId: companyAId,
        query: {}
      });
      const res = mockResponse();

      await controller.getAllPackages(req as any, res as any, mockNext);

      expect(mockPackagesService.getAllPackages).toHaveBeenCalledWith(companyAId, 1, 10, {});
      expect(mockPackagesService.getAllPackages).not.toHaveBeenCalledWith(companyBId, expect.any(Number), expect.any(Number), expect.any(Object));
    });

    it('should enforce tenant isolation in getPackageById', async () => {
      const companyAId = 'company-a';
      const packageA = createTestPackage(companyAId, testUserId);

      mockPackagesService.getPackageById = jest.fn().mockResolvedValue(packageA);

      const req = mockRequest({
        params: { id: packageA.id },
        ...withAdminTenant(companyAId, 'admin_l1'),
        companyId: companyAId
      });
      const res = mockResponse();

      await controller.getPackageById(req as any, res as any, mockNext);

      expect(mockPackagesService.getPackageById).toHaveBeenCalledWith(packageA.id, companyAId);
    });
  });

  describe('Filtering and search', () => {
    it('should apply status filter', async () => {
      const filteredResult = {
        data: [testPackage],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockPackagesService.getAllPackages = jest.fn().mockResolvedValue(filteredResult);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        query: {
          status: 'delivered',
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      });
      const res = mockResponse();

      await controller.getAllPackages(req as any, res as any, mockNext);

      expect(mockPackagesService.getAllPackages).toHaveBeenCalledWith(
        testCompanyId,
        1,
        10,
        {
          status: 'delivered',
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      );
    });

    it('should apply date range filters', async () => {
      const filteredResult = {
        data: [testPackage],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockPackagesService.getAllPackages = jest.fn().mockResolvedValue(filteredResult);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        query: {
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
          search: 'tracking123'
        }
      });
      const res = mockResponse();

      await controller.getAllPackages(req as any, res as any, mockNext);

      expect(mockPackagesService.getAllPackages).toHaveBeenCalledWith(
        testCompanyId,
        1,
        10,
        {
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
          search: 'tracking123'
        }
      );
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      mockPackagesService.getAllPackages = jest.fn().mockRejectedValue(error);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        query: {}
      });
      const res = mockResponse();

      await controller.getAllPackages(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const paginatedResult = {
        data: [testPackage],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockPackagesService.getAllPackages = jest.fn().mockResolvedValue(paginatedResult);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        query: {
          page: 'invalid',
          limit: 'invalid'
        }
      });
      const res = mockResponse();

      await controller.getAllPackages(req as any, res as any, mockNext);

      // Should use defaults when parsing fails
      expect(mockPackagesService.getAllPackages).toHaveBeenCalledWith(
        testCompanyId,
        1, // NaN becomes 1
        10, // NaN becomes 10
        {}
      );
    });
  });
});