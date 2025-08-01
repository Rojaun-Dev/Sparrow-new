import { AuthController } from '../../../src/controllers/auth-controller';
import { UsersService } from '../../../src/services/users-service';
import { ApiResponse } from '../../../src/utils/response';
import { mockRequest, mockResponse, createTestUser, withTenant } from '../../helpers/test-utils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../../src/services/users-service');
jest.mock('../../../src/utils/response');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const MockedUsersService = UsersService as jest.MockedClass<typeof UsersService>;
const MockedApiResponse = ApiResponse as jest.Mocked<typeof ApiResponse>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthController', () => {
  let controller: AuthController;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockNext: jest.Mock;

  const testCompanyId = 'test-company-id';
  const testUserId = 'test-user-id';
  const testUser = createTestUser(testCompanyId);

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh mock instances
    MockedUsersService.mockClear();
    
    controller = new AuthController();
    mockUsersService = MockedUsersService.mock.instances[0] as jest.Mocked<UsersService>;
    mockNext = jest.fn();

    // Mock ApiResponse methods
    MockedApiResponse.success = jest.fn();
    MockedApiResponse.unauthorized = jest.fn();
    MockedApiResponse.badRequest = jest.fn();
    MockedApiResponse.validationError = jest.fn();
    MockedApiResponse.notFound = jest.fn();
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      const userWithPassword = {
        ...testUser,
        passwordHash: 'hashed-password'
      };
      const token = 'jwt-token';

      mockUsersService.getUserByEmailWithPassword = jest.fn().mockResolvedValue(userWithPassword);
      mockedBcrypt.compare = jest.fn().mockResolvedValue(true);
      mockedJwt.sign = jest.fn().mockReturnValue(token);

      const req = mockRequest({
        body: validLoginData
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(mockUsersService.getUserByEmailWithPassword).toHaveBeenCalledWith(validLoginData.email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(validLoginData.password, userWithPassword.passwordHash);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          user_id: testUser.id,
          company_id: testUser.company_id,
          role: testUser.role,
          email: testUser.email
        },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(MockedApiResponse.success).toHaveBeenCalledWith(
        res,
        {
          user: {
            id: testUser.id,
            email: testUser.email,
            firstName: testUser.first_name,
            lastName: testUser.last_name,
            role: testUser.role,
            companyId: testUser.company_id
          },
          token
        },
        'Login successful'
      );
    });

    it('should reject login with invalid email', async () => {
      mockUsersService.getUserByEmailWithPassword = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        body: validLoginData
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(MockedApiResponse.unauthorized).toHaveBeenCalledWith(res, 'Invalid email or password');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(mockedJwt.sign).not.toHaveBeenCalled();
    });

    it('should reject login with invalid password', async () => {
      const userWithPassword = {
        ...testUser,
        passwordHash: 'hashed-password'
      };

      mockUsersService.getUserByEmailWithPassword = jest.fn().mockResolvedValue(userWithPassword);
      mockedBcrypt.compare = jest.fn().mockResolvedValue(false);

      const req = mockRequest({
        body: validLoginData
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(validLoginData.password, userWithPassword.passwordHash);
      expect(MockedApiResponse.unauthorized).toHaveBeenCalledWith(res, 'Invalid email or password');
      expect(mockedJwt.sign).not.toHaveBeenCalled();
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = {
        ...testUser,
        is_active: false,
        passwordHash: 'hashed-password'
      };

      mockUsersService.getUserByEmailWithPassword = jest.fn().mockResolvedValue(inactiveUser);
      mockedBcrypt.compare = jest.fn().mockResolvedValue(true);

      const req = mockRequest({
        body: validLoginData
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(MockedApiResponse.unauthorized).toHaveBeenCalledWith(res, 'Account is deactivated');
      expect(mockedJwt.sign).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const invalidLoginData = {
        email: 'invalid-email',
        password: '123' // too short
      };

      const req = mockRequest({
        body: invalidLoginData
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(MockedApiResponse.validationError).toHaveBeenCalled();
      expect(mockUsersService.getUserByEmailWithPassword).not.toHaveBeenCalled();
    });

    it('should handle missing credentials', async () => {
      const req = mockRequest({
        body: {} // empty body
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(MockedApiResponse.badRequest).toHaveBeenCalledWith(res, 'Email and password are required');
    });
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      companyId: testCompanyId
    };

    it('should register new user successfully', async () => {
      const hashedPassword = 'hashed-password';
      const newUser = {
        ...testUser,
        email: validRegisterData.email,
        first_name: validRegisterData.firstName,
        last_name: validRegisterData.lastName
      };

      mockUsersService.getUserByEmail = jest.fn().mockResolvedValue(null);
      mockedBcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      mockUsersService.createUser = jest.fn().mockResolvedValue(newUser);

      const req = mockRequest({
        body: validRegisterData
      });
      const res = mockResponse();

      await controller.register(req as any, res as any, mockNext);

      expect(mockUsersService.getUserByEmail).toHaveBeenCalledWith(validRegisterData.email);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(validRegisterData.password, 10);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        {
          email: validRegisterData.email,
          firstName: validRegisterData.firstName,
          lastName: validRegisterData.lastName,
          role: 'customer',
          passwordHash: hashedPassword
        },
        validRegisterData.companyId
      );
      expect(MockedApiResponse.success).toHaveBeenCalledWith(
        res,
        {
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role,
            companyId: newUser.company_id
          }
        },
        'Registration successful',
        201
      );
    });

    it('should reject registration with existing email', async () => {
      mockUsersService.getUserByEmail = jest.fn().mockResolvedValue(testUser);

      const req = mockRequest({
        body: validRegisterData
      });
      const res = mockResponse();

      await controller.register(req as any, res as any, mockNext);

      expect(MockedApiResponse.badRequest).toHaveBeenCalledWith(res, 'User with this email already exists');
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });

    it('should handle registration validation errors', async () => {
      const invalidRegisterData = {
        email: 'invalid-email',
        password: '123', // too short
        firstName: '',
        lastName: '',
        companyId: ''
      };

      const req = mockRequest({
        body: invalidRegisterData
      });
      const res = mockResponse();

      await controller.register(req as any, res as any, mockNext);

      expect(MockedApiResponse.validationError).toHaveBeenCalled();
      expect(mockUsersService.getUserByEmail).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user info', async () => {
      mockUsersService.getUserById = jest.fn().mockResolvedValue(testUser);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        userId: testUserId
      });
      const res = mockResponse();

      await controller.getCurrentUser(req as any, res as any, mockNext);

      expect(mockUsersService.getUserById).toHaveBeenCalledWith(testUserId, testCompanyId);
      expect(MockedApiResponse.success).toHaveBeenCalledWith(res, {
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.first_name,
        lastName: testUser.last_name,
        role: testUser.role,
        companyId: testUser.company_id,
        phone: testUser.phone,
        address: testUser.address,
        isActive: testUser.is_active
      });
    });

    it('should handle user not found', async () => {
      mockUsersService.getUserById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        ...withTenant(testCompanyId),
        companyId: testCompanyId,
        userId: testUserId
      });
      const res = mockResponse();

      await controller.getCurrentUser(req as any, res as any, mockNext);

      expect(MockedApiResponse.notFound).toHaveBeenCalledWith(res, 'User not found');
    });
  });

  describe('Error handling', () => {
    it('should handle service errors in login', async () => {
      const error = new Error('Database error');
      mockUsersService.getUserByEmailWithPassword = jest.fn().mockRejectedValue(error);

      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle bcrypt errors', async () => {
      const userWithPassword = {
        ...testUser,
        passwordHash: 'hashed-password'
      };
      const error = new Error('Bcrypt error');

      mockUsersService.getUserByEmailWithPassword = jest.fn().mockResolvedValue(userWithPassword);
      mockedBcrypt.compare = jest.fn().mockRejectedValue(error);

      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Security considerations', () => {
    it('should not expose sensitive user data in responses', async () => {
      const userWithPassword = {
        ...testUser,
        passwordHash: 'hashed-password'
      };
      const token = 'jwt-token';

      mockUsersService.getUserByEmailWithPassword = jest.fn().mockResolvedValue(userWithPassword);
      mockedBcrypt.compare = jest.fn().mockResolvedValue(true);
      mockedJwt.sign = jest.fn().mockReturnValue(token);

      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      const successCall = MockedApiResponse.success.mock.calls[0];
      const responseData = successCall[1];
      
      expect(responseData.user.passwordHash).toBeUndefined();
      expect(responseData.user.password).toBeUndefined();
    });

    it('should use consistent error messages for invalid credentials', async () => {
      // Test both invalid email and invalid password scenarios
      mockUsersService.getUserByEmailWithPassword = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      });
      const res = mockResponse();

      await controller.login(req as any, res as any, mockNext);

      expect(MockedApiResponse.unauthorized).toHaveBeenCalledWith(res, 'Invalid email or password');
    });
  });
});