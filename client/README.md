# SparrowX Client Application

## Overview

The SparrowX client application is a Next.js-based frontend that provides a modern, responsive interface for the SparrowX shipping platform. It supports multi-tenant functionality with company-specific branding and features.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Authentication](#authentication)
- [Multi-tenant Support](#multi-tenant-support)
- [Component Library](#component-library)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/sparrowx.git
cd sparrowx/client
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration values.

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
client/
├── app/                    # Next.js 13+ app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── (public)/          # Public routes
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── common/           # Shared components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── providers/            # Context providers
├── public/              # Static assets
├── styles/              # Global styles
└── types/               # TypeScript types
```

## Key Features

### Multi-tenant Dashboard
- Company-specific branding
- Role-based access control
- Customizable themes
- Real-time notifications

### Package Management
- Package tracking
- Pre-alert creation
- Document upload
- Status updates

### Customer Portal
- User registration
- Profile management
- Package history
- Payment processing

### Admin Portal
- User management
- Company settings
- Fee configuration
- Analytics dashboard

## Authentication

The application uses JWT-based authentication with the following features:

- Secure login/logout
- Password reset
- Email verification
- Session management
- Role-based access control

### Authentication Flow

1. User submits credentials
2. Server validates and returns JWT
3. Token stored in secure HTTP-only cookie
4. Protected routes check token validity
5. Automatic token refresh

## Multi-tenant Support

### Company Branding
- Dynamic theme loading
- Custom logos and colors
- Company-specific assets
- Subdomain-based routing

### Data Isolation
- Company-specific data fetching
- Tenant-aware API calls
- Secure data boundaries
- Cross-tenant protection

## Component Library

### Core Components
- Button
- Input
- Select
- Modal
- Table
- Form
- Card
- Alert

### Layout Components
- Header
- Sidebar
- Footer
- Container
- Grid
- Navigation

### Form Components
- TextInput
- SelectInput
- Checkbox
- Radio
- DatePicker
- FileUpload

## State Management

### Context Providers
- AuthContext
- ThemeContext
- NotificationContext
- CompanyContext

### Data Fetching
- React Query for server state
- SWR for real-time updates
- Optimistic updates
- Error handling

## API Integration

### API Client
- Axios instance
- Request interceptors
- Response handling
- Error management

### Endpoints
- Authentication
- User management
- Package operations
- Company settings
- Analytics

## Development Guidelines

### Code Style
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Component documentation

### Best Practices
- Component composition
- Custom hooks
- Error boundaries
- Performance optimization
- Accessibility

### Git Workflow
- Feature branches
- Pull requests
- Code review
- Semantic versioning

## Testing

### Test Types
- Unit tests
- Integration tests
- E2E tests
- Component tests

### Testing Tools
- Jest
- React Testing Library
- Cypress
- MSW for API mocking

### Test Coverage
- Component coverage
- Hook coverage
- Utility coverage
- API integration coverage

## Deployment

### Build Process
```bash
npm run build
```

### Environment Configuration
- Production variables
- API endpoints
- Feature flags
- Analytics

### Deployment Steps
1. Build application
2. Run tests
3. Generate static files
4. Deploy to hosting platform

### CI/CD Pipeline
- Automated testing
- Build verification
- Deployment automation
- Environment promotion

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 