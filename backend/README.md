# SparrowX Backend

This is the backend API service for the SparrowX platform, a multi-tenant SaaS solution for Jamaican package-forwarding companies.

## Technology Stack

- **Express.js**: Web framework for the API
- **TypeScript**: For type-safe JavaScript
- **PostgreSQL**: Database
- **Drizzle ORM**: Database ORM with migrations
- **Auth0**: Authentication and authorization
- **Zod**: Validation schema

## Project Structure

```
backend/
├── src/                      # Source code
│   ├── config/               # Configuration settings
│   ├── controllers/          # Request handlers
│   ├── db/                   # Database connection and schemas
│   │   ├── migrations/       # Database migrations
│   │   └── schema/           # Table definitions
│   ├── middleware/           # Express middleware
│   ├── repositories/         # Database access layer
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── index.ts              # Application entry point
├── .env                      # Environment variables (not in version control)
├── .env.example              # Example environment variables
├── drizzle.config.ts         # Drizzle ORM configuration
├── package.json              # Project dependencies
└── tsconfig.json             # TypeScript configuration
```

## Setup and Installation

1. Clone the repository
2. Navigate to the backend directory

   ```bash
   cd backend
   ```

3. Install dependencies

   ```bash
   npm install
   ```

4. Create a `.env` file based on `.env.example`

   ```bash
   cp .env.example .env
   ```

5. Set up a PostgreSQL database and update the DB_* variables in the .env file

6. Set up Auth0 and update the AUTH0_* variables in the .env file

7. Run database migrations

   ```bash
   npm run db:migrate
   ```

## Development

Start the development server:

```bash
npm run dev
```

This will start the server with hot-reloading at `http://localhost:4000`.

## Database Management

- Generate migrations from schema changes:

  ```bash
  npm run db:generate
  ```

- Apply migrations:

  ```bash
  npm run db:migrate
  ```

- Explore database with Drizzle Studio:

  ```bash
  npm run db:studio
  ```

For detailed information on database migrations, seeding, and best practices:

- [Database Management Guide](../docs/DATABASE.md)

## API Documentation

The API follows a RESTful design and provides endpoints for:

- Company management
- User management
- Package tracking
- Pre-alert management
- Invoice and payment processing
- Company settings

### Authentication

All API endpoints are secured with Auth0 JWT tokens. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Multi-Tenancy

Each request must include a company context, which is automatically extracted from the JWT token. All data operations are automatically scoped to the company context of the authenticated user.

## Database Schema Documentation

For a comprehensive reference of the database schema, including table structures, relationships, and the role-based access control system, please see:

- [Database Schema Documentation](./SCHEMA_DOCUMENTATION.md)

## Testing

Run the test suite:

```bash
npm test
```

## Building for Production

Build the TypeScript code:

```bash
npm run build
```

Start the production server:

```bash
npm start
``` 