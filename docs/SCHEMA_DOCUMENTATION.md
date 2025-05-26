# Database Schema Documentation

## Navigation

- [Documentation Hub](./README.md)
- [Main Project README](../README.md)
- [Backend README](../backend/README.md)
- [Database Management Guide](./DATABASE.md)

## Table of Contents
- [Overview](#overview)
- [Core Schema Structure](#core-schema-structure)
  - [Users Table](#users-table)
  - [Companies Table](#companies-table)
  - [Company Settings Table](#company-settings-table)
  - [Company Assets Table](#company-assets-table)
  - [Company Invitations Table](#company-invitations-table)
- [Package Management Tables](#package-management-tables)
  - [Pre-Alerts Table](#pre-alerts-table)
  - [Packages Table](#packages-table)
- [Financial Tables](#financial-tables)
  - [Invoices Table](#invoices-table)
  - [Invoice Items Table](#invoice-items-table)
  - [Payments Table](#payments-table)
  - [Fees Table](#fees-table)
- [Audit & Logging](#audit--logging)
  - [Audit Logs Table](#audit-logs-table)
- [Database Relationships](#database-relationships)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Authentication System](#authentication-system)

## Overview

This document outlines the database schema for the SparrowX shipping platform. The database uses PostgreSQL with Drizzle ORM for schema management. For information on database migrations, seeding, and management, please refer to the [Database Management Guide](./DATABASE.md).

## Core Schema Structure

### Users Table

The users table stores user account information with the following fields:

| Field                    | Type                  | Description                                                                 |
|--------------------------|------------------------|-----------------------------------------------------------------------------|
| id                       | UUID                   | Primary key, automatically generated                                        |
| companyId                | UUID                   | Foreign key to companies table, with cascade delete                         |
| email                    | Text                   | Unique email address for user (not null)                                    |
| passwordHash             | Text                   | Password hash for JWT authentication                                        |
| firstName                | Text                   | User's first name (not null)                                                |
| lastName                 | Text                   | User's last name (not null)                                                 |
| phone                    | Text                   | User's phone number                                                         |
| address                  | Text                   | User's address                                                              |
| trn                      | Text                   | Tax Registration Number                                                     |
| role                     | Enum                   | User role: 'customer', 'admin_l1', 'admin_l2', 'super_admin'               |
| isActive                 | Boolean                | User account status, defaults to true                                       |
| isVerified               | Boolean                | Email verification status, defaults to false                                |
| verificationToken        | Text                   | Email verification token                                                    |
| verificationTokenExpires | Timestamp with TZ      | Verification token expiration timestamp                                     |
| notificationPreferences  | JSONB                  | User notification preferences                                               |
| resetToken              | Text                   | Password reset token                                                        |
| resetTokenExpires       | Timestamp with TZ      | Reset token expiration timestamp                                            |
| createdAt               | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt               | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

### Companies Table

The companies table stores information about shipping companies with the following fields:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| name          | Text                   | Company name (not null)                                                     |
| subdomain     | Text                   | Unique subdomain for company (not null)                                     |
| images        | JSONB                  | Company images including logo, defaults to empty object                     |
| address       | Text                   | Company address                                                             |
| phone         | Text                   | Company phone number                                                        |
| locations     | Text Array             | Array of location names served by the company                               |
| email         | Text                   | Unique company email (not null)                                             |
| website       | Text                   | Company website URL                                                         |
| bankInfo      | Text                   | Company banking information                                                 |
| createdAt     | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt     | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

### Company Settings Table

The company settings table stores configurable settings for each company:

| Field                | Type                  | Description                                                          |
|----------------------|------------------------|----------------------------------------------------------------------|
| id                   | UUID                   | Primary key, automatically generated                                 |
| companyId            | UUID                   | Foreign key to companies table, with cascade delete                  |
| shippingRates        | JSONB                  | Shipping rate configuration, defaults to empty object                |
| handlingFees         | JSONB                  | Handling fee configuration, defaults to empty object                 |
| customsFees          | JSONB                  | Customs fee configuration, defaults to empty object                  |
| taxRates             | JSONB                  | Tax rate configuration, defaults to empty object                     |
| notificationSettings | JSONB                  | Notification preferences, defaults to empty object                   |
| themeSettings        | JSONB                  | UI theme configuration, defaults to empty object                     |
| createdAt            | Timestamp with TZ      | Creation timestamp, auto-generated                                   |
| updatedAt            | Timestamp with TZ      | Last update timestamp, auto-generated                                |

### Company Assets Table

The company assets table stores links to company media assets:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| companyId     | UUID                   | Foreign key to companies table, with cascade delete                         |
| type          | Enum                   | Asset type: 'logo', 'banner', 'favicon', 'small_logo'                      |
| url           | Text                   | URL to the asset (not null)                                                 |
| createdAt     | Timestamp with TZ      | Creation timestamp, auto-generated                                          |

### Company Invitations Table

The company invitations table manages company invitation tokens:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | Serial                 | Primary key, auto-incrementing                                              |
| email         | Varchar(255)           | Invitee email address (not null)                                            |
| token         | Varchar(255)           | Unique invitation token (not null)                                          |
| companyId     | Varchar(255)           | Company identifier                                                          |
| status        | Enum                   | Status: 'pending', 'accepted', 'expired', 'cancelled'                      |
| expiresAt     | Timestamp              | Token expiration timestamp (not null)                                       |
| createdAt     | Timestamp              | Creation timestamp, auto-generated                                          |
| updatedAt     | Timestamp              | Last update timestamp, auto-generated                                       |
| createdBy     | Varchar(255)           | Creator identifier (not null)                                               |

## Package Management Tables

### Pre-Alerts Table

The pre-alerts table tracks package notifications before arrival:

| Field            | Type                  | Description                                                                 |
|------------------|------------------------|-----------------------------------------------------------------------------|
| id               | UUID                   | Primary key, automatically generated                                        |
| userId           | UUID                   | Foreign key to users table                                                  |
| companyId        | UUID                   | Foreign key to companies table                                              |
| trackingNumber   | Text                   | Package tracking number (not null)                                          |
| courier          | Text                   | Courier or shipping service (not null)                                      |
| description      | Text                   | Package description                                                         |
| estimatedWeight  | Decimal(10,2)          | Estimated package weight                                                    |
| estimatedArrival | Timestamp with TZ      | Estimated arrival date                                                      |
| packageId        | UUID                   | Optional foreign key to packages table                                      |
| status           | Enum                   | Status: 'pending', 'matched', 'cancelled'                                   |
| documents        | Text Array             | Array of document URLs                                                      |
| createdAt        | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt        | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

### Packages Table

The packages table records detailed package information:

| Field              | Type                  | Description                                                               |
|--------------------|------------------------|---------------------------------------------------------------------------|
| id                 | UUID                   | Primary key, automatically generated                                      |
| userId             | UUID                   | Foreign key to users table                                                |
| companyId          | UUID                   | Foreign key to companies table                                            |
| trackingNumber     | Text                   | Package tracking number (not null)                                        |
| internalTrackingId | Text                   | Unique internal reference ID (not null)                                   |
| status             | Enum                   | Status: 'pre_alert', 'received', 'processed', 'ready_for_pickup', 'delivered', 'returned' |
| description        | Text                   | Package description                                                       |
| weight             | Decimal(10,2)          | Package weight                                                            |
| dimensions         | JSONB                  | Package dimensions (length, width, height)                                |
| declaredValue      | Decimal(10,2)          | Declared value of package                                                 |
| senderInfo         | JSONB                  | Information about the package sender                                      |
| tags               | Text Array             | Array of tags for categorizing and filtering packages                     |
| receivedDate       | Timestamp with TZ      | Date when package was received at warehouse                               |
| processingDate     | Timestamp with TZ      | Date when package processing began                                        |
| photos             | Text Array             | Array of photo URLs for package images                                    |
| notes              | Text                   | Additional notes                                                          |
| createdAt          | Timestamp with TZ      | Creation timestamp, auto-generated                                        |
| updatedAt          | Timestamp with TZ      | Last update timestamp, auto-generated                                     |

## Financial Tables

### Invoices Table

The invoices table tracks billing records:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| userId        | UUID                   | Foreign key to users table                                                  |
| companyId     | UUID                   | Foreign key to companies table                                              |
| invoiceNumber | Text                   | Unique invoice identifier (not null)                                        |
| status        | Enum                   | Status: 'draft', 'issued', 'paid', 'cancelled', 'overdue'                  |
| issueDate     | Timestamp with TZ      | Invoice issue date                                                          |
| dueDate       | Timestamp with TZ      | Invoice due date                                                            |
| subtotal      | Decimal(10,2)          | Subtotal amount (not null, default 0)                                       |
| taxAmount     | Decimal(10,2)          | Tax amount (not null, default 0)                                            |
| totalAmount   | Decimal(10,2)          | Total invoice amount (not null, default 0)                                  |
| notes         | Text                   | Additional notes                                                            |
| createdAt     | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt     | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

### Invoice Items Table

The invoice items table stores the line items for invoices:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| companyId     | UUID                   | Foreign key to companies table, with cascade delete                         |
| invoiceId     | UUID                   | Foreign key to invoices table, with cascade delete                          |
| packageId     | UUID                   | Foreign key to packages table (nullable)                                    |
| description   | Text                   | Description of the invoice item (not null)                                  |
| quantity      | Integer                | Quantity of units (not null, default 1)                                     |
| unitPrice     | Decimal(10,2)          | Price per unit (not null)                                                   |
| lineTotal     | Decimal(10,2)          | Line item total (not null)                                                  |
| type          | Enum                   | Type: 'shipping', 'handling', 'customs', 'tax', 'other'                     |
| createdAt     | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt     | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

### Payments Table

The payments table records payment transactions:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| userId        | UUID                   | Foreign key to users table                                                  |
| companyId     | UUID                   | Foreign key to companies table                                              |
| invoiceId     | UUID                   | Foreign key to invoices table                                               |
| amount        | Decimal(10,2)          | Payment amount (not null)                                                   |
| paymentMethod | Enum                   | Method: 'credit_card', 'bank_transfer', 'cash', 'check'                    |
| status        | Enum                   | Status: 'pending', 'completed', 'failed', 'refunded'                       |
| transactionId | Text                   | External payment processor transaction ID                                   |
| paymentDate   | Timestamp with TZ      | Date of payment                                                             |
| notes         | Text                   | Additional notes                                                            |
| createdAt     | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt     | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

### Fees Table

The fees table stores configurable fee types and calculation methods for companies:

| Field             | Type                  | Description                                                                 |
|-------------------|------------------------|-----------------------------------------------------------------------------|
| id                | UUID                   | Primary key, automatically generated                                        |
| companyId         | UUID                   | Foreign key to companies table, with cascade delete                         |
| name              | Varchar(255)           | Human-readable name of the fee (not null)                                   |
| code              | Varchar(50)            | Machine-readable code/identifier for the fee (not null)                     |
| feeType           | Enum                   | Type: 'tax', 'service', 'shipping', 'handling', 'customs', 'other'         |
| calculationMethod | Enum                   | Method: 'fixed', 'percentage', 'per_weight', 'per_item', 'dimensional', 'tiered' |
| amount            | Decimal(10,2)          | Fee amount or percentage (not null)                                         |
| currency          | Varchar(3)             | Currency code, defaults to 'USD'                                            |
| appliesTo         | JSONB                  | JSON array of conditions or entity types this fee applies to                |
| metadata          | JSONB                  | Method-specific configuration and advanced conditions                      |
| description       | Text                   | Detailed description of the fee                                             |
| isActive          | Boolean                | Whether this fee is currently active, defaults to true                      |
| createdAt         | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt         | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

## Audit & Logging

### Audit Logs Table

The audit logs table tracks system activities:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| userId        | UUID                   | Foreign key to users table                                                  |
| companyId     | UUID                   | Foreign key to companies table                                              |
| action        | Text                   | Action performed (not null)                                                 |
| entityType    | Text                   | Type of entity affected (not null)                                          |
| entityId      | UUID                   | ID of affected entity (not null)                                            |
| details       | JSONB                  | Additional details about the action                                         |
| ipAddress     | Text                   | IP address of the user                                                      |
| userAgent     | Text                   | User agent string                                                           |
| createdAt     | Timestamp              | Creation timestamp, auto-generated                                          |

## Database Relationships

- **Users belong to Companies**: Each user is associated with a company through the `companyId` foreign key
- **Company Settings belong to Companies**: Each company has one settings record
- **Company Assets belong to Companies**: Companies can have multiple assets
- **Company Invitations belong to Companies**: Companies can have multiple pending invitations
- **Packages belong to Users**: Each package is associated with a user
- **Pre-Alerts belong to Users**: Pre-alerts are created by and associated with users
- **Invoices belong to Users**: Invoices are generated for specific users
- **Payments belong to Invoices**: Payments are applied to specific invoices
- **Fees belong to Companies**: Each company can define their own fee structures
- **Audit Logs track User Actions**: Each audit log entry is associated with a user and company

## Role-Based Access Control (RBAC)

User roles determine access permissions across the system:

| Role          | Description                                                                    |
|---------------|--------------------------------------------------------------------------------|
| customer      | End users who receive packages                                                 |
| admin_l1      | First-level company administrators with limited permissions                    |
| admin_l2      | Second-level company administrators with extended permissions                  |
| super_admin   | Platform administrators who can manage all companies and settings              |

The RBAC system follows the principle of least privilege, where users are granted only the permissions necessary for their role. This approach enhances security by limiting unauthorized access to sensitive data and operations.

## Authentication System

The system uses JWT (JSON Web Tokens) for identity management and authentication:

- **JWT Authentication**: Each user is authenticated using JWT tokens
- **Authentication Flow**: Users authenticate through the application login, which provides a JWT token for API access
- **Authorization**: The system checks the user's role and company affiliation stored in the JWT to determine access permissions
- **Password Reset**: Users can reset their password using a secure token-based system
- **Email Verification**: New user accounts require email verification
- **Session Management**: Secure session handling with proper token expiration and refresh mechanisms

> **Note**: Previously, the system used Auth0 for authentication (DEPRECATED). All Auth0 references have been removed in favor of JWT authentication. 