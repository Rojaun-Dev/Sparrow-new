# Database Management Guide

## Navigation

- [Documentation Hub](./README.md)
- [Main Project README](../README.md)
- [Backend README](../backend/README.md)
- [Database Schema Documentation](../backend/SCHEMA_DOCUMENTATION.md)

## Table of Contents

- [Overview](#overview)
- [Database Architecture](#database-architecture)
- [Schema Management](#schema-management)
- [Migrations](#migrations)
  - [How Migrations Work](#how-migrations-work)
  - [Generating Migrations](#generating-migrations)
  - [Running Migrations](#running-migrations)
- [Seeding](#seeding)
  - [How Seeding Works](#how-seeding-works)
  - [Seed Structure](#seed-structure)
  - [Running Seeds](#running-seeds)
  - [Creating Custom Seeds](#creating-custom-seeds)
- [Environment Configuration](#environment-configuration)
- [Development Tools](#development-tools)
- [Best Practices](#best-practices)

## Overview

The SparrowX platform uses PostgreSQL with Drizzle ORM for database management. This guide covers how to work with the database schema, run migrations, and seed data for development and testing purposes. For detailed information about the database schema structure, tables and relationships, please refer to the [Database Schema Documentation](../backend/SCHEMA_DOCUMENTATION.md).

## Database Architecture

The database follows a multi-tenant architecture where:

- Each tenant (shipping company) has its own data isolated through foreign key relationships
- All tables include a `companyId` field to enforce data isolation
- UUID primary keys are used across all tables
- Timestamp fields track record creation and updates

For a detailed view of the database schema, tables, and relationships, see the [Database Schema Documentation](../backend/SCHEMA_DOCUMENTATION.md).

## Schema Management

Drizzle ORM is used for schema definition and management. Schema files are located in:

```
backend/src/db/schema/
```

Each table has its own schema file (e.g., `users.ts`, `companies.ts`) with TypeScript definitions that:

1. Define table structure
2. Establish relationships
3. Set default values
4. Configure constraints

Example schema file structure:

```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const tableName = pgTable('table_name', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Important Schema Notes

1. **Internal Tracking IDs**: For packages, an `internalTrackingId` field is required and must be unique. This is used for internal reference and should be generated using a consistent pattern (e.g., company prefix + sequential number).

2. **Enum Types**: Several tables use PostgreSQL enum types to restrict field values (e.g., package status, payment methods). When adding new values to these enums, a migration must be generated.

3. **JSONB Fields**: The database makes extensive use of JSONB fields for flexible data storage (e.g., package dimensions, sender information). These fields can store complex nested data structures.

## Migrations

Migrations allow you to evolve your database schema over time, tracking changes in version control and applying them in a consistent way across all environments.

### How Migrations Work

The project uses Drizzle Kit to handle database migrations:

1. Schema changes are made in TypeScript files (e.g., adding a column)
2. Migrations are generated comparing schema changes to the current state
3. Migrations are stored as SQL files in `backend/src/db/migrations/`
4. Migrations are applied sequentially to update the database

### Generating Migrations

When you make changes to schema files, you need to generate migration files:

```bash
# From project root
npm run db:generate

# From backend directory
npm run db:generate
```

This command:
1. Analyzes your schema definition files in `src/db/schema/`
2. Compares them with the current database schema
3. Generates SQL migration files in `src/db/migrations/`

The migration files follow a naming pattern like `0001_initial.sql` and contain the SQL needed to apply and revert your schema changes.

### Running Migrations

To apply migrations to your database:

```bash
# From project root
npm run db:migrate

# From backend directory
npm run db:migrate
```

This command:
1. Connects to your database using the credentials in your environment
2. Checks which migrations have already been applied
3. Runs any pending migrations in the correct order
4. Updates a `drizzle_migrations` table to track applied migrations

Migration code is located in `backend/src/db/migrate.ts` and uses the Drizzle ORM migration API.

## Seeding

Seeding is the process of populating your database with initial or test data. This is useful for:

- Development environments
- Testing
- Demo instances
- Providing default settings and configurations

### How Seeding Works

The SparrowX platform includes a comprehensive seeding system that:

1. Creates demo companies
2. Adds users with different roles
3. Sets up company settings
4. Creates sample packages, pre-alerts, invoices, and payments

### Seed Structure

Seed files are located in:

```
backend/src/db/seeds/
```

Each entity has its own seed file:
- `companies.ts`
- `users.ts`
- `company-settings.ts`
- `packages.ts`
- `pre-alerts.ts`
- `invoices.ts`
- `payments.ts`
- `fees.ts` (for configuring fee types and calculation methods)

All seed functions follow the same pattern:

```typescript
export async function seedEntityName(db: NodePgDatabase<any>) {
  // Check if entities already exist to avoid duplicates
  const existingEntities = await db.select().from(entityTable);
  
  if (existingEntities.length > 0) {
    // Skip if data already exists
    return;
  }
  
  // Insert seed data
  await db.insert(entityTable).values([
    // Array of entity records
  ]);
}
```

The seed files are executed in order, respecting dependencies (e.g., companies must be created before users).

### Running Seeds

To seed your database:

```bash
# From project root
npm run db:seed

# From backend directory
npm run db:seed
```

To run both migrations and seeding in one command:

```bash
# From project root
npm run db:setup

# From backend directory
npm run db:setup
```

The seeding code is located in `backend/src/db/seed.ts`.

### Creating Custom Seeds

To create custom seed data:

1. Create a new seed file in `backend/src/db/seeds/` or modify existing ones
2. Follow the pattern of existing seed files
3. Import your seed function in `backend/src/db/seed.ts`
4. Add your seed function to the execution sequence

Example of a custom seed file:

```typescript
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { customTable } from '../schema/custom-table';
import logger from '../../utils/logger';

export async function seedCustomTable(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding custom table...');
    
    // Check if records already exist to avoid duplicates
    const existingRecords = await db.select().from(customTable);
    
    if (existingRecords.length > 0) {
      logger.info(`Found ${existingRecords.length} existing records, skipping seed`);
      return;
    }
    
    // Create sample records
    await db.insert(customTable).values([
      {
        // Record fields
      },
      // Additional records
    ]);
    
    logger.info('Custom table seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding custom table');
    throw error;
  }
}
```

Then add it to `backend/src/db/seed.ts`:

```typescript
import { seedCustomTable } from './seeds/custom-table';

async function seedDatabase() {
  // ... existing code
  
  try {
    // ... existing seed functions
    
    // Add your custom seed function
    await seedCustomTable(db);
    logger.info('Custom table seeded successfully');
    
    // ... rest of the function
  } catch (error) {
    // ... error handling
  }
}
```

## Environment Configuration

Database connection settings are configured through environment variables:

```
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sparrowx
DB_USER=postgres
DB_PASSWORD=postgres
```

These values are loaded from the project's `.env` file and made available to both migration and seeding scripts.

## Development Tools

The project includes Drizzle Studio, a web-based tool for exploring and manipulating your database:

```bash
# From project root
npm run db:studio

# From backend directory
npm run db:studio
```

This launches a local web interface that allows you to:
- Browse tables and their relationships
- View and edit data
- Run custom SQL queries
- Analyze schema changes

## Best Practices

When working with database schema, migrations, and seeding:

1. **Always generate migrations for schema changes**
   - Never modify the database schema directly
   - Always update schema files and generate migrations

2. **Test migrations thoroughly**
   - Test both applying and reverting migrations
   - Ensure data integrity is maintained

3. **Keep seeds idempotent**
   - Seeds should check if data exists before inserting
   - Running seeds multiple times should not create duplicate data

4. **Respect dependencies in seed files**
   - Ensure referenced entities exist before creating dependent entities
   - Follow the correct order of seeding (companies → users → other entities)

5. **Use realistic test data**
   - Create seed data that resembles real-world scenarios
   - Include edge cases for testing

6. **Maintain seed data along with schema changes**
   - When adding new fields, update seed files accordingly
   - When changing constraints, ensure seed data complies

7. **Version control all schema and seed files**
   - Commit both schema files and generated migrations
   - Document major schema changes

By following these guidelines, you'll maintain a robust database that evolves with your application while providing a consistent development experience. 