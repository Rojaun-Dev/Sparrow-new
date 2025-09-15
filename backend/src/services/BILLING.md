# SparrowX Billing Implementation

## Overview

The SparrowX billing system provides a comprehensive solution for calculating fees and generating invoices for packages. The system follows a structured approach to determine applicable fees based on package attributes and company settings.

## Architecture

The billing implementation consists of the following components:

1. **BillingService**: Core service that handles fee calculation and invoice generation
2. **FeesService**: Service for configuring and calculating individual fees
3. **InvoiceItemsRepository**: Repository for managing invoice line items
4. **PackagesRepository**: Enhanced to find unbilled packages

## Fee Calculation Process

The fee calculation process follows these steps:

1. **Fee Applicability**: Determine which fees apply to a package based on:
   - Package attributes (weight, dimensions, declared value)
   - Fee type (shipping, handling, customs, tax, other)
   - Conditional rules (tags, thresholds, date ranges)

2. **Fee Amount Calculation**: Calculate the amount for each applicable fee using:
   - Fixed amounts
   - Percentage-based calculations
   - Per-weight calculations
   - Per-item calculations
   - Dimensional weight calculations
   - Tiered pricing

3. **Fee Limits**: Apply minimum thresholds and maximum caps to fee amounts

4. **Currency Conversion**: Handle multi-currency scenarios:
   - Convert fees from their original currency to company's base currency
   - Support for USD and JMD currencies
   - Exchange rate configuration per company
   - Automatic conversion during fee calculation
   - Display currency conversion information in line item descriptions

## Invoice Generation

The invoice generation process includes:

1. **Package Selection**: Choose packages to include in the invoice
2. **Fee Calculation**: Calculate all applicable fees for each package
3. **Line Item Creation**: Create line items for each fee
4. **Invoice Creation**: Create the invoice with appropriate metadata
   - Generate unique invoice number
   - Set issue and due dates
   - Calculate subtotal, tax, and total amounts

### Invoice Types

The system supports two main invoice generation workflows:

#### 1. Manual Invoice Generation (`generateInvoice`)
- **Purpose**: Full-featured invoice creation with custom line items and additional charges
- **Features**:
  - Select specific packages
  - Add custom line items with descriptions, quantities, unit prices
  - Include additional charges
  - Set custom issue and due dates
  - Control fee generation (enable/disable automatic fees)
  - Create draft invoices
  - Support for multi-currency scenarios with preferred currency

#### 2. Quick Invoice Generation (`generateInvoiceForUser`)
- **Purpose**: Streamlined invoice creation for all unbilled packages of a user
- **Features**:
  - Automatically includes all unbilled packages for a user
  - Generates standard fees based on company fee configuration
  - Uses default due date (7 days from creation)
  - Simplified workflow for common billing scenarios
  - Used by admin interfaces for rapid billing processing

## API Endpoints

The billing system exposes the following API endpoints:

- `GET /companies/:companyId/billing/packages/:packageId/fees`: Calculate fees for a package
- `POST /companies/:companyId/billing/invoices/preview`: Preview invoice calculation
- `POST /companies/:companyId/billing/invoices/generate`: Generate an invoice
- `POST /companies/:companyId/billing/users/:userId/generate-invoice`: Generate invoice for user's unbilled packages

## Audit Logging & Notifications

The billing system includes comprehensive audit logging and notification features:

### Audit Logging
- **Manual Invoice Creation**: Logs when admin users manually create invoices
- **Quick Invoice Creation**: Logs when admin users use quick invoice generation
- **Tracked Information**:
  - Admin user ID and company ID
  - Invoice details (ID, number, amount, customer)
  - Package information (IDs and count)
  - IP address and user agent
  - Timestamp and action type

### Email Notifications
- **Conditional Sending**: Only sends if user has email notifications enabled
- **User Preference Checks**: Respects user's billing update notification preferences
- **Invoice Information**: Includes invoice number, dates, amount, and package count
- **Company Branding**: Uses company name in notification emails
- **Error Handling**: Graceful handling of email sending failures (doesn't fail invoice creation)

## Recent Improvements & Bug Fixes

### Currency Field Cleanup (Latest)
- **Issue**: Currency field was being included in line item data before database insertion
- **Root Cause**: Database schema doesn't support currency field in `invoice_items` table
- **Solution**:
  - Removed currency field from `customLineItemSchema` validation
  - Updated currency handling to use company's base currency for all line items
  - Currency field is removed from line item data before database insertion
- **Impact**: Eliminates ORM errors and improves data consistency

## Implementation Details

### Fee Conditional Logic

The system supports multiple conditions for fee applicability:

```javascript
// Tag conditions
{
  "tagConditions": {
    "requiredTags": ["fragile"],
    "excludedTags": ["document"]
  }
}

// Threshold conditions
{
  "thresholdConditions": {
    "minWeight": 5,
    "maxWeight": 50,
    "minValue": 100,
    "maxValue": 1000,
    "validFrom": "2023-01-01",
    "validUntil": "2023-12-31"
  }
}

// Fee limits
{
  "minimumThreshold": 5.00,
  "maximumCap": 50.00
}
```

### Calculation Methods

The system supports multiple calculation methods:

```javascript
// Fixed fee
calculateFeeAmount(fee, baseAmount, packageData) {
  return fee.amount;
}

// Percentage-based fee
calculateFeeAmount(fee, baseAmount, packageData) {
  return (baseAmount * fee.amount) / 100;
}

// Per-weight fee
calculateFeeAmount(fee, baseAmount, packageData) {
  return fee.amount * packageData.weight;
}
```

### Advanced Fee Calculation Logic

The system implements a sophisticated fee calculation engine with the following features:

#### Fee Application Order
1. **Base Fees First**: Calculate all non-percentage fees (fixed, per-weight, etc.)
2. **Duty Fees**: Add any duty fees associated with packages
3. **Subtotal Calculation**: Calculate subtotal from all base fees
4. **Percentage Fees**: Calculate percentage-based fees using calculated base amounts
5. **Tax Calculation**: Apply tax fees as final step

#### Fixed Fee Deduplication
- Fixed fees are applied only once per invoice (tracked with `fixedFeesApplied` Set)
- Prevents duplicate charges when multiple packages qualify for the same fixed fee
- Example: "Processing Fee" of $5 applies once regardless of package count

#### Currency Conversion Flow
```typescript
// 1. Calculate fee in original currency
const originalAmount = calculateFeeAmount(fee, baseAmount, packageData);

// 2. Convert to display currency if needed
const convertedAmount = convertCurrency(
  originalAmount,
  fee.currency,
  displayCurrency,
  exchangeRateSettings
);

// 3. Apply limits in converted currency
const finalAmount = applyLimits(convertedAmount, fee.metadata);

// 4. Create line item with conversion note
const description = fee.currency !== displayCurrency
  ? `${fee.name} (${fee.currency} ${originalAmount} → ${displayCurrency})`
  : fee.name;
```

## Usage Examples

### Calculating Fees for a Package

```typescript
const fees = await billingService.calculatePackageFees(packageId, companyId);

console.log(`Shipping: ${fees.shipping}`);
console.log(`Handling: ${fees.handling}`);
console.log(`Customs: ${fees.customs}`);
console.log(`Taxes: ${fees.taxes}`);
console.log(`Other: ${fees.other}`);
console.log(`Subtotal: ${fees.subtotal}`);
console.log(`Total: ${fees.total}`);
```

### Generating a Manual Invoice

```typescript
const invoice = await billingService.generateInvoice({
  userId: '123e4567-e89b-12d3-a456-426614174000',
  packageIds: [
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174002'
  ],
  customLineItems: [
    {
      description: 'Expedited Processing Fee',
      quantity: 1,
      unitPrice: 25.00,
      isTax: false
    }
  ],
  additionalCharge: 10.00,
  additionalChargeCurrency: 'USD',
  notes: 'Rush delivery requested',
  sendNotification: true,
  generateFees: true,
  preferredCurrency: 'USD'
}, companyId);
```

### Generating a Quick Invoice

```typescript
// Generate invoice for all unbilled packages of a user
const invoice = await billingService.generateInvoiceForUser(
  '123e4567-e89b-12d3-a456-426614174000', // userId
  companyId
);

// This automatically:
// - Finds all unbilled packages for the user
// - Calculates standard fees for each package
// - Creates invoice with 7-day due date
// - Generates audit log entry
```

### Previewing an Invoice

```typescript
const preview = await billingService.previewInvoice({
  userId: '123e4567-e89b-12d3-a456-426614174000',
  packageIds: [
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174002'
  ]
}, companyId);
``` 