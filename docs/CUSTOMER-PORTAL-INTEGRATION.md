# Customer Portal Integration Guide

This document provides comprehensive information about integrating with the SparrowX customer portal backend and utilizing its APIs for custom frontend implementations.

## Overview

The SparrowX customer portal provides a multi-tenant interface for package-forwarding customers to:
- Track packages and shipments
- Create pre-alerts for incoming packages
- View and pay invoices
- Update personal information
- Communicate with staff

## Backend Integration Points

### Authentication Flow

The customer portal uses JWT-based authentication with the following flow:

1. **Login**:
   - Endpoint: `POST /api/auth/login`
   - Payload: `{ email, password }`
   - Response: `{ token, user }`
   - The JWT token contains claims for user ID, company ID, and role

2. **Token Validation**:
   - All protected routes validate the JWT token via middleware
   - Token must be included in the `Authorization` header as `Bearer {token}`
   - Invalid or expired tokens return 401 Unauthorized responses

3. **User Registration**:
   - Endpoint: `POST /api/auth/signup` 
   - Payload: `{ email, password, firstName, lastName, phone, companyId }`
   - Response: `{ success, message }`
   - New accounts require approval by company admins before activation

### Customer-Specific Endpoints

#### Package Management
- **List Customer Packages**:
  - Endpoint: `GET /api/companies/:companyId/users/:userId/packages`
  - Supports filtering by status, date range, and search terms
  - Returns paginated list of packages with tracking information

- **Package Details**:
  - Endpoint: `GET /api/companies/:companyId/packages/:packageId`
  - Returns complete package information including status history, photos, and dimensions

#### Pre-Alert Creation
- **Create Pre-Alert**:
  - Endpoint: `POST /api/companies/:companyId/prealerts`
  - Payload: `{ trackingNumber, courier, description, estimatedWeight, estimatedArrival }`
  - Response: `{ id, trackingNumber, status }`

- **List Pre-Alerts**:
  - Endpoint: `GET /api/companies/:companyId/users/:userId/prealerts`
  - Returns all pre-alerts for the authenticated customer

#### Invoice and Payment
- **List Invoices**:
  - Endpoint: `GET /api/companies/:companyId/users/:userId/invoices`
  - Returns paginated list of invoices with status information

- **Invoice Details**:
  - Endpoint: `GET /api/companies/:companyId/invoices/:invoiceId`
  - Returns complete invoice with line items and payment status

- **Make Payment**:
  - Endpoint: `POST /api/companies/:companyId/invoices/:invoiceId/payments`
  - Payload: `{ amount, paymentMethod, transactionId }`
  - Response: `{ success, paymentId, status }`

#### User Profile
- **Get Profile**:
  - Endpoint: `GET /api/auth/me`
  - Returns authenticated user's profile information

- **Update Profile**:
  - Endpoint: `PUT /api/companies/:companyId/users/:userId`
  - Payload: `{ firstName, lastName, phone, address }`
  - Response: `{ success, user }`

## Integration with External Frontend

For custom frontend applications integrating with the SparrowX backend:

### API Client Setup

1. **Base Configuration**:
   ```javascript
   // Example API client configuration
   const apiClient = axios.create({
     baseURL: process.env.API_URL,
     timeout: 10000,
     headers: {
       'Content-Type': 'application/json'
     }
   });
   
   // Add authorization interceptor
   apiClient.interceptors.request.use(config => {
     const token = localStorage.getItem('authToken');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

2. **Error Handling**:
   ```javascript
   // Add response interceptor for error handling
   apiClient.interceptors.response.use(
     response => response,
     error => {
       if (error.response && error.response.status === 401) {
         // Handle token expiration
         localStorage.removeItem('authToken');
         window.location.href = '/login';
       }
       return Promise.reject(error);
     }
   );
   ```

### Authentication Integration

1. **Login Implementation**:
   ```javascript
   const login = async (email, password, companyId) => {
     try {
       const response = await apiClient.post('/api/auth/login', {
         email,
         password,
         companyId
       });
       
       const { token, user } = response.data;
       localStorage.setItem('authToken', token);
       localStorage.setItem('userInfo', JSON.stringify(user));
       
       return { success: true, user };
     } catch (error) {
       return { 
         success: false, 
         message: error.response?.data?.message || 'Login failed' 
       };
     }
   };
   ```

2. **Registration Implementation**:
   ```javascript
   const register = async (userData, companyId) => {
     try {
       await apiClient.post('/api/auth/signup', {
         ...userData,
         companyId
       });
       
       return { 
         success: true, 
         message: 'Registration successful. Your account is pending approval.' 
       };
     } catch (error) {
       return { 
         success: false, 
         message: error.response?.data?.message || 'Registration failed' 
       };
     }
   };
   ```

## Multi-Tenant Integration

For multi-tenant customer portal implementations:

### Company Identification

1. **Subdomain Routing**:
   - Each tenant has a unique subdomain (e.g., `company1.sparrowx.com`)
   - Frontend should extract company identifier from subdomain
   - Pass companyId to all API requests

2. **Company Branding**:
   - Fetch company assets using:
     `GET /api/companies/:companyId/assets`
   - Apply company themes using theme settings:
     `GET /api/companies/:companyId/settings/theme`

### Tenant Isolation

All customer portal operations must maintain tenant isolation by:

1. Including the company_id in all API requests
2. Validating that users belong to the specified company
3. Ensuring JWT tokens contain the correct company_id claim

## Webhooks

The customer portal backend provides webhooks for real-time integrations:

1. **Package Status Updates**:
   - Event: `package.status_changed`
   - Payload: `{ packageId, oldStatus, newStatus, timestamp }`

2. **Invoice Status Updates**:
   - Event: `invoice.status_changed`
   - Payload: `{ invoiceId, oldStatus, newStatus, timestamp }`

3. **Payment Notifications**:
   - Event: `payment.received`
   - Payload: `{ paymentId, invoiceId, amount, method, timestamp }`

## Data Models

Key data models used in customer portal integration:

### Package Model
```typescript
interface Package {
  id: string;
  companyId: string;
  userId: string;
  trackingNumber: string;
  internalTrackingId: string;
  status: 'pre_alert' | 'received' | 'processed' | 'ready_for_pickup' | 'delivered' | 'returned';
  description: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue: number;
  senderInfo: {
    name: string;
    address: string;
  };
  tags: string[];
  receivedDate: string | null;
  processingDate: string | null;
  photos: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Invoice Model
```typescript
interface Invoice {
  id: string;
  companyId: string;
  userId: string;
  invoiceNumber: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'overdue';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

Common API error responses and recommended handling:

| Status Code | Error                     | Recommended Action                                    |
|-------------|---------------------------|-------------------------------------------------------|
| 400         | Bad Request               | Validate input data before submission                 |
| 401         | Unauthorized              | Redirect to login page or refresh token               |
| 403         | Forbidden                 | Show access denied message                            |
| 404         | Resource Not Found        | Show appropriate not found message                    |
| 409         | Conflict                  | Show message about conflicting data                   |
| 422         | Validation Error          | Display field-specific validation errors              |
| 429         | Too Many Requests         | Implement rate limiting and retry with backoff        |
| 500         | Internal Server Error     | Show generic error and report to monitoring system    |

## Security Considerations

1. **CORS Configuration**:
   - The backend is configured to allow requests only from registered origins
   - Custom frontends must be registered with the SparrowX system

2. **CSRF Protection**:
   - For browser-based integrations, include the CSRF token:
     `headers: { 'X-CSRF-Token': csrfToken }`

3. **Data Encryption**:
   - All sensitive data is encrypted in transit (HTTPS)
   - PII and payment details are encrypted at rest

4. **Rate Limiting**:
   - API endpoints are rate-limited to prevent abuse
   - Implement exponential backoff for retries

## Testing Integration

To test your customer portal integration:

1. **Test Environment**:
   - Use the sandbox API endpoint: `https://api-sandbox.sparrowx.com`
   - Get test credentials from the SparrowX team

2. **Test Company**:
   - A test company with predefined data is available for integration testing
   - Company ID: `00000000-0000-0000-0000-000000000001`

3. **Test Users**:
   - Customer: `customer@test.com` / `TestPassword123`
   - Admin L1: `admin1@test.com` / `TestPassword123`
   - Admin L2: `admin2@test.com` / `TestPassword123`

## Support and Resources

For additional assistance with customer portal integration:

- API Documentation: `https://api.sparrowx.com/docs`
- Developer Support: `developer-support@sparrowx.com`
- Integration Guides: `https://docs.sparrowx.com/integration` 