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

## Invoice Generation

The invoice generation process includes:

1. **Package Selection**: Choose packages to include in the invoice
2. **Fee Calculation**: Calculate all applicable fees for each package
3. **Line Item Creation**: Create line items for each fee
4. **Invoice Creation**: Create the invoice with appropriate metadata
   - Generate unique invoice number
   - Set issue and due dates
   - Calculate subtotal, tax, and total amounts

## API Endpoints

The billing system exposes the following API endpoints:

- `GET /companies/:companyId/billing/packages/:packageId/fees`: Calculate fees for a package
- `POST /companies/:companyId/billing/invoices/preview`: Preview invoice calculation
- `POST /companies/:companyId/billing/invoices/generate`: Generate an invoice
- `POST /companies/:companyId/billing/users/:userId/generate-invoice`: Generate invoice for user's unbilled packages

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

### Generating an Invoice

```typescript
const invoice = await billingService.generateInvoice({
  userId: '123e4567-e89b-12d3-a456-426614174000',
  packageIds: [
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174002'
  ]
}, companyId);
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