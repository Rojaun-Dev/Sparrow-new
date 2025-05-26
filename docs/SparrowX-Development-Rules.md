# SparrowX Development Rules

## Overview

This document outlines the development rules and guidelines for the SparrowX multi-tenant SaaS platform. All team members must adhere to these standards to ensure a consistent, maintainable, and secure codebase.

## Project Structure

### Repository Organization

```
sparrowx/
├── frontend/                # Next.js application
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base components (shadcn/ui)
│   │   ├── forms/           # Form components
│   │   ├── tables/          # Table components
│   │   └── layout/          # Layout components
│   ├── app/                 # Next.js app directory
│   │   ├── auth/            # JWT authentication routes
│   │   ├── dashboard/       # Dashboard routes
│   │   ├── customers/       # Customer management routes
│   │   ├── admin/          # Admin portal routes
│   │   │   ├── l1/         # Admin L1 routes
│   │   │   └── l2/         # Admin L2 routes
│   │   └── ...              # Other feature routes
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── providers/           # Context providers
│   └── types/               # TypeScript type definitions
│
├── backend/                 # Express.js API
│   ├── controllers/         # Route handlers
│   ├── services/            # Business logic
│   ├── repositories/        # Database access
│   ├── middleware/          # Express middleware
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript type definitions
│   └── routes/              # API route definitions
│
├── db/                      # Database related files
│   ├── schema/              # Drizzle schema definitions
│   └── migrations/          # Drizzle migrations
│
└── shared/                  # Shared code between frontend/backend
    ├── types/               # Shared TypeScript types
    └── validation/          # Zod validation schemas
```

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for feature work
- `feature/feature-name`: Feature branches
- `bugfix/bug-name`: Bug fix branches

## Coding Standards

### General Guidelines

1. Use TypeScript for all code files with strict type checking
2. Use ESLint and Prettier for code formatting
3. Follow naming conventions:
   - camelCase for variables, functions, methods
   - PascalCase for classes, interfaces, types, components
   - snake_case for database fields
   - UPPER_SNAKE_CASE for constants
4. Maximum line length of 100 characters
5. Use meaningful, descriptive names for all variables, functions, and files
6. Use JSDoc comments for all functions and complex types
7. Use absolute imports with path aliases

### Frontend (Next.js) Rules

1. **Component Structure**
   - Create atomic, reusable components
   - Use functional components with hooks
   - Follow the UI design from section 11 of the specification
   - Use ShadCN components with consistent spacing (p-4, m-4)
   - Apply typography rules (text-lg for headings, text-base for body)
   - Implement rounded-lg for component corners

2. **State Management**
   - Use React Query for server state management
   - Use React Context for global UI state
   - Use local state for component-specific state

3. **Data Fetching**
   - Implement custom hooks for all API calls
   - Handle loading and error states explicitly
   - Use React Query's caching capabilities
   - Implement Skeleton/Spinner components for loading states

4. **Authentication**
   - Use JWT for authentication flows
   - Extract company_id and roles from JWT tokens
   - Create protected route wrappers based on user roles
   - Implement role-based access control for all routes

5. **Multi-Tenant UI**
   - Use React Context for dynamic company theming
   - Implement a ThemeProvider that loads tenant-specific styles
   - Load company assets (logo, banner) based on current tenant
   - Apply tenant-specific primary/accent colors to components
   - Support custom branding for each company

6. **Forms**
   - Use Zod schemas for form validation
   - Implement standardized error handling
   - Use react-hook-form for form state management
   - Disable submit buttons until forms are valid
   - Implement proper form feedback for all user actions

7. **Accessibility**
   - Use semantic HTML elements
   - Include ARIA attributes where appropriate
   - Ensure keyboard navigation works for all interactive elements
   - Maintain WCAG AA compliance for color contrast
   - Support screen readers and assistive technologies

### Backend (Express.js) Rules

1. **API Structure**
   - Organize code into controllers, services, and repositories
   - Follow RESTful naming conventions for endpoints
   - Version all API routes (e.g., `/api/v1/...`)
   - Return consistent response formats
   - Implement proper error handling and status codes

2. **Multi-Tenant Security**
   - Implement tenant middleware to extract company_id from JWT
   - Add company_id filtering to all database queries
   - Validate tenant access in service methods
   - Implement proper role-based access control

3. **Validation**
   - Use Zod schemas for all request validation
   - Implement a validation middleware
   - Return standardized error responses for validation failures
   - Validate all input data before processing

4. **Authentication & Authorization**
   - Implement `checkJwt` middleware to verify JWT tokens
   - Create `checkRole(role)` middleware for authorization
   - Include proper error handling for expired/invalid tokens
   - Implement proper session management

5. **Error Handling**
   - Use custom error classes for different error types
   - Implement a global error handler middleware
   - Log all errors with appropriate context
   - Return user-friendly error messages
   - Include proper error tracking and monitoring

### Database Rules

1. **Schema Design**
   - Follow the schema definitions in section 4 exactly
   - Use UUIDs for all primary keys
   - Include company_id as foreign key in every table
   - Add created_at/updated_at timestamps to all tables
   - Implement proper indexing for performance

2. **Drizzle ORM Usage**
   - Define schemas in separate files
   - Use strongly typed schema definitions
   - Implement migrations for all schema changes
   - Use prepared statements for all database queries
   - Add company_id filter to all repository methods

3. **Indexing**
   - Index company_id columns for query performance
   - Add composite indexes for frequently filtered columns
   - Index foreign keys and frequently searched fields
   - Monitor and optimize query performance

4. **Migrations**
   - Use Drizzle's migration system
   - Test migrations thoroughly before deployment
   - Include both up and down migration scripts
   - Run migrations automatically during deployment
   - Maintain migration history

## Security Guidelines

1. **Authentication & Authorization**
   - Validate JWTs on every API request
   - Check role permissions before data access/modification
   - Never trust client-side authorization
   - Implement proper CORS configuration
   - Use secure session management

2. **Data Protection**
   - Never expose company_id in client-facing responses
   - Sanitize all user inputs
   - Use parameterized queries to prevent SQL injection
   - Implement rate limiting for authentication endpoints
   - Encrypt sensitive data at rest

3. **Multi-Tenant Isolation**
   - Always filter by company_id in database queries
   - Verify tenant access in all service methods
   - Log all cross-tenant access attempts
   - Implement tenant context validation middleware
   - Maintain strict data isolation between tenants

## Testing Requirements

1. **Frontend Testing**
   - Write unit tests for all components and hooks
   - Use React Testing Library and Jest
   - Test all user interactions and state changes
   - Implement Cypress for E2E testing of critical flows
   - Test multi-tenant functionality

2. **Backend Testing**
   - Write unit tests for all services and controllers
   - Test multi-tenant filters and access controls
   - Mock database and external service dependencies
   - Implement integration tests for API endpoints
   - Test authentication and authorization

3. **Database Testing**
   - Test migrations against a test database
   - Verify multi-tenant isolation in queries
   - Test performance of complex queries
   - Validate data integrity
   - Test backup and recovery procedures

## Magaya Integration

1. **Implementation Rules**
   - Create a dedicated service for Magaya API interaction
   - Implement data mapping from Magaya XML to SparrowX schema
   - Log all integration activities
   - Add retry logic for failed requests
   - Implement error handling for schema mismatches
   - Maintain data consistency between systems

2. **Synchronization**
   - Implement cron jobs for scheduled synchronization
   - Track data source (manual vs magaya) for all packages
   - Allow manual overrides for imported data
   - Validate data integrity before saving
   - Handle synchronization conflicts
   - Implement proper error recovery

## Deployment Guidelines

1. **Environment Configuration**
   - Use environment variables for configuration
   - Implement separate configurations for development, staging, and production
   - Never commit sensitive information to the repository
   - Use secure secret management

2. **CI/CD Pipeline**
   - Run linting and tests on each commit
   - Require code reviews for PRs to main branches
   - Automate deployments to staging and production
   - Include database migration steps in deployment process
   - Implement proper rollback procedures

3. **Monitoring**
   - Implement logging for all critical operations
   - Set up error tracking
   - Monitor API performance and database metrics
   - Create alerts for system issues
   - Track user activity and system usage

## Documentation Requirements

1. **Code Documentation**
   - Use JSDoc comments for all functions and types
   - Document complex business logic
   - Update documentation when code changes
   - Include examples for complex operations

2. **API Documentation**
   - Create and maintain OpenAPI specification
   - Document all endpoints, parameters, and responses
   - Include authentication requirements
   - Provide example requests and responses
   - Document rate limits and error codes

3. **User Documentation**
   - Create documentation for all user-facing features
   - Include screenshots and step-by-step instructions
   - Update documentation when features change
   - Provide troubleshooting guides
   - Include role-specific documentation 