# SparrowX Project

## Project Overview

SparrowX is a multi-tenant SaaS platform designed for Jamaican package-forwarding companies. It provides an API-driven backend and a Next.js-based frontend portal for both customers and employees, with data isolation, role-based access control, and dynamic company branding.

### Repository Structure

The project is organized into the following main directories:
- `client/`: Next.js application with components, routes, and UI elements
- `backend/`: Express.js API with controllers, services, and repositories
- `db/`: Database schemas and migrations using Drizzle ORM
- `shared/`: Code shared between frontend and backend (validation schemas, types, utilities)

### Tech Stack

- **Frontend**: 
  - Next.js with React and TypeScript
  - TailwindCSS with shadcn/ui components
  - React Context for state management
  - React Query for data fetching and caching
  - Zod for validation

- **Backend**: 
  - Express.js with TypeScript
  - Controllers-Services-Repositories pattern
  - JWT middleware for authentication
  - Role-based access control

- **Database**: 
  - PostgreSQL with Drizzle ORM
  - Multi-tenant schema with tenant isolation
  - UUID primary keys

- **Authentication**: 
  - Auth0 with Organizations for multi-tenancy
  - RBAC with Customer, Admin L1, and Admin L2 roles
  - JWT token verification

- **Deployment**: 
  - AWS EC2 for backend services
  - Vercel for frontend hosting
  - Redis for caching
  - CloudFront CDN for static assets

- **External Integrations**:
  - Magaya shipping system integration

### Key Features

- **Multi-Tenant Architecture**: Complete data isolation between tenants
- **Dynamic Company Branding**: Customizable UI themes per company
- **Package Management**: Tracking, pre-alerts, and processing
- **Invoice and Payment System**: Billing and payment processing
- **Role-Based Access Control**: Tiered admin permissions
- **Comprehensive API**: RESTful endpoints for all functionality

### Development Workflow

We follow a structured branch strategy:
- `main`: Production-ready code
- `develop`: Integration branch
- Feature branches: `feature/feature-name`
- Bug fix branches: `bugfix/bug-name`

For detailed development rules and guidelines, see [SparrowX Development Rules](./SparrowX-Development-Rules.md).

## Documentation

- [Technical Specifications](./Technical-Specification.md): Detailed system architecture, data models, and implementation details
- [API Documentation](./api-docs/): REST API reference and usage examples
- [Development Setup](./docs/development-setup.md): Instructions for setting up the development environment

## Project Roadmap

### Phase 1 (MVP)
- Basic package tracking
- Simple invoicing
- Customer portal

### Phase 2
- Advanced reporting
- Integration with major shipping carriers
- Mobile application

### Phase 3
- Machine learning for package processing
- Predictive analytics
- International expansion

## Cursor Rules

This project uses Cursor IDE configuration rules to maintain consistent code formatting and editing behavior across the development team. The rules are stored in `.qodo/cursor-rules.json`.

### Rule Overview

The cursor rules define the following settings for various file types:

- **JavaScript/TypeScript/React**: 2-space indentation, format on save and type, trim trailing whitespace
- **CSS/SCSS**: 2-space indentation, format on save, trim trailing whitespace
- **HTML**: 2-space indentation, format on save, trim trailing whitespace
- **JSON**: 2-space indentation, format on save
- **Markdown**: 2-space indentation, preserve trailing whitespace, insert final newline
- **Configuration Files**: 2-space indentation, format on save, trim trailing whitespace
- **Python**: 4-space indentation, format on save, trim trailing whitespace

### Default Settings

The default settings for all files not matching specific patterns are:
- Tab size: 2 spaces
- Insert spaces (not tabs)
- Format on save
- Trim trailing whitespace
- Insert final newline

### Excluded Folders

The following folders are excluded from formatting:
- node_modules
- dist
- build
- .git
- coverage

## Development Guidelines

When working on the SparrowX project, ensure your editor is configured to respect these formatting rules. If you're using Cursor IDE, these settings will be automatically applied.

For other editors, please configure them to match these standards as closely as possible. 