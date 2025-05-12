# SparrowX Technical Specifications

## Overview
SparrowX is a multi-tenant SaaS platform designed for Jamaican package-forwarding companies. It provides an API-driven backend and a Next.js-based frontend portal for both customers and employees, with data isolation, role-based access control, and dynamic company branding.

## 1. System Architecture
- **Frontend**: Next.js application using JWT for authentication (DEPRECATED: previously Auth0), TailwindCSS (Shadcn) for styling, and React Context for dynamic theming.
- **Backend**: Express.js API secured by JWT tokens, organized into controllers, services, and repositories.
- **Database**: PostgreSQL accessed via Drizzle ORM; single database with shared schema, using company_id for tenant isolation.
- **Authentication**: JWT-based authentication and RBAC for user roles (Customer, Admin L1, Admin L2) (DEPRECATED: previously Auth0).
- **Validation**: Zod schemas on both frontend and backend for payload validation.

## 2. Multi-Tenant Strategy
- **Data Isolation**: Every table includes a company_id foreign key; every query filters by the authenticated tenant's ID.
- **JWT Organizations**: Each tenant is identified in JWT claims. Tokens include company_id and roles claims (DEPRECATED: previously Auth0 Organizations).
- **Tenant Context**: Middleware extracts company_id from JWT and sets req.companyId for all routes.
- **Company Branding**: Dynamic theming based on company settings and assets.
- **Tenant Provisioning**: Automated setup process to create new tenant environments.

## 3. Authentication & Authorization
- **Sign-Up / Login**:
  - Customers register via /api/companies/:companyId/customers.
  - Employees (L2) are invited via admin interface (DEPRECATED: previously via Auth0 Management API).
- **Roles**:
  - **Customer**: Access to their own packages, prealerts, invoices.
  - **Admin L1**: Customer and package management, bill generation, payments.
  - **Admin L2**: All L1 rights plus employee management, company settings, fee configuration.
- **Middleware**: checkJwt verifies JWT, checkRole(role) enforces RBAC.
- **Password Policies**: Enforced through application, requiring strong passwords and MFA for admins.
- **Session Management**: JWT-based with configurable expiration and refresh token rotation.

## 4. Database Schema & Drizzle Migrations
Below is the consolidated, multi-tenant database schema. All tables include a company_id foreign key (UUID) to enforce tenant isolation. Primary keys use UUIDs to simplify federation and security.

### Core Tables and Field Descriptions

#### companies
- **id** (UUID PK): Unique identifier for each tenant.
- **name** (TEXT): Official company name.
- **subdomain** (TEXT): Unique subdomain for tenant portal.
- **images** (JSONB): Object storing sets of image URLs (e.g., {"logo": "...", "banner": "..."}).
- **address** (TEXT): Street address for the company.
- **phone** (TEXT): Contact phone number.
- **locations** (TEXT[]): Locations where users can pick up their packages.
- **email** (TEXT): Support or general contact email (unique).
- **website** (TEXT): Company website URL.
- **bank_info** (TEXT): Banking details for payments.
- **created_at** (TIMESTAMPTZ): Record creation timestamp.
- **updated_at** (TIMESTAMPTZ): Last modification timestamp.

#### company_assets
- **id** (UUID PK): Unique asset identifier.
- **company_id** (UUID FK): References companies.id to tie asset to tenant.
- **type** (ENUM): Asset type, one of (logo, banner, favicon, small_logo).
- **url** (TEXT): Public URL of the stored asset.
- **created_at** (TIMESTAMPTZ): When the asset was uploaded.

#### users
- **id** (UUID PK): Unique identifier for all user accounts.
- **company_id** (UUID FK): References tenant to which user belongs.
- **email** (TEXT): User login email (unique).
- **password_hash** (TEXT): Bcrypt hashed password for JWT authentication.
- **first_name** (TEXT): User's first name.
- **last_name** (TEXT): User's last name.
- **phone** (TEXT): Contact phone number.
- **address** (TEXT): Physical address.
- **role** (ENUM): User role (customer, admin_l1, admin_l2).
- **auth0_id** (TEXT): [DEPRECATED] Auth0 user identifier.
- **is_active** (BOOLEAN): Account status.
- **created_at** (TIMESTAMPTZ): Account creation date.
- **updated_at** (TIMESTAMPTZ): Last update timestamp.

#### packages
- **id** (UUID PK): Unique package identifier.
- **company_id** (UUID FK): References companies.id.
- **user_id** (UUID FK): References users.id, package owner.
- **tracking_number** (TEXT): Original shipper's tracking number.
- **internal_tracking_id** (TEXT): Company-generated tracking ID.
- **status** (ENUM): Package status (pre_alert, received, processed, ready_for_pickup, delivered, returned).
- **description** (TEXT): Package contents description.
- **weight** (DECIMAL): Weight in pounds.
- **dimensions** (JSONB): Object with dimensions (length, width, height in inches).
- **declared_value** (DECIMAL): Value declared for customs.
- **sender_info** (JSONB): Information about the original sender.
- **tags** (TEXT[]): Array of tags for categorizing and filtering packages.
- **received_date** (TIMESTAMPTZ): When package was received at warehouse.
- **processing_date** (TIMESTAMPTZ): When package was processed.
- **photos** (TEXT[]): Array of photo URLs.
- **notes** (TEXT): Internal notes about the package.
- **created_at** (TIMESTAMPTZ): Record creation date.
- **updated_at** (TIMESTAMPTZ): Last update timestamp.

#### pre_alerts
- **id** (UUID PK): Unique pre-alert identifier.
- **company_id** (UUID FK): References companies.id.
- **user_id** (UUID FK): References users.id.
- **tracking_number** (TEXT): Original shipper's tracking number.
- **courier** (TEXT): Shipping courier (USPS, FedEx, etc.).
- **description** (TEXT): Expected package contents.
- **estimated_weight** (DECIMAL): Estimated weight in pounds.
- **estimated_arrival** (TIMESTAMPTZ): Expected arrival date.
- **package_id** (UUID FK): References packages.id, initially NULL until matched.
- **status** (ENUM): Status (pending, matched, cancelled).
- **created_at** (TIMESTAMPTZ): When pre-alert was created.
- **updated_at** (TIMESTAMPTZ): Last update timestamp.

#### invoices
- **id** (UUID PK): Unique invoice identifier.
- **company_id** (UUID FK): References companies.id.
- **user_id** (UUID FK): References users.id, customer being billed.
- **invoice_number** (TEXT): Human-readable invoice number.
- **status** (ENUM): Status (draft, issued, paid, cancelled, overdue).
- **issue_date** (TIMESTAMPTZ): When invoice was issued.
- **due_date** (TIMESTAMPTZ): Payment due date.
- **subtotal** (DECIMAL): Sum of line items before taxes.
- **tax_amount** (DECIMAL): Applied taxes.
- **total_amount** (DECIMAL): Final invoice amount.
- **notes** (TEXT): Additional invoice notes.
- **created_at** (TIMESTAMPTZ): Record creation date.
- **updated_at** (TIMESTAMPTZ): Last update timestamp.

#### invoice_items
- **id** (UUID PK): Unique line item identifier.
- **company_id** (UUID FK): References companies.id.
- **invoice_id** (UUID FK): References invoices.id.
- **package_id** (UUID FK): References packages.id, can be NULL.
- **description** (TEXT): Service description.
- **quantity** (INTEGER): Number of units.
- **unit_price** (DECIMAL): Price per unit.
- **line_total** (DECIMAL): Line item total (quantity * unit_price).
- **type** (ENUM): Item type (shipping, handling, customs, tax, other).
- **created_at** (TIMESTAMPTZ): Record creation date.
- **updated_at** (TIMESTAMPTZ): Last update timestamp.

#### payments
- **id** (UUID PK): Unique payment identifier.
- **company_id** (UUID FK): References companies.id.
- **invoice_id** (UUID FK): References invoices.id.
- **user_id** (UUID FK): References users.id, payer.
- **amount** (DECIMAL): Payment amount.
- **payment_method** (ENUM): Method (credit_card, bank_transfer, cash, check).
- **status** (ENUM): Status (pending, completed, failed, refunded).
- **transaction_id** (TEXT): External payment processor reference.
- **payment_date** (TIMESTAMPTZ): When payment was processed.
- **notes** (TEXT): Payment notes.
- **created_at** (TIMESTAMPTZ): Record creation date.
- **updated_at** (TIMESTAMPTZ): Last update timestamp.

#### company_settings
- **id** (UUID PK): Unique settings identifier.
- **company_id** (UUID FK): References companies.id.
- **shipping_rates** (JSONB): Structure defining shipping rate calculation.
- **handling_fees** (JSONB): Structure defining handling fee calculation.
- **customs_fees** (JSONB): Structure defining customs fee calculation.
- **tax_rates** (JSONB): Applied tax rates.
- **notification_settings** (JSONB): Email/SMS notification preferences.
- **theme_settings** (JSONB): UI theme configuration.
- **created_at** (TIMESTAMPTZ): Record creation date.
- **updated_at** (TIMESTAMPTZ): Last update timestamp.

## 5. API Endpoints

### Authentication Endpoints
- **POST /api/auth/login**: Authenticate user and return JWT (DEPRECATED: previously Auth0 JWT verification on all protected routes)
- **POST /api/auth/signup**: Create new customer account
- **POST /api/auth/refresh**: Refresh JWT token
- **GET /api/auth/me**: Get current user profile

### Company Management
- **GET /api/companies**: List all companies (super admin only)
- **POST /api/companies**: Create new company (super admin only)
- **GET /api/companies/:id**: Get company details
- **PUT /api/companies/:id**: Update company details
- **DELETE /api/companies/:id**: Deactivate company

### User Management
- **GET /api/companies/:companyId/users**: List all users for company
- **POST /api/companies/:companyId/users**: Create new user
- **GET /api/companies/:companyId/users/:id**: Get user details
- **PUT /api/companies/:companyId/users/:id**: Update user
- **DELETE /api/companies/:companyId/users/:id**: Deactivate user

### Package Management
- **GET /api/companies/:companyId/packages**: List packages for company
- **POST /api/companies/:companyId/packages**: Register new package
- **GET /api/companies/:companyId/packages/:id**: Get package details
- **PUT /api/companies/:companyId/packages/:id**: Update package
- **DELETE /api/companies/:companyId/packages/:id**: Mark package as deleted

### Pre-alert Management
- **GET /api/companies/:companyId/prealerts**: List pre-alerts
- **POST /api/companies/:companyId/prealerts**: Create pre-alert
- **GET /api/companies/:companyId/prealerts/:id**: Get pre-alert details
- **PUT /api/companies/:companyId/prealerts/:id**: Update pre-alert
- **DELETE /api/companies/:companyId/prealerts/:id**: Cancel pre-alert

### Invoice Management
- **GET /api/companies/:companyId/invoices**: List invoices
- **POST /api/companies/:companyId/invoices**: Create invoice
- **GET /api/companies/:companyId/invoices/:id**: Get invoice details
- **PUT /api/companies/:companyId/invoices/:id**: Update invoice
- **POST /api/companies/:companyId/invoices/:id/finalize**: Finalize and issue invoice
- **POST /api/companies/:companyId/invoices/:id/cancel**: Cancel invoice

### Payment Management
- **GET /api/companies/:companyId/payments**: List payments
- **POST /api/companies/:companyId/payments**: Record payment
- **GET /api/companies/:companyId/payments/:id**: Get payment details
- **POST /api/companies/:companyId/payments/:id/refund**: Process refund

### Settings Management
- **GET /api/companies/:companyId/settings**: Get company settings
- **PUT /api/companies/:companyId/settings**: Update company settings

### Fee Management
- **GET /api/companies/:companyId/fees**: List all fees for company
- **POST /api/companies/:companyId/fees**: Create new fee
- **GET /api/companies/:companyId/fees/:id**: Get fee details
- **PUT /api/companies/:companyId/fees/:id**: Update fee
- **DELETE /api/companies/:companyId/fees/:id**: Deactivate fee
- **POST /api/companies/:companyId/fees/calculate**: Calculate fees for a specific package

## 6. Frontend Architecture

### Page Structure
- **Public Pages**: Home, About, Contact, Pricing, Login/Signup
- **Customer Portal**:
  - Dashboard
  - Package Tracking
  - Pre-alerts
  - Invoices
  - Payments
  - Profile/Settings
- **Admin Portal (L1/L2)**:
  - Dashboard
  - Customer Management
  - Package Management
  - Invoice Management
  - Payment Processing
  - Reports
  - Company Settings (L2 only)
  - Employee Management (L2 only)

### Component Architecture
- **Layout Components**: AppShell, Navbar, Sidebar, Footer
- **Authentication Components**: LoginForm, SignupForm, PasswordReset
- **Data Display Components**: DataTable, Card, StatusBadge, Timeline
- **Form Components**: FormInput, FormSelect, DatePicker, FileUpload
- **UI Components**: Button, Modal, Notification, Tabs, Accordion
- **Domain-Specific Components**:
  - PackageCard, PackageDetails, PackageStatusFlow
  - InvoiceForm, InvoicePreview, PaymentForm
  - CustomerProfile, CustomerPackages, CustomerInvoices

### State Management
- React Context API for:
  - Authentication state
  - Company branding/theming
  - User preferences
  - Notifications
- React Query for API data fetching and caching

## 7. Billing and Invoice Generation

### Billing Calculation Process

The billing system follows a structured process to calculate charges and generate invoices:

1. **Package Fee Calculation**:
   - Each package is evaluated for applicable fees based on its attributes (weight, dimensions, value)
   - Applicable fees are determined using the company's fee configuration and package properties
   - Conditional rules (thresholds, tags, etc.) are applied to determine which fees should be included
   - Fees are calculated according to their calculation method (fixed, percentage, per_weight, etc.)
   - Minimum thresholds and maximum caps are applied to each fee amount

2. **Invoice Generation**:
   - For each package to be billed, all applicable fees are calculated
   - Line items are created for each fee (shipping, handling, customs, tax, other)
   - Subtotal is calculated from all non-tax fees
   - Tax is calculated based on the subtotal
   - Total amount combines subtotal and tax amount
   - Invoice metadata (number, dates, status) is generated

3. **Fee Types and Processing Order**:
   - **Shipping Fees**: Calculated first, based on weight, dimensions, or fixed rates
   - **Handling Fees**: Applied for package processing, inspection, and additional services
   - **Customs Fees**: Applied based on declared value, often as a percentage
   - **Other Fees**: Any additional service fees not covered by other categories
   - **Tax**: Applied last, typically on the subtotal of all other fees

4. **Invoice Previews and Finalization**:
   - Preview functionality allows calculating total without creating an invoice
   - Draft invoices can be generated and then finalized when ready to issue
   - Finalized invoices trigger notifications to customers
   - Invoices maintain links to all associated packages for tracking purposes

### Billing API Endpoints

The billing system exposes the following API endpoints:

- `GET /companies/:companyId/billing/packages/:packageId/fees`: Calculate fees for a specific package
- `POST /companies/:companyId/billing/invoices/preview`: Preview invoice calculation without creating one
- `POST /companies/:companyId/billing/invoices/generate`: Generate an invoice for specific packages
- `POST /companies/:companyId/billing/users/:userId/generate-invoice`: Generate invoice for all unbilled packages of a user

### Billing Service Components

The billing system consists of multiple components:

1. **Fees Service**: Manages fee configurations and calculations
2. **Billing Service**: Handles the invoice generation process
3. **Invoice Items Repository**: Manages the line items for invoices
4. **Packages Repository**: Includes methods to find unbilled packages
5. **Configuration Repository**: Stores company-specific billing rules

## 8. Customer Portal Integration

The SparrowX platform includes a customer portal interface that allows customers to track packages, create pre-alerts, view and pay invoices, and manage their account information. The customer portal is built on the same multi-tenant architecture as the rest of the platform, ensuring proper data isolation and security.

### Customer Portal Architecture

1. **Frontend Components**:
   - Next.js-based responsive interface
   - Company-specific branding and theming
   - Mobile-friendly design with responsive layouts
   - Real-time package tracking and status updates

2. **Backend Integration**:
   - RESTful API endpoints for all customer operations
   - JWT-based authentication and session management
   - Role-based access control limiting users to customer-specific actions
   - Webhooks for real-time event notifications

3. **Customer-Specific Functionality**:
   - Package tracking with status history and photos
   - Pre-alert creation and management
   - Invoice viewing and online payment
   - Profile management and communication preferences

### Integration Points

The customer portal provides several integration points for custom implementations:

1. **API Integration**:
   - Comprehensive REST API for all customer operations
   - Consistent authentication and authorization mechanisms
   - Standardized error handling and response formats

2. **Webhook Events**:
   - Real-time notifications for package status changes(PLANNED)
   - Invoice and payment status updates
   - Customer account activity notifications(PLANNED)

3. **Custom Frontend Integration**:
   - Ability to embed tracking widgets in external sites(PLANNED)
   - White-labeled customer portal instances
   - Custom domain mapping for tenant-specific portals

For detailed integration instructions, refer to the [Customer Portal Integration Guide](./CUSTOMER-PORTAL-INTEGRATION.md).

## 9. Security Measures
- **Authentication**: Auth0 JWT verification on all protected routes
- **Authorization**: Role-based access control on both frontend and backend
- **Data Isolation**: Tenant filtering on all database queries
- **Input Validation**: Zod schema validation on all API endpoints
- **CSRF Protection**: Token-based protection for state-changing operations
- **Rate Limiting**: API rate limiting to prevent abuse
- **Content Security Policy**: Restricted resource loading policies
- **Database Security**:
  - Parameterized queries to prevent SQL injection
  - Encryption of sensitive fields
  - Row-level security policies
- **Audit Logging**: Comprehensive logging of security-relevant events
- **Regular Security Audits**: Scheduled security reviews and penetration testing

## 10. External Integrations
- **Shipping Carriers**:
  - Magaya Integration

## 11. Deployment Infrastructure
- **Development Environment**:
  - Local Docker setup
  - Development database
  - Auth0 tenant for development
- **Production Environment**:
  - Load-balanced AWS EC2 instances for backend
  - Vercel production deployment for frontend
  - Production PostgreSQL with read replicas
  - Redis for caching
  - CloudFront CDN for static assets

## 12. Testing Strategy
- **Unit Testing**:
  - Jest for JavaScript/TypeScript testing
  - Backend service and utility function tests
  - Frontend component tests
- **Integration Testing**:
  - API endpoint testing with Supertest
  - Database integration tests
- **End-to-End Testing**:
  - Cypress for frontend user flows
  - Multi-tenant testing scenarios
- **Performance Testing**:
  - Load testing with k6
  - Database query performance benchmarking
- **Security Testing**:
  - Regular vulnerability scanning
  - Penetration testing

## 13. Monitoring and Logging
- **Application Monitoring**:
  - DataDog APM for performance monitoring
  - Error tracking with Sentry
- **Infrastructure Monitoring**:
  - Server metrics monitoring
  - Database performance monitoring
  - API response time tracking
- **Logging**:
  - Structured JSON logs
  - Centralized log aggregation
  - Log retention policies
- **Alerting**:
  - Critical error notifications
  - Performance degradation alerts
  - Security incident alerts

## 14. Performance Optimization
- **Database Optimization**:
  - Appropriate indexes on frequently queried fields
  - Query optimization for multi-tenant filtering
  - Connection pooling
- **API Performance**:
  - Response caching with Redis
  - Pagination for large result sets
  - Throttling for resource-intensive operations
- **Frontend Performance**:
  - Code splitting for reduced bundle size
  - Static site generation for public pages
  - Image optimization
  - Service worker for offline capabilities

## 15. Backup and Disaster Recovery
- **Database Backups**:
  - Automated daily backups
  - Point-in-time recovery capability
- **Application Backups**:
  - Configuration backup
  - File storage backup
- **Disaster Recovery Plan**:
  - Documented recovery procedures
  - Regular recovery testing
  - Cross-region replication

## 16. Documentation
- **API Documentation**:
  - API usage examples
- **Codebase Documentation**:
  - Inline code documentation
  - Architecture diagrams
  - Design decisions
- **Operational Documentation**:
  - Deployment procedures
  - Monitoring and alerting setup
  - Troubleshooting guides

## 17. Roadmap and Future Enhancements
- **Phase 1 (MVP)**:
  - Basic package tracking
  - Simple invoicing
  - Customer portal
- **Phase 2**:
  - Advanced reporting
  - Integration with major shipping carriers
  - Mobile application
- **Phase 3**:
  - Machine learning for package processing
  - Predictive analytics
  - International expansion

## 18. Fee Management System

The SparrowX platform includes a robust and flexible fee management system that allows companies to configure various types of charges that are dynamically calculated based on package data.

### Fee Calculation Methods

The system supports the following fee calculation methods:

1. **Flat Fee (`fixed`)**: 
   - A simple fixed amount charged regardless of package attributes
   - Example: $5 handling fee per package

2. **Percentage-Based Fee (`percentage`)**: 
   - Fee calculated as a percentage of a base amount
   - Can be applied to subtotal, total, or declared value
   - Example: 15% tax on subtotal

3. **Price Per Unit (`per_weight`, `per_item`)**:
   - Fee calculated based on a unit price multiplied by a quantity
   - Supports different units (kg, lb, item, cubic meter, etc.)
   - Example: $2.50 per pound shipping fee

4. **Dimensional Weight Pricing (`dimensional`)**:
   - Calculates fee based on volumetric weight using formula: (length × width × height) / dimensionalFactor
   - Uses the greater of actual weight or dimensional weight
   - Example: Shipping fee for bulky but lightweight items

5. **Tiered Pricing (`tiered`)**:
   - Sets different rates based on value ranges
   - Can be tiered on any numeric attribute (weight, value, etc.)
   - Example: 0-5kg = $10, 5-10kg = $15, 10kg+ = $20

### Fee Metadata

Each fee can include additional configuration in the `metadata` JSONB field:

```json
{
  "dimensionalFactor": 139,
  "tiers": [
    { "min": 0, "max": 5, "rate": 10.00 },
    { "min": 5, "max": 10, "rate": 15.00 },
    { "min": 10, "max": null, "rate": 20.00 }
  ],
  "baseAttribute": "subtotal",
  "unit": "kg",
  "attributeName": "weight",
  "minimumThreshold": 5.00,
  "maximumCap": 50.00,
  "tagConditions": {
    "requiredTags": ["fragile", "oversized"],
    "excludedTags": ["document"]
  },
  "thresholdConditions": {
    "minWeight": 2,
    "maxWeight": 50,
    "minValue": 100,
    "validFrom": "2023-01-01",
    "validUntil": "2023-12-31"
  }
}
```

### Fee Calculation Service

The fee calculation service implements the following key functions:

- `calculateFee(fee, packageData)`: Main method to calculate a fee amount
- `feeApplies(fee, packageData)`: Determines if a fee should apply to a package
- `applyLimits(amount, metadata)`: Applies min/max constraints to calculated fee
- Method-specific calculation functions for each fee type

### Integration with Invoice Generation

The fee system integrates with invoice generation to:

1. Identify applicable fees for a package
2. Calculate fee amounts based on package attributes
3. Add fee line items to the invoice
4. Apply tax calculations as appropriate 