# SparrowX Documentation Hub

This directory contains all documentation for the SparrowX project.

## Documentation Index

### System Overview
- [Technical Specifications](./Technical-Specification.md): Detailed system architecture, data models, advanced fee management system, and implementation details
- [Development Rules](./SparrowX-Development-Rules.md): Guidelines and standards for development
- [Environment Setup Guide](./ENVIRONMENT-SETUP.md): Comprehensive guide to environment variables and configuration

### Database
- [Database Management Guide](./DATABASE.md): Complete guide to database migrations, seeding, and best practices
- [Database Schema Documentation](../backend/SCHEMA_DOCUMENTATION.md): Comprehensive database schema reference with table structures and relationships

### Authentication & Security
- [JWT Authentication Guide](./JWT-AUTHENTICATION.md): Implementation details for JWT-based authentication
- [Security Best Practices](./SECURITY-BEST-PRACTICES.md): Security guidelines and implementation details

### Integration & Features
- [Customer Portal Integration](./CUSTOMER-PORTAL-INTEGRATION.md): Guide for integrating with the customer portal
- [Billing System Documentation](../backend/src/services/BILLING.md): Detailed documentation of the billing system
- [Fee Management System](./FEE-MANAGEMENT.md): Comprehensive guide to the fee management system

### Development
- [Development Setup](./development-setup.md): Instructions for setting up the development environment
- [API Documentation](./API.md): REST API reference and usage examples
- [Build Error Fixes](./BUILD-ERROR-FIXES.md): Solutions for common build issues

### Component Repositories
- [Backend](../backend/README.md): Express.js API documentation
- [Client](../client/README.md): Next.js frontend documentation

### Technical Documents
- [SparrowX Technical Specifications (PDF)](./SparrowX%20Technical%20Specifications.pdf)
- [SparrowX Technical Specifications (DOCX)](./SparrowX%20Technical%20Specifications.docx)

## Documentation Structure

```
docs/
├── README.md                    # This documentation hub
├── Technical-Specification.md   # System architecture and implementation details
├── SparrowX-Development-Rules.md # Development guidelines
├── ENVIRONMENT-SETUP.md         # Environment configuration guide
├── DATABASE.md                  # Database management guide
├── JWT-AUTHENTICATION.md        # JWT authentication implementation
├── SECURITY-BEST-PRACTICES.md   # Security guidelines
├── CUSTOMER-PORTAL-INTEGRATION.md # Customer portal integration guide
├── FEE-MANAGEMENT.md           # Fee management system documentation
├── development-setup.md        # Development environment setup
└── BUILD-ERROR-FIXES.md        # Common build issues and solutions
```

## Contributing to Documentation

When adding new documentation:

1. Create a markdown file with clear, descriptive filename
2. Add a link to the new document in this index
3. Include navigation links at the top of the new document to allow easy navigation back to this hub
4. Follow the established documentation style and format
5. Update the documentation structure section if adding new categories

### Documentation Style Guide

1. **File Naming**:
   - Use UPPERCASE for main documentation files
   - Use lowercase for supplementary documentation
   - Use hyphens to separate words
   - Include .md extension

2. **Content Structure**:
   - Start with a clear title (H1)
   - Include a brief description
   - Use consistent heading levels
   - Include a table of contents for longer documents
   - Add navigation links at the top

3. **Formatting**:
   - Use markdown syntax consistently
   - Include code blocks with language specification
   - Use tables for structured data
   - Include links to related documentation

4. **Maintenance**:
   - Keep documentation up to date with code changes
   - Review and update regularly
   - Remove deprecated information
   - Add new features and changes promptly 