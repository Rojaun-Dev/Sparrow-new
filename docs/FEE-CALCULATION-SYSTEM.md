# SparrowX Fee Calculation System

## Overview

The SparrowX fee calculation system is a sophisticated engine that determines applicable fees for packages based on configurable rules, conditions, and business logic. It supports multiple calculation methods, currency conversions, and complex conditional logic.

## Architecture

### Core Components

1. **FeesService**: Handles individual fee calculations and configurations
2. **BillingService**: Orchestrates fee calculation for packages and invoices
3. **FeesRepository**: Manages fee data and retrieval
4. **DutyFeesRepository**: Handles package-specific duty fees
5. **Currency Utilities**: Provides exchange rate and conversion functionality

## Fee Types

The system supports the following fee types:

### 1. Shipping Fees
- **Purpose**: Cover shipping and logistics costs
- **Common Calculation Methods**: Fixed, per-weight, tiered
- **Example**: $15 base shipping + $2 per pound over 5 lbs

### 2. Handling Fees
- **Purpose**: Cover package processing and handling
- **Common Calculation Methods**: Fixed, per-item
- **Example**: $5 per package handling fee

### 3. Customs Fees
- **Purpose**: Cover customs processing and documentation
- **Common Calculation Methods**: Percentage of declared value, fixed
- **Example**: 2% of declared value with $10 minimum

### 4. Tax Fees
- **Purpose**: Government taxes and duties
- **Common Calculation Methods**: Percentage of subtotal or declared value
- **Example**: 15% GCT on total fees

### 5. Duty Fees
- **Purpose**: Import duties and custom duties
- **Common Calculation Methods**: Package-specific, manually entered
- **Example**: Alcohol duty, tobacco duty, electronics duty

### 6. Other/Service Fees
- **Purpose**: Miscellaneous charges and special services
- **Common Calculation Methods**: Fixed, percentage
- **Example**: Insurance fee, expedited processing

## Calculation Methods

### 1. Fixed Amount
```typescript
// Simple fixed fee
{
  "calculationMethod": "fixed",
  "amount": 25.00,
  "currency": "USD"
}
```

### 2. Percentage-Based
```typescript
// 5% of declared value
{
  "calculationMethod": "percentage",
  "amount": 5.0,
  "metadata": {
    "baseAttribute": "declaredValue"
  }
}

// 15% of subtotal (taxes)
{
  "calculationMethod": "percentage",
  "amount": 15.0,
  "metadata": {
    "baseAttribute": "subtotal"
  }
}
```

### 3. Per-Weight Calculation
```typescript
// $2 per pound
{
  "calculationMethod": "per_weight",
  "amount": 2.00,
  "currency": "USD"
}
```

### 4. Per-Item Calculation
```typescript
// $5 per package
{
  "calculationMethod": "per_item",
  "amount": 5.00,
  "currency": "USD"
}
```

### 5. Dimensional Weight
```typescript
// Based on volume (length × width × height)
{
  "calculationMethod": "dimensional",
  "amount": 0.01, // per cubic inch
  "metadata": {
    "divisor": 166 // dimensional weight divisor
  }
}
```

### 6. Tiered Pricing
```typescript
// Different rates based on weight ranges
{
  "calculationMethod": "tiered",
  "metadata": {
    "tiers": [
      {"min": 0, "max": 5, "rate": 10.00},
      {"min": 5, "max": 20, "rate": 15.00},
      {"min": 20, "max": null, "rate": 20.00}
    ]
  }
}
```

## Conditional Logic

### Tag-Based Conditions

Fees can be applied based on package tags:

```typescript
{
  "appliesTo": ["fragile", "electronics"],
  "metadata": {
    "tagConditions": {
      "requiredTags": ["fragile"], // Package must have this tag
      "excludedTags": ["document"] // Package must not have this tag
    }
  }
}
```

**Examples:**
- Fragile handling fee: Applied only to packages tagged as "fragile"
- Document processing fee: Applied only to packages tagged as "document"
- Express fee: Applied to packages with "express" or "priority" tags

### Threshold Conditions

Fees can be applied based on package attributes:

```typescript
{
  "metadata": {
    "thresholdConditions": {
      "minWeight": 5.0,        // Minimum weight in pounds
      "maxWeight": 50.0,       // Maximum weight in pounds
      "minValue": 100.00,      // Minimum declared value
      "maxValue": 1000.00,     // Maximum declared value
      "validFrom": "2024-01-01", // Date range start
      "validUntil": "2024-12-31" // Date range end
    }
  }
}
```

**Examples:**
- Heavy package fee: Applied to packages over 50 lbs
- High-value insurance: Applied to packages over $500 declared value
- Seasonal fees: Applied during specific date ranges
- Small package exemption: Waived fees for packages under 1 lb

### Fee Limits

Apply minimum and maximum caps to calculated fees:

```typescript
{
  "metadata": {
    "minimumThreshold": 5.00,  // Never charge less than $5
    "maximumCap": 100.00       // Never charge more than $100
  }
}
```

**Examples:**
- Insurance fee: 2% of value, minimum $5, maximum $100
- Percentage-based customs: 3% of value, minimum $10
- Weight-based shipping: $2/lb, minimum $15, maximum $200

## Multi-Currency Support

### Currency Conversion Process

1. **Fee Definition**: Fees are defined in their original currency (USD or JMD)
2. **Calculation**: Fees are calculated in their original currency
3. **Conversion**: Results are converted to the company's display currency
4. **Storage**: Final amounts are stored in the company's base currency

### Exchange Rate Configuration

```typescript
{
  "exchangeRateSettings": {
    "baseCurrency": "USD",
    "targetCurrency": "JMD",
    "exchangeRate": 155.50,
    "autoUpdate": false,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### Conversion Example

```typescript
// Fee defined in USD: $10.00
// Company display currency: JMD
// Exchange rate: 155.50 JMD = 1 USD

const originalAmount = 10.00; // USD
const convertedAmount = 10.00 * 155.50; // = 1,555.00 JMD

// Line item description becomes:
"Processing Fee (USD 10.00 → JMD 1,555.00)"
```

## Fee Application Algorithm

### Step-by-Step Process

1. **Initialize Totals**:
   ```typescript
   const result = {
     shipping: 0, handling: 0, customs: 0,
     duty: 0, other: 0, taxes: 0,
     subtotal: 0, total: 0, lineItems: []
   };
   ```

2. **Apply Base Fees** (fixed, per-weight, per-item):
   ```typescript
   for (const feeType of ['shipping', 'handling', 'customs', 'service', 'other']) {
     const fees = await getApplicableFees(packageData, companyId, feeType);
     for (const fee of fees) {
       if (feeApplies(fee, packageData)) {
         const amount = calculateFeeAmount(fee, baseAmount, packageData);
         result[feeType] += amount;
       }
     }
   }
   ```

3. **Add Duty Fees**:
   ```typescript
   const dutyFees = await getDutyFeesByPackageId(packageId);
   for (const dutyFee of dutyFees) {
     result.duty += convertCurrency(dutyFee.amount, dutyFee.currency, displayCurrency);
   }
   ```

4. **Calculate Subtotal**:
   ```typescript
   result.subtotal = result.shipping + result.handling +
                     result.customs + result.duty + result.other;
   ```

5. **Apply Percentage Fees**:
   ```typescript
   for (const fee of percentageFees) {
     const base = getBaseAmount(fee.metadata.baseAttribute, result);
     const amount = (base * fee.amount) / 100;
     result[fee.feeType] += amount;
   }
   ```

6. **Apply Tax Fees**:
   ```typescript
   const taxFees = await getApplicableFees(packageData, companyId, 'tax');
   for (const fee of taxFees) {
     const base = result.subtotal; // or other base attribute
     const amount = (base * fee.amount) / 100;
     result.taxes += amount;
   }
   ```

7. **Calculate Final Total**:
   ```typescript
   result.total = result.subtotal + result.taxes;
   ```

## Fee Configuration Examples

### Example 1: Basic Shipping Fee
```json
{
  "name": "Standard Shipping",
  "code": "SHIP_STD",
  "feeType": "shipping",
  "calculationMethod": "fixed",
  "amount": 15.00,
  "currency": "USD",
  "appliesTo": [],
  "isActive": true
}
```

### Example 2: Weight-Based Handling
```json
{
  "name": "Handling Fee",
  "code": "HANDLE_WEIGHT",
  "feeType": "handling",
  "calculationMethod": "per_weight",
  "amount": 2.50,
  "currency": "USD",
  "appliesTo": [],
  "metadata": {
    "minimumThreshold": 10.00,
    "maximumCap": 100.00
  }
}
```

### Example 3: Fragile Item Surcharge
```json
{
  "name": "Fragile Handling",
  "code": "FRAGILE_FEE",
  "feeType": "other",
  "calculationMethod": "fixed",
  "amount": 25.00,
  "currency": "USD",
  "appliesTo": ["fragile"],
  "metadata": {
    "tagConditions": {
      "requiredTags": ["fragile"]
    }
  }
}
```

### Example 4: Value-Based Insurance
```json
{
  "name": "Insurance Fee",
  "code": "INSURANCE",
  "feeType": "other",
  "calculationMethod": "percentage",
  "amount": 2.0,
  "currency": "USD",
  "appliesTo": [],
  "metadata": {
    "baseAttribute": "declaredValue",
    "minimumThreshold": 5.00,
    "maximumCap": 100.00,
    "thresholdConditions": {
      "minValue": 100.00
    }
  }
}
```

### Example 5: Government Tax
```json
{
  "name": "General Consumption Tax",
  "code": "GCT",
  "feeType": "tax",
  "calculationMethod": "percentage",
  "amount": 15.0,
  "currency": "JMD",
  "appliesTo": [],
  "metadata": {
    "baseAttribute": "subtotal"
  }
}
```

## Troubleshooting Common Issues

### Issue 1: Fees Not Applied
**Symptoms**: Expected fees don't appear on invoice
**Causes**:
- Fee is inactive (`isActive: false`)
- Tag conditions not met
- Threshold conditions not satisfied
- Fee type filter excludes the fee

**Debug Steps**:
1. Check fee active status
2. Verify package tags match `appliesTo` or `requiredTags`
3. Confirm package attributes meet threshold conditions
4. Ensure fee type is included in calculation

### Issue 2: Incorrect Fee Amounts
**Symptoms**: Fee amounts don't match expectations
**Causes**:
- Currency conversion issues
- Incorrect base amount for percentage fees
- Fee limits being applied
- Wrong calculation method

**Debug Steps**:
1. Check original vs converted currency amounts
2. Verify base amount for percentage calculations
3. Review minimum/maximum limits in metadata
4. Confirm calculation method matches expectation

### Issue 3: Duplicate Fees
**Symptoms**: Same fee applied multiple times
**Causes**:
- Fixed fees not properly deduplicated
- Multiple packages triggering same fixed fee
- Fee conditions allowing multiple applications

**Debug Steps**:
1. Check `fixedFeesApplied` Set tracking
2. Review fee applicability conditions
3. Verify fee type and calculation method

## Performance Considerations

### Optimization Strategies

1. **Fee Caching**: Cache active fees per company to reduce database queries
2. **Bulk Calculations**: Process multiple packages in single operation
3. **Condition Indexing**: Index package tags and attributes for faster filtering
4. **Exchange Rate Caching**: Cache exchange rates to avoid repeated API calls

### Best Practices

1. **Limit Complex Conditions**: Keep tag and threshold conditions simple
2. **Use Appropriate Indexes**: Index frequently queried fee attributes
3. **Monitor Query Performance**: Track fee calculation execution times
4. **Batch Fee Updates**: Update multiple fees in transactions

## Integration with Invoice Generation

The fee calculation system integrates seamlessly with invoice generation:

1. **Package Selection**: Choose packages for billing
2. **Fee Calculation**: Calculate all applicable fees using this system
3. **Line Item Creation**: Convert fee results to invoice line items
4. **Currency Consistency**: Ensure all amounts use same display currency
5. **Audit Trail**: Log fee calculations for compliance and debugging

This system provides the flexibility needed for complex billing scenarios while maintaining performance and accuracy across multi-tenant, multi-currency environments.