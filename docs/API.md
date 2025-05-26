# SparrowX API Documentation

## Overview

The SparrowX API provides a comprehensive set of endpoints for managing shipping operations, user management, and company administration. This documentation covers all available endpoints, authentication methods, and usage examples.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Companies](#companies-endpoints)
  - [Packages](#packages-endpoints)
  - [Pre-Alerts](#pre-alerts-endpoints)
  - [Invoices](#invoices-endpoints)
  - [Payments](#payments-endpoints)
  - [Fees](#fees-endpoints)
  - [Company Settings](#company-settings-endpoints)
  - [Statistics](#statistics-endpoints)
  - [Superadmin](#superadmin-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Best Practices](#best-practices)

## Authentication

The API uses JWT (JSON Web Token) for authentication. All protected endpoints require a valid JWT token in the Authorization header.

```http
Authorization: Bearer <your_jwt_token>
```

### Authentication Flow

1. Login to obtain JWT token
2. Include token in subsequent requests
3. Refresh token when expired
4. Logout to invalidate token

## Base URL

```
https://api.sparrowx.com/v1
```

## API Endpoints

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "customer"
    }
  }
}
```

#### Signup
```http
POST /api/auth/signup
```

Request body:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

Request body:
```json
{
  "refreshToken": "refresh_token"
}
```

### Users Endpoints

#### Get User Profile
```http
GET /api/auth/me
```

#### Get Users by Role
```http
GET /api/users/role/:role
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field
- `order`: Sort order (asc/desc)

### Companies Endpoints

#### Get All Companies (Superadmin)
```http
GET /api/companies
```

#### Get Company by ID
```http
GET /api/companies/:id
```

#### Create Company
```http
POST /api/companies
```

Request body:
```json
{
  "name": "Company Name",
  "subdomain": "company-subdomain",
  "email": "company@example.com",
  "phone": "+1234567890",
  "address": "Company Address"
}
```

### Packages Endpoints

#### Get All Packages
```http
GET /api/companies/:companyId/packages
```

Query parameters:
- `status`: Package status
- `page`: Page number
- `limit`: Items per page
- `dateFrom`: Filter by date from
- `dateTo`: Filter by date to

#### Get Package by ID
```http
GET /api/companies/:companyId/packages/:id
```

#### Get Packages by User ID
```http
GET /api/companies/:companyId/packages/user/:userId
```

Query parameters:
- `page`: Page number
- `limit`: Items per page
- `dateFrom`: Filter by date from
- `dateTo`: Filter by date to

#### Get Packages by Status
```http
GET /api/companies/:companyId/packages/status/:status
```

#### Create Package
```http
POST /api/companies/:companyId/packages
```

Request body:
```json
{
  "trackingNumber": "TRK123456",
  "description": "Package description",
  "weight": 2.5,
  "dimensions": {
    "length": 10,
    "width": 5,
    "height": 5
  }
}
```

#### Update Package
```http
PUT /api/companies/:companyId/packages/:id
```

### Pre-Alerts Endpoints

#### Get All Pre-Alerts
```http
GET /api/companies/:companyId/pre-alerts
```

#### Get Pre-Alerts by User ID
```http
GET /api/companies/:companyId/pre-alerts/user/:userId
```

#### Get Pre-Alerts by Status
```http
GET /api/companies/:companyId/pre-alerts/status/:status
```

#### Get Pre-Alert by ID
```http
GET /api/companies/:companyId/pre-alerts/:id
```

#### Create Pre-Alert
```http
POST /api/companies/:companyId/pre-alerts
```

Request body:
```json
{
  "trackingNumber": "TRK123456",
  "courier": "Courier Name",
  "description": "Package description",
  "estimatedWeight": 2.5,
  "estimatedArrival": "2024-03-20T00:00:00Z"
}
```

#### Update Pre-Alert
```http
PUT /api/companies/:companyId/pre-alerts/:id
```

#### Cancel Pre-Alert
```http
POST /api/companies/:companyId/pre-alerts/:id/cancel
```

#### Delete Pre-Alert
```http
DELETE /api/companies/:companyId/pre-alerts/:id
```

#### Upload Documents
```http
POST /api/companies/:companyId/pre-alerts/:id/documents
```

Content-Type: multipart/form-data

### Invoices Endpoints

#### Search Invoices
```http
GET /api/companies/:companyId/invoices/search
```

Query parameters:
- `page`: Page number
- `limit`: Items per page
- `status`: Invoice status
- `dateFrom`: Filter by date from
- `dateTo`: Filter by date to

#### Get All Invoices
```http
GET /api/companies/:companyId/invoices
```

#### Get Invoice by ID
```http
GET /api/companies/:companyId/invoices/:id
```

#### Create Invoice
```http
POST /api/companies/:companyId/invoices
```

Request body:
```json
{
  "userId": "user_id",
  "items": [
    {
      "description": "Shipping fee",
      "quantity": 1,
      "unitPrice": 10.00,
      "type": "shipping"
    }
  ]
}
```

### Payments Endpoints

#### Get All Payments
```http
GET /api/companies/:companyId/payments
```

#### Create Payment
```http
POST /api/companies/:companyId/payments
```

Request body:
```json
{
  "invoiceId": "invoice_id",
  "amount": 100.00,
  "paymentMethod": "credit_card",
  "transactionId": "transaction_id"
}
```

### Fees Endpoints

#### Get All Fees
```http
GET /api/companies/:companyId/fees
```

#### Get Active Fees
```http
GET /api/companies/:companyId/fees/active
```

#### Get Fees by Type
```http
GET /api/companies/:companyId/fees/type/:type
```

#### Get Fee by ID
```http
GET /api/companies/:companyId/fees/:id
```

#### Create Fee
```http
POST /api/companies/:companyId/fees
```

Request body:
```json
{
  "name": "Shipping Fee",
  "code": "SHIPPING",
  "feeType": "shipping",
  "calculationMethod": "fixed",
  "amount": 10.00,
  "currency": "USD"
}
```

### Company Settings Endpoints

#### Get Company Settings
```http
GET /api/companies/:companyId/settings
```

#### Update Company Settings
```http
PUT /api/companies/:companyId/settings
```

Request body:
```json
{
  "shippingRates": {
    "standard": 10.00,
    "express": 20.00
  },
  "handlingFees": {
    "standard": 5.00
  }
}
```

### Statistics Endpoints

#### Get Customer Statistics
```http
GET /api/statistics/customer
```

#### Get Admin Statistics
```http
GET /api/statistics/admin
```

#### Get Superadmin Statistics
```http
GET /api/statistics/superadmin
```

### Superadmin Endpoints

#### Get All Companies
```http
GET /api/superadmin/companies
```

#### Get Company by ID
```http
GET /api/superadmin/companies/:id
```

#### Create Company
```http
POST /api/superadmin/companies
```

#### Update Company
```http
PUT /api/superadmin/companies/:id
```

#### Delete Company
```http
DELETE /api/superadmin/companies/:id
```

#### Get Company Statistics
```http
GET /api/superadmin/companies/:id/statistics
```

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Error message"
    }
  ]
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1616234400
```

## Best Practices

1. **Authentication**
   - Store tokens securely
   - Implement token refresh
   - Handle token expiration

2. **Error Handling**
   - Implement proper error handling
   - Display user-friendly messages
   - Log errors for debugging

3. **Performance**
   - Use pagination for large datasets
   - Implement caching where appropriate
   - Optimize request payloads

4. **Security**
   - Use HTTPS for all requests
   - Validate input data
   - Implement proper access control
   - Handle sensitive data appropriately

5. **Development**
   - Use environment variables
   - Implement proper logging
   - Follow API versioning
   - Document API changes 