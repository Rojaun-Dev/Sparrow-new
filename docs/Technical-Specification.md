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
  - Superadmins are created through system initialization or by existing superadmins.
- **Roles**:
  - **Customer**: Access to their own packages, prealerts, invoices.
  - **Admin L1**: Customer and package management, bill generation, payments.
  - **Admin L2**: All L1 rights plus employee management, company settings, fee configuration.
  - **Superadmin**: System-wide access including:
    - Company management and onboarding
    - Cross-tenant user management
    - System-wide monitoring and statistics
    - Platform administration and configuration
    - Audit log access and security management
- **Middleware**: checkJwt verifies JWT, checkRole(role) enforces RBAC.
- **Password Policies**: Enforced through application, requiring strong passwords and MFA for admins.
- **Session Management**: JWT-based with configurable expiration and refresh token rotation.

## 4. Database Schema & Drizzle Migrations
The system uses PostgreSQL with Drizzle ORM for database management. All tables include a company_id foreign key (UUID) to enforce tenant isolation. Primary keys use UUIDs to simplify federation and security.

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
- **bankInfo** (TEXT): Banking details for payments.
- **createdAt** (TIMESTAMPTZ): Record creation timestamp.
- **updatedAt** (TIMESTAMPTZ): Last modification timestamp.

#### users
- **id** (UUID PK): Unique identifier for all user accounts.
- **companyId** (UUID FK): References tenant to which user belongs.
- **email** (TEXT): User login email (unique).
- **passwordHash** (TEXT): Bcrypt hashed password for JWT authentication.
- **firstName** (TEXT): User's first name.
- **lastName** (TEXT): User's last name.
- **phone** (TEXT): Contact phone number.
- **address** (TEXT): Physical address.
- **trn** (TEXT): Tax Registration Number.
- **role** (ENUM): User role (customer, admin_l1, admin_l2, super_admin).
- **isActive** (BOOLEAN): Account status.
- **isVerified** (BOOLEAN): Email verification status.
- **verificationToken** (TEXT): Token for email verification.
- **verificationTokenExpires** (TIMESTAMPTZ): Expiration time for verification token.
- **notificationPreferences** (JSONB): User notification settings.
- **resetToken** (TEXT): Password reset token.
- **resetTokenExpires** (TIMESTAMPTZ): Password reset token expiration.
- **createdAt** (TIMESTAMPTZ): Account creation date.
- **updatedAt** (TIMESTAMPTZ): Last update timestamp.

#### packages
- **id** (UUID PK): Unique package identifier.
- **companyId** (UUID FK): References companies.id.
- **userId** (UUID FK): References users.id, package owner.
- **trackingNumber** (TEXT): Original shipper's tracking number.
- **internalTrackingId** (TEXT): Company-generated tracking ID (unique).
- **status** (ENUM): Package status (pre_alert, received, processed, ready_for_pickup, delivered, returned).
- **description** (TEXT): Package contents description.
- **weight** (DECIMAL): Weight in pounds.
- **dimensions** (JSONB): Object with dimensions (length, width, height in inches).
- **declaredValue** (DECIMAL): Value declared for customs.
- **senderInfo** (JSONB): Information about the original sender.
- **tags** (TEXT[]): Array of tags for categorizing and filtering packages.
- **receivedDate** (TIMESTAMPTZ): When package was received at warehouse.
- **processingDate** (TIMESTAMPTZ): When package was processed.
- **photos** (TEXT[]): Array of photo URLs.
- **notes** (TEXT): Internal notes about the package.
- **createdAt** (TIMESTAMPTZ): Record creation date.
- **updatedAt** (TIMESTAMPTZ): Last update timestamp.

#### pre_alerts
- **id** (UUID PK): Unique pre-alert identifier.
- **companyId** (UUID FK): References companies.id.
- **userId** (UUID FK): References users.id.
- **trackingNumber** (TEXT): Original shipper's tracking number.
- **courier** (TEXT): Shipping courier (USPS, FedEx, etc.).
- **description** (TEXT): Expected package contents.
- **estimatedWeight** (DECIMAL): Estimated weight in pounds.
- **estimatedArrival** (TIMESTAMPTZ): Expected arrival date.
- **packageId** (UUID FK): References packages.id, initially NULL until matched.
- **status** (ENUM): Status (pending, matched, cancelled).
- **createdAt** (TIMESTAMPTZ): When pre-alert was created.
- **updatedAt** (TIMESTAMPTZ): Last update timestamp.

#### invoices
- **id** (UUID PK): Unique invoice identifier.
- **companyId** (UUID FK): References companies.id.
- **userId** (UUID FK): References users.id, customer being billed.
- **invoiceNumber** (TEXT): Human-readable invoice number.
- **status** (ENUM): Status (draft, issued, paid, cancelled, overdue).
- **issueDate** (TIMESTAMPTZ): When invoice was issued.
- **dueDate** (TIMESTAMPTZ): Payment due date.
- **subtotal** (DECIMAL): Sum of line items before taxes.
- **taxAmount** (DECIMAL): Applied taxes.
- **totalAmount** (DECIMAL): Final invoice amount.
- **notes** (TEXT): Additional invoice notes.
- **createdAt** (TIMESTAMPTZ): Record creation date.
- **updatedAt** (TIMESTAMPTZ): Last update timestamp.

#### invoice_items
- **id** (UUID PK): Unique line item identifier.
- **companyId** (UUID FK): References companies.id.
- **invoiceId** (UUID FK): References invoices.id.
- **packageId** (UUID FK): References packages.id, can be NULL.
- **description** (TEXT): Service description.
- **quantity** (INTEGER): Number of units.
- **unitPrice** (DECIMAL): Price per unit.
- **lineTotal** (DECIMAL): Line item total (quantity * unit_price).
- **type** (ENUM): Item type (shipping, handling, customs, tax, other).
- **createdAt** (TIMESTAMPTZ): Record creation date.
- **updatedAt** (TIMESTAMPTZ): Last update timestamp.

#### payments
- **id** (UUID PK): Unique payment identifier.
- **companyId** (UUID FK): References companies.id.
- **invoiceId** (UUID FK): References invoices.id.
- **userId** (UUID FK): References users.id, payer.
- **amount** (DECIMAL): Payment amount.
- **paymentMethod** (ENUM): Method (credit_card, bank_transfer, cash, check).
- **status** (ENUM): Status (pending, completed, failed, refunded).
- **transactionId** (TEXT): External payment processor reference.
- **paymentDate** (TIMESTAMPTZ): When payment was processed.
- **notes** (TEXT): Payment notes.
- **createdAt** (TIMESTAMPTZ): Record creation date.
- **updatedAt** (TIMESTAMPTZ): Last update timestamp.

#### company_settings
- **id** (UUID PK): Unique settings identifier.
- **companyId** (UUID FK): References companies.id (unique).
- **shippingRates** (JSONB): Structure defining shipping rate calculation.
- **handlingFees** (JSONB): Structure defining handling fee calculation.
- **customsFees** (JSONB): Structure defining customs fee calculation.
- **taxRates** (JSONB): Applied tax rates.
- **notificationSettings** (JSONB): Email/SMS notification preferences.
- **themeSettings** (JSONB): UI theme configuration.
- **createdAt** (TIMESTAMPTZ): Record creation date.
- **updatedAt** (TIMESTAMPTZ): Last update timestamp.

#### fees
- **id** (UUID PK): Unique fee identifier.
- **companyId** (UUID FK): References companies.id.
- **name** (VARCHAR): Fee name.
- **code** (VARCHAR): Unique fee code.
- **feeType** (ENUM): Type (tax, service, shipping, handling, customs, other).
- **calculationMethod** (ENUM): Method of calculation.
- **amount** (DECIMAL): Base amount or rate.
- **currency** (VARCHAR): Currency code (default: USD).
- **appliesTo** (JSONB): Conditions for fee application.
- **metadata** (JSONB): Additional fee configuration.
- **description** (TEXT): Fee description.
- **isActive** (BOOLEAN): Fee status.
- **createdAt** (TIMESTAMPTZ): Record creation date.
- **updatedAt** (TIMESTAMPTZ): Last update timestamp.

#### company_assets
- **id** (UUID PK): Unique asset identifier.
- **companyId** (UUID FK): References companies.id.
- **type** (ENUM): Asset type (logo, banner, favicon, small_logo).
- **url** (TEXT): Public URL of the stored asset.
- **createdAt** (TIMESTAMPTZ): When the asset was uploaded.

#### audit_logs
- **id** (UUID PK): Unique log identifier.
- **userId** (UUID FK): References users.id.
- **companyId** (UUID FK): References companies.id.
- **action** (TEXT): Action performed.
- **entityType** (TEXT): Type of entity affected.
- **entityId** (UUID): ID of affected entity.
- **details** (JSONB): Additional action details.
- **ipAddress** (TEXT): IP address of the user.
- **userAgent** (TEXT): User's browser/client information.
- **createdAt** (TIMESTAMPTZ): When the action was performed.

#### company_invitations
- **id** (SERIAL PK): Unique invitation identifier.
- **status** (ENUM): Status (pending, accepted, expired, cancelled).
- **createdAt** (TIMESTAMPTZ): When the invitation was created.

### Database Migrations
The system uses Drizzle ORM for database migrations. Migrations are stored in the `src/db/migrations` directory and are automatically applied during deployment. The migration process ensures:

1. Schema versioning and tracking
2. Safe schema updates
3. Data integrity during migrations
4. Rollback capabilities

### Database Connection
The system uses a connection pool for database access with the following configuration:
- Maximum pool size: 20 connections
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- SSL support for secure connections

### Data Isolation
Multi-tenant data isolation is enforced through:
1. Company ID foreign keys on all tables
2. Middleware that filters queries by company ID
3. Row-level security policies
4. Cascading deletes for company removal

## 5. API Endpoints

### Authentication
- **POST   /api/auth/login** — Login and get JWT
- **POST   /api/auth/signup** — Register new user (if enabled)
- **POST   /api/auth/refresh** — Refresh JWT
- **GET    /api/auth/me** — Get current user profile
- **PUT    /api/auth/profile** — Update current user profile
- **PUT    /api/auth/change-password** — Change password
- **POST   /api/auth/reset-password** — Reset password with token
- **PUT    /api/auth/me/notifications** — Update notification preferences

### Companies
- **GET    /api/companies** — List all companies (Superadmin only)
- **POST   /api/companies** — Create new company (Superadmin only)
- **GET    /api/companies/:id** — Get company details (Superadmin only)
- **PUT    /api/companies/:id** — Update company (Superadmin only)
- **DELETE /api/companies/:id** — Delete/deactivate company (Superadmin only)
- **GET    /api/companies/:id/statistics** — Company statistics (Superadmin only)

### Users
- **GET    /api/users** — List all users across companies (Superadmin only)
- **POST   /api/users** — Create admin user for any company (Superadmin only)
- **GET    /api/users/:id/activity** — Get user activity logs (Superadmin only)
- **GET    /api/companies/:companyId/users** — List company users
- **POST   /api/companies/:companyId/users** — Create user
- **GET    /api/companies/:companyId/users/:id** — Get user details
- **PUT    /api/companies/:companyId/users/:id** — Update user
- **DELETE /api/companies/:companyId/users/:id** — Deactivate user

### Packages
- **GET    /api/companies/:companyId/packages** — List packages
- **GET    /api/companies/:companyId/packages/search** — Search/filter packages
- **POST   /api/companies/:companyId/packages** — Register new package
- **GET    /api/companies/:companyId/packages/:id** — Get package details
- **PUT    /api/companies/:companyId/packages/:id** — Update package
- **DELETE /api/companies/:companyId/packages/:id** — Mark package as deleted

### Pre-alerts
- **GET    /api/companies/:companyId/prealerts** — List pre-alerts
- **POST   /api/companies/:companyId/prealerts** — Create pre-alert
- **GET    /api/companies/:companyId/prealerts/:id** — Get pre-alert details
- **PUT    /api/companies/:companyId/prealerts/:id** — Update pre-alert
- **DELETE /api/companies/:companyId/prealerts/:id** — Cancel pre-alert

### Invoices
- **GET    /api/companies/:companyId/invoices** — List invoices
- **POST   /api/companies/:companyId/invoices** — Create invoice
- **GET    /api/companies/:companyId/invoices/:id** — Get invoice details
- **PUT    /api/companies/:companyId/invoices/:id** — Update invoice
- **POST   /api/companies/:companyId/invoices/:id/finalize** — Finalize invoice
- **POST   /api/companies/:companyId/invoices/:id/cancel** — Cancel invoice

### Payments
- **GET    /api/companies/:companyId/payments** — List payments
- **POST   /api/companies/:companyId/payments** — Record payment
- **GET    /api/companies/:companyId/payments/:id** — Get payment details
- **POST   /api/companies/:companyId/payments/:id/refund** — Process refund

### Company Settings
- **GET    /api/companies/:companyId/settings** — Get settings
- **PUT    /api/companies/:companyId/settings** — Update settings
- **PUT    /api/companies/:companyId/settings/shipping-rates** — Update shipping rates
- **PUT    /api/companies/:companyId/settings/handling-fees** — Update handling fees
- **PUT    /api/companies/:companyId/settings/customs-fees** — Update customs fees
- **PUT    /api/companies/:companyId/settings/tax-rates** — Update tax rates

### Fees
- **GET    /api/companies/:companyId/fees** — List all fees
- **GET    /api/companies/:companyId/fees/active** — List active fees
- **GET    /api/companies/:companyId/fees/:id** — Get fee details
- **POST   /api/companies/:companyId/fees** — Create fee
- **PUT    /api/companies/:companyId/fees/:id** — Update fee
- **DELETE /api/companies/:companyId/fees/:id** — Delete fee

### Billing
- **GET    /api/companies/:companyId/billing/packages/:packageId/fees** — Calculate package fees
- **POST   /api/companies/:companyId/billing/invoices/preview** — Preview invoice calculation
- **POST   /api/companies/:companyId/billing/invoices/generate** — Generate invoice for packages
- **POST   /api/companies/:companyId/billing/users/:userId/generate-invoice** — Generate invoice for all unbilled packages of a user

### Statistics
- **GET    /api/statistics/customer** — Customer dashboard stats
- **GET    /api/statistics/admin** — Admin dashboard stats
- **GET    /api/statistics/superadmin** — System-wide statistics including:
  - Total companies, users, and packages
  - Platform-wide revenue metrics
  - Company performance analytics
  - User distribution and activity
  - Revenue trends and growth metrics

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
- **Superadmin Portal**:
  - System Dashboard
  - Company Management
  - Cross-tenant User Management
  - System-wide Statistics
  - Audit Logs
  - Security Settings

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
- **Authentication**: JWT verification on all protected routes
- **Authorization**: Role-based access control on both frontend and backend
- **Data Isolation**: 
  - Tenant filtering on all database queries
  - Superadmin bypass for system-wide access
  - Audit logging of all cross-tenant operations
- **Input Validation**: Zod schema validation on all API endpoints
- **CSRF Protection**: Token-based protection for state-changing operations
- **Rate Limiting**: API rate limiting to prevent abuse
- **Content Security Policy**: Restricted resource loading policies
- **Database Security**:
  - Parameterized queries to prevent SQL injection
  - Encryption of sensitive fields
  - Row-level security policies
- **Audit Logging**: 
  - Comprehensive logging of security-relevant events
  - Cross-tenant operation tracking
  - System-wide activity monitoring
- **Regular Security Audits**: Scheduled security reviews and penetration testing

## 10. External Integrations
- **Shipping Carriers**:
  - Magaya Integration

## 11. Deployment Infrastructure
- **Development Environment**:
  - Local Docker setup
  - Development database
  - Auth0 tenant for development(deprecated)
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
  - Admin l1 and l2 portal
  - Company onboarding
  - Employee Onboarding (Admin L1)
  - Package, User(Customer, Admins) Management
  - Magaya Integration.
  - Fee Management
  - Company Branding(logo, banner, etc)
- **Phase 2**:
  - Advanced reporting
  - Integration with more shipping carriers (Optional)
  - Payment Gateway Integrations (WiPay, Stripe)
  - Live Package updates (Possibly with mobile phone scanning for employees)
  - Notifications.
  - Reporting.

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