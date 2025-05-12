# Database Schema Documentation

## Navigation

- [Documentation Hub](../docs/README.md)
- [Main Project README](../README.md)
- [Backend README](./README.md)
- [Database Management Guide](./DATABASE.md)

## Table of Contents
- [Overview](#overview)
- [Core Schema Structure](#core-schema-structure)
  - [Users Table](#users-table)
  - [Companies Table](#companies-table)
  - [Company Settings Table](#company-settings-table)
  - [Company Assets Table](#company-assets-table)
- [Package Management Tables](#package-management-tables)
  - [Pre-Alerts Table](#pre-alerts-table)
  - [Packages Table](#packages-table)
- [Financial Tables](#financial-tables)
  - [Invoices Table](#invoices-table)
  - [Payments Table](#payments-table)
  - [Fees Table](#fees-table)
- [Database Relationships](#database-relationships)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Authentication System](#authentication-system)

## Overview

This document outlines the database schema for the SparrowX shipping platform. The database uses PostgreSQL with Drizzle ORM for schema management. For information on database migrations, seeding, and management, please refer to the [Database Management Guide](./DATABASE.md).

## Core Schema Structure

### Users Table

The users table stores user account information with the following fields:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| companyId     | UUID                   | Foreign key to companies table, with cascade delete                         |
| email         | Text                   | Unique email address for user (not null)                                    |
| passwordHash  | Text                   | Password hash for JWT authentication                                        |
| firstName     | Text                   | User's first name (not null)                                                |
| lastName      | Text                   | User's last name (not null)                                                 |
| phone         | Text                   | User's phone number                                                         |
| address       | Text                   | User's address                                                              |
| role          | Enum                   | User role: 'customer', 'admin_l1', 'admin_l2', 'super_admin'               |
| authId        | Text                   | User authentication identifier (DEPRECATED: previously auth0Id)             |
| isActive      | Boolean                | User account status, defaults to true                                       |
| createdAt     | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt     | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

**Notes on authId**:
- The `authId` field was previously used to store the Auth0 identifier (DEPRECATED)
- Now used for JWT authentication identifier if needed
- Authentication is now managed directly by the application using JWT

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
| type          | Enum                   | Asset type enumeration                                                      |
| url           | Text                   | URL to the asset (not null)                                                 |
| createdAt     | Timestamp with TZ      | Creation timestamp, auto-generated                                          |

## Package Management Tables

### Pre-Alerts Table

The pre-alerts table tracks package notifications before arrival:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| userId        | UUID                   | Foreign key to users table                                                  |
| companyId     | UUID                   | Foreign key to companies table                                              |
| trackingNumber| Text                   | Package tracking number                                                     |
| courier       | Text                   | Courier or shipping service                                                 |
| description   | Text                   | Package description                                                         |
| value         | Numeric               | Declared package value                                                      |
| weight        | Numeric               | Package weight                                                              |
| status        | Enum                   | Status of pre-alert: 'pending', 'matched', 'cancelled'                      |
| createdAt     | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt     | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

### Packages Table

The packages table records detailed package information:

| Field           | Type                  | Description                                                               |
|-----------------|------------------------|---------------------------------------------------------------------------|
| id              | UUID                   | Primary key, automatically generated                                      |
| userId          | UUID                   | Foreign key to users table                                                |
| companyId       | UUID                   | Foreign key to companies table                                            |
| preAlertId      | UUID                   | Optional foreign key to pre-alerts table                                  |
| trackingNumber  | Text                   | Package tracking number                                                   |
| internalTrackingId | Text                | Unique internal reference ID (must be unique across all packages)         |
| status          | Enum                   | Package status: 'received', 'processing', 'ready', 'delivered', etc.      |
| description     | Text                   | Package description                                                       |
| weight          | Numeric               | Package weight                                                            |
| dimensions      | JSONB                  | Package dimensions (length, width, height)                                |
| declaredValue   | Numeric               | Declared value of package                                                 |
| senderInfo      | JSONB                  | Information about the package sender                                      |
| receivedDate    | Timestamp with TZ      | Date when package was received at warehouse                               |
| processingDate  | Timestamp with TZ      | Date when package processing began                                        |
| photos          | Text Array             | Array of photo URLs for package images                                    |
| customsFees     | Numeric               | Customs fees for package                                                  |
| shippingFees    | Numeric               | Shipping fees                                                             |
| handlingFees    | Numeric               | Handling fees                                                             |
| taxAmount       | Numeric               | Tax amount                                                                |
| insuranceFee    | Numeric               | Insurance fee                                                             |
| totalFees       | Numeric               | Total of all fees                                                         |
| notes           | Text                   | Additional notes                                                          |
| createdAt       | Timestamp with TZ      | Creation timestamp, auto-generated                                        |
| updatedAt       | Timestamp with TZ      | Last update timestamp, auto-generated                                     |

## Financial Tables

### Invoices Table

The invoices table tracks billing records:

| Field         | Type                  | Description                                                                 |
|---------------|------------------------|-----------------------------------------------------------------------------|
| id            | UUID                   | Primary key, automatically generated                                        |
| userId        | UUID                   | Foreign key to users table                                                  |
| companyId     | UUID                   | Foreign key to companies table                                              |
| invoiceNumber | Text                   | Unique invoice identifier                                                   |
| status        | Enum                   | Invoice status: 'draft', 'sent', 'paid', 'overdue', 'cancelled'            |
| dueDate       | Date                   | Invoice due date                                                            |
| subtotal      | Numeric               | Subtotal amount                                                             |
| taxAmount     | Numeric               | Tax amount                                                                  |
| totalAmount   | Numeric               | Total invoice amount                                                        |
| notes         | Text                   | Additional notes                                                            |
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
| amount        | Numeric               | Payment amount                                                              |
| paymentMethod | Enum                   | Payment method: 'credit_card', 'bank_transfer', 'cash', etc.               |
| status        | Enum                   | Payment status: 'pending', 'completed', 'failed', 'refunded'               |
| transactionId | Text                   | External payment processor transaction ID                                   |
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
| feeType           | Enum                   | Type of fee: 'tax', 'service', 'shipping', 'handling', 'customs', 'other'   |
| calculationMethod | Enum                   | Fee calculation method: 'fixed', 'percentage', 'per_weight', 'per_item'     |
| amount            | Numeric               | Fee amount or percentage (not null)                                         |
| currency          | Varchar(3)             | Currency code, defaults to 'USD'                                            |
| appliesTo         | JSONB                  | JSON array of conditions or entity types this fee applies to                |
| description       | Text                   | Detailed description of the fee                                             |
| isActive          | Boolean                | Whether this fee is currently active, defaults to true                      |
| createdAt         | Timestamp with TZ      | Creation timestamp, auto-generated                                          |
| updatedAt         | Timestamp with TZ      | Last update timestamp, auto-generated                                       |

## Database Relationships

- **Users belong to Companies**: Each user is associated with a company through the `companyId` foreign key
- **Company Settings belong to Companies**: Each company has one settings record
- **Company Assets belong to Companies**: Companies can have multiple assets
- **Packages belong to Users**: Each package is associated with a user
- **Pre-Alerts belong to Users**: Pre-alerts are created by and associated with users
- **Invoices belong to Users**: Invoices are generated for specific users
- **Payments belong to Invoices**: Payments are applied to specific invoices
- **Fees belong to Companies**: Each company can define their own fee structures

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

> **Note**: Previously, the system used Auth0 for authentication (DEPRECATED). All Auth0 references have been removed in favor of JWT authentication. 