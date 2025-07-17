# Production Database Seeding

This document outlines the database seeding strategy for different environments in the SparrowX application.

## Environment-Based Seeding

The seeding system automatically detects the environment and seeds data accordingly:

### Development Environment (`NODE_ENV=development`)
- **Full seeding**: All sample data including companies, users, packages, invoices, etc.
- **Purpose**: Provides comprehensive test data for development and testing
- **Data included**:
  - 4 sample companies (SparrowX, Package Express, ShipItFast, JamPack)
  - Multiple user accounts per company (admin, staff, customers)
  - Sample packages, pre-alerts, invoices, and payments
  - Company settings, fees, and configurations

### Production Environment (`NODE_ENV=production`)
- **Minimal seeding**: Only superadmin user creation
- **Purpose**: Ensures platform has initial superadmin access without test data
- **Data included**:
  - SparrowX company (if doesn't exist)
  - Single superadmin user account

## Production Environment Variables

For production deployment, set these environment variables to customize the superadmin account:

### Required Environment Variables

```env
# Database Environment
NODE_ENV=production

# Superadmin Configuration (Optional - will use defaults if not provided)
SUPER_ADMIN_EMAIL=admin@sparrowx.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
SUPER_ADMIN_AUTH_ID=auth0|super-admin-prod
SUPER_ADMIN_PHONE=+1-876-555-0000
```

### Default Values (if environment variables not set)

- **Email**: `admin@sparrowx.com`
- **Password**: `SuperAdmin123!`
- **Auth ID**: `auth0|super-admin-prod`
- **Phone**: `+1-876-555-0000`

## Security Considerations

### Production Superadmin Setup

1. **Custom Credentials**: Always set custom `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` environment variables
2. **Strong Password**: Use a strong, unique password for the superadmin account
3. **Secure Storage**: Store environment variables securely in your deployment platform
4. **Change After Setup**: Change the default password after first login
5. **Limited Access**: Only create this account when needed for initial platform setup

### Environment Variable Security

- Never commit production credentials to version control
- Use your deployment platform's secure environment variable storage
- Rotate credentials regularly
- Monitor superadmin account usage

## Seeding Commands

### Development
```bash
# Full development seeding
npm run db:seed

# Complete setup (migrate + seed)
npm run db:setup
```

### Production
```bash
# Set NODE_ENV=production first
export NODE_ENV=production

# Production seeding (superadmin only)
npm run db:seed

# Complete production setup
npm run db:setup
```

## Database Schema Requirements

The production seeding will automatically:

1. **Create SparrowX Company**: If no companies exist, creates the base SparrowX company
2. **Check for Existing Superadmin**: Skips creation if superadmin already exists
3. **Generate Unique IDs**: Creates proper internal and prefixed IDs for the superadmin
4. **Password Hashing**: Securely hashes the superadmin password using bcrypt

## Verification

After production seeding, verify the setup:

1. **Check Database**: Confirm superadmin user exists with role `super_admin`
2. **Test Login**: Attempt login with superadmin credentials
3. **Platform Access**: Verify superadmin can access the platform management features
4. **Security Check**: Ensure no test/development data exists in production

## Troubleshooting

### Common Issues

1. **Environment Detection**: Ensure `NODE_ENV=production` is properly set
2. **Database Connection**: Verify database connection string and credentials
3. **Migration Status**: Run migrations before seeding (`npm run db:migrate`)
4. **Existing Data**: Check if superadmin already exists (seeding will skip if found)

### Logging

The seeding process provides detailed logging:
- Environment detection confirmation
- Seeding progress updates
- Success/failure notifications
- Security reminders

Check application logs for seeding status and any error messages.