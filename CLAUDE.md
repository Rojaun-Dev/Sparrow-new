# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Setup
```bash
# Start development (both client and backend)
npm run dev

# Build for production
npm run build

# Run linting on both packages
npm run lint

# Format backend code
npm run format

# Run tests
npm run test
```

### Database Operations
```bash
# Generate migrations from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio for database inspection
npm run db:studio

# Seed database with sample data
npm run db:seed

# Complete database setup (migrate + seed)
npm run db:setup
```

### Individual Package Commands
```bash
# Client-specific commands
cd client && npm run dev
cd client && npm run build
cd client && npm run lint

# Backend-specific commands
cd backend && npm run dev
cd backend && npm run build
cd backend && npm run lint
cd backend && npm run format
cd backend && npm run test
```

## Architecture Overview

### Multi-Tenant SaaS Platform
SparrowX is a multi-tenant SaaS solution for Jamaican package-forwarding companies with strict data isolation between tenants.

### Tech Stack
- **Frontend**: Next.js 15 with React 19, TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript, Controllers-Services-Repositories pattern
- **Database**: PostgreSQL with Drizzle ORM, UUID primary keys
- **Authentication**: JWT-based auth with role-based access control (Customer, Admin L1, Admin L2)
- **State Management**: React Query for server state, React Context for UI state

### Project Structure
```
sparrow-new/
├── client/           # Next.js frontend application
├── backend/          # Express.js API server  
├── docs/            # Technical documentation
├── scripts/         # Utility scripts
└── shared-env.js    # Shared environment configuration
```

### Key Architectural Patterns

#### Multi-Tenant Data Isolation
- Every database table includes `company_id` as foreign key
- All database queries MUST filter by `company_id`
- JWT tokens contain `company_id` for tenant context
- Middleware validates tenant access on every request

#### Authentication Flow
- JWT authentication with `checkJwt` middleware
- Role-based authorization with `checkRole(role)` middleware
- Token contains: `user_id`, `company_id`, `role`, `email`
- Routes protected based on user roles

#### API Structure
- RESTful endpoints following `/api/v1/...` pattern
- Controllers handle HTTP requests/responses
- Services contain business logic
- Repositories handle database operations
- Consistent error handling and response formats

#### Frontend Architecture
- App Router with nested layouts for different user roles
- Custom hooks for all API interactions using React Query
- Multi-tenant theming with dynamic company branding
- Form validation using Zod schemas with react-hook-form

### Environment Configuration
Environment files are loaded from the project root for both client and backend:
- Backend: `backend/src/config/index.ts` loads from `../../.env*`
- Client: `next.config.mjs` loads from root directory
- Variables prefixed with `NEXT_PUBLIC_` are exposed to browser

### Database Schema
- Uses Drizzle ORM with TypeScript schema definitions
- All tables have UUID primary keys and `company_id` foreign keys
- Timestamps (`created_at`, `updated_at`) on all tables
- Proper indexing on `company_id` and frequently queried fields

### Security Considerations
- All API routes require JWT authentication
- Multi-tenant isolation enforced at database query level
- Role-based access control for different user types
- Input validation using Zod schemas
- CORS and rate limiting configured

### Integration Points
- Magaya shipping system integration for package data
- Email service for notifications (Nodemailer)
- File upload handling for documents
- CSV import/export functionality

### Development Guidelines
- Follow the SparrowX Development Rules in `docs/SparrowX-Development-Rules.md`
- Use TypeScript with strict type checking
- Implement proper error handling and logging
- Write tests for all new functionality
- Maintain multi-tenant data isolation
- Follow the established Controllers-Services-Repositories pattern