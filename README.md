# SparrowX Project

This is a multi-tenant SaaS solution for Jamaican package-forwarding companies.

## Environment Configuration

This project uses shared environment variables for both the client and backend. 
The environment files are loaded from the root of the project for both applications.

### Setting Up Environment Files

1. Create a `.env` or `.env.local` file in the root directory of the project.
2. Use the following template for your environment variables:

```
# JWT configuration (DEPRECATED AUTH0 configuration has been removed)
JWT_SECRET=your-generated-secret
APP_BASE_URL=http://localhost:3000

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sparrowx
DB_USER=postgres
DB_PASSWORD=postgres

# Server configuration
PORT=4000
NODE_ENV=development

# Client configuration - prefix with NEXT_PUBLIC_ to expose to browser
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

3. Generate a secure JWT_SECRET using:
```
openssl rand -hex 32
```

### Environment Variable Loading

- **Root Location**: All environment files (`.env`, `.env.local`, `.env.development`, etc.) should be placed in the root directory of the project.
- **Next.js Client**: Environment variables are loaded in the following order:
  1. The `next.config.mjs` loads variables from the root's `.env*` files at build time
  2. Variables prefixed with `NEXT_PUBLIC_` are automatically exposed to browser code
  3. Selected JWT variables are explicitly shared with the client via the `env` property in `next.config.mjs`
  4. A safe environment access utility (`client/lib/env.js`) is provided to safely access variables in different contexts

- **JWT Authentication**: JWT authentication is used for secure API access (DEPRECATED: AUTH0 has been removed in favor of JWT authentication).

- **Static vs Dynamic Rendering**: For authentication-protected pages, static optimization is disabled using the `dynamic = 'force-dynamic'` directive to prevent build-time errors related to missing environment variables.

### Environment-Specific Files

The system will load environment files in the following order, with later files taking precedence:

1. `.env` (base defaults)
2. `.env.environment` (e.g., `.env.development`, `.env.production`)
3. `.env.local` (local overrides, not committed to git)
4. `.env.environment.local` (e.g., `.env.development.local`)

## Project Structure

- `client/` - Next.js front-end application
- `backend/` - Express.js API server

## Development

You can run all scripts from the project root directory.

To run the project in development mode:

```bash
# Start both client and backend simultaneously
npm run dev

# Or start them individually
npm run dev:client
npm run dev:backend
```

Other available commands:

```bash
# Build both packages
npm run build

# Start the production builds
npm run start

# Run linting
npm run lint

# Run tests
npm run test

# Database operations
npm run db:migrate
npm run db:seed
npm run db:setup
npm run db:studio
```

Alternatively, you can still run commands from individual packages:

1. Start the backend:
```
cd backend
npm run dev
```

2. Start the client:
```
cd client
npm run dev
```

## Configuration Details

Both the client and backend have been configured to look for .env files in the parent directory:

- The backend's configuration is in `backend/src/config/index.ts`
- The client's configuration is in `client/next.config.mjs` and `client/lib/env.js`

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
  - JWT authentication with role-based access control
  - RBAC with Customer, Admin L1, and Admin L2 roles
  - JWT token verification

- **Development Deployment**: 
  - Render for api/backend hosting (FREE =D shitty cold start handling though)
  - Render with postgresdb for db hosting
  - Vercel for frontend hosting

- **Production Deployment**: 
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

For detailed development rules and guidelines, see [SparrowX Development Rules](./docs/SparrowX-Development-Rules.md).

## Documentation

- [Technical Specifications](./docs/Technical-Specification.md): Detailed system architecture, data models, and implementation details
- [Environment Setup Guide](./docs/ENVIRONMENT-SETUP.md): Comprehensive guide to environment variables and configuration
- [Build Error Fixes](./docs/BUILD-ERROR-FIXES.md): Explanation of recent environment variable and build error fixes
- [Customer Portal Integration](./docs/CUSTOMER-PORTAL-INTEGRATION.md): Guide for backend and customer portal integration
- [API Documentation](./api-docs/): REST API reference and usage examples
- [Database Schema Documentation](./docs/SCHEMA_DOCUMENTATION.md): Comprehensive database schema reference with table structures and relationships
- [Database Management Guide](./docs/DATABASE.md): Complete guide to database migrations, seeding, and best practices

## Project Roadmap

### Phase 1 (MVP)
- Basic package tracking
- Simple invoicing
- Customer portal
- Integration with Magaya

### Phase 2
- Advanced reporting
- Mobile application

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