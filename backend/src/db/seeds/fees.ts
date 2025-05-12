import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { fees, feeTypeEnum, calculationMethodEnum } from '../schema/fees';
import { companies } from '../schema/companies';
import logger from '../../utils/logger';

/**
 * Seed fees table with initial data
 */
export async function seedFees(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding fees...');
    
    // Check if fees already exist to avoid duplicates
    const existingFees = await db.select().from(fees);
    
    if (existingFees.length > 0) {
      logger.info(`Found ${existingFees.length} existing fees, skipping seed`);
      return;
    }
    
    // Get companies
    const companyRecords = await db.select({
      id: companies.id,
      subdomain: companies.subdomain,
      name: companies.name,
    }).from(companies);
    
    if (companyRecords.length === 0) {
      throw new Error('No companies found. Please seed companies first.');
    }
    
    // Define common fee structures
    const defaultFees = [
      // General Consumption Tax (GCT)
      {
        name: 'General Consumption Tax',
        code: 'GCT',
        feeType: 'tax' as typeof feeTypeEnum.enumValues[0],
        calculationMethod: 'percentage' as typeof calculationMethodEnum.enumValues[1],
        amount: '15.00', // 15%
        currency: 'USD',
        appliesTo: ['shipping', 'handling', 'customs'],
        metadata: {
          baseAttribute: 'subtotal',
          minimumThreshold: 0.50,
          maximumCap: 500.00
        },
        description: 'Standard Jamaica GCT applied to all services',
        isActive: true,
      },
      
      // Customs Tax
      {
        name: 'Customs Duty',
        code: 'DUTY',
        feeType: 'tax' as typeof feeTypeEnum.enumValues[0],
        calculationMethod: 'percentage' as typeof calculationMethodEnum.enumValues[1],
        amount: '20.00', // 20%
        currency: 'USD',
        appliesTo: ['declared_value'],
        metadata: {
          baseAttribute: 'declaredValue',
          thresholdConditions: {
            minValue: 50.00, // Only apply to packages worth $50 or more
          }
        },
        description: 'Import duty charged on declared value of packages',
        isActive: true,
      },
      
      // Weight-based Shipping Fee
      {
        name: 'Per Pound Shipping',
        code: 'SHIP_LB',
        feeType: 'shipping' as typeof feeTypeEnum.enumValues[2],
        calculationMethod: 'per_weight' as typeof calculationMethodEnum.enumValues[2],
        amount: '2.50', // $2.50 per pound
        currency: 'USD',
        appliesTo: ['weight'],
        metadata: {
          unit: 'lb',
          attributeName: 'weight'
        },
        description: 'Standard shipping rate per pound',
        isActive: true,
      },
      
      // Handling Fee
      {
        name: 'Base Handling',
        code: 'HANDLE_BASE',
        feeType: 'handling' as typeof feeTypeEnum.enumValues[3],
        calculationMethod: 'fixed' as typeof calculationMethodEnum.enumValues[0],
        amount: '5.00', // $5.00 flat fee
        currency: 'USD',
        appliesTo: ['package'],
        metadata: {},
        description: 'Standard handling fee per package',
        isActive: true,
      },
      
      // Dimensional Weight Fee
      {
        name: 'Dimensional Weight Fee',
        code: 'DIM_WEIGHT',
        feeType: 'shipping' as typeof feeTypeEnum.enumValues[2],
        calculationMethod: 'dimensional' as typeof calculationMethodEnum.enumValues[4],
        amount: '3.00', // $3.00 per dimensional weight unit
        currency: 'USD',
        appliesTo: ['dimensions'],
        metadata: {
          dimensionalFactor: 139,
          unit: 'lb'
        },
        description: 'Fee based on dimensional weight for bulky items',
        isActive: true,
      },
      
      // Tiered Weight Fee
      {
        name: 'Tiered Weight Shipping',
        code: 'TIER_WEIGHT',
        feeType: 'shipping' as typeof feeTypeEnum.enumValues[2],
        calculationMethod: 'tiered' as typeof calculationMethodEnum.enumValues[5],
        amount: '0.00', // Amount stored in tiers
        currency: 'USD',
        appliesTo: ['weight'],
        metadata: {
          attributeName: 'weight',
          unit: 'lb',
          tiers: [
            { min: 0, max: 5, rate: 10.00 },
            { min: 5, max: 10, rate: 15.00 },
            { min: 10, max: null, rate: 20.00 }
          ]
        },
        description: 'Shipping rate based on weight tiers',
        isActive: true,
      },
      
      // Per Item Fee
      {
        name: 'Per Item Processing',
        code: 'ITEM_PROC',
        feeType: 'service' as typeof feeTypeEnum.enumValues[1],
        calculationMethod: 'per_item' as typeof calculationMethodEnum.enumValues[3],
        amount: '1.50', // $1.50 per item
        currency: 'USD',
        appliesTo: ['item_count'],
        metadata: {
          attributeName: 'itemCount'
        },
        description: 'Processing fee charged per item in a package',
        isActive: true,
      }
    ];
    
    // Company-specific fee adjustments
    const companyFeeAdjustments: { [key: string]: { [key: string]: number } } = {
      'sparrow': {
        'GCT': 0, // Standard 15%
        'DUTY': 0, // Standard 20%
        'SHIP_LB': 0, // Standard $2.50
        'HANDLE_BASE': 0, // Standard $5.00
        'DIM_WEIGHT': 0, // Standard $3.00
      },
      'express': {
        'GCT': 0, // Standard 15%
        'DUTY': -2, // 18% (lower)
        'SHIP_LB': 0.25, // $2.75 (higher)
        'HANDLE_BASE': -1, // $4.00 (lower)
        'DIM_WEIGHT': 0.5, // $3.50 (higher)
      },
      'shipitfast': {
        'GCT': 0, // Standard 15%
        'DUTY': -3, // 17% (lower)
        'SHIP_LB': 0.5, // $3.00 (higher - premium for speed)
        'HANDLE_BASE': 1, // $6.00 (higher - premium for speed)
        'DIM_WEIGHT': 1, // $4.00 (higher - premium for speed)
      },
      'jampack': {
        'GCT': 0, // Standard 15%
        'DUTY': 1, // 21% (higher)
        'SHIP_LB': -0.25, // $2.25 (lower - budget option)
        'HANDLE_BASE': 0, // Standard $5.00
        'DIM_WEIGHT': -0.5, // $2.50 (lower - budget option)
      },
    };
    
    // Create fees for each company
    for (const company of companyRecords) {
      const adjustments = companyFeeAdjustments[company.subdomain] || {};
      
      for (const fee of defaultFees) {
        const adjustment = adjustments[fee.code] || 0;
        const baseAmount = parseFloat(fee.amount);
        const adjustedAmount = (baseAmount + adjustment).toFixed(2);
        
        await db.insert(fees).values({
          companyId: company.id,
          name: fee.name,
          code: fee.code,
          feeType: fee.feeType,
          calculationMethod: fee.calculationMethod,
          amount: adjustedAmount,
          currency: fee.currency,
          appliesTo: fee.appliesTo,
          metadata: fee.metadata || {},
          description: `${fee.description} for ${company.name}`,
          isActive: fee.isActive,
        });
      }
      
      // Add some company-specific fees
      if (company.subdomain === 'express') {
        await db.insert(fees).values({
          companyId: company.id,
          name: 'Express Processing',
          code: 'EXPRESS_PROC',
          feeType: 'service' as typeof feeTypeEnum.enumValues[1],
          calculationMethod: 'fixed' as typeof calculationMethodEnum.enumValues[0],
          amount: '10.00',
          currency: 'USD',
          appliesTo: ['package'],
          metadata: {
            tagConditions: {
              requiredTags: ['priority']
            }
          },
          description: 'Priority processing fee for faster service',
          isActive: true,
        });
      }
      
      if (company.subdomain === 'shipitfast') {
        await db.insert(fees).values({
          companyId: company.id,
          name: 'Premium Delivery',
          code: 'PREMIUM_DEL',
          feeType: 'service' as typeof feeTypeEnum.enumValues[1],
          calculationMethod: 'fixed' as typeof calculationMethodEnum.enumValues[0],
          amount: '15.00',
          currency: 'USD',
          appliesTo: ['package'],
          metadata: {
            thresholdConditions: {
              validFrom: '2023-01-01',
              validUntil: '2023-12-31'
            }
          },
          description: 'Same-day/next-day delivery service',
          isActive: true,
        });
      }
      
      if (company.subdomain === 'jampack') {
        await db.insert(fees).values({
          companyId: company.id,
          name: 'Bulk Discount',
          code: 'BULK_DISC',
          feeType: 'other' as typeof feeTypeEnum.enumValues[5],
          calculationMethod: 'percentage' as typeof calculationMethodEnum.enumValues[1],
          amount: '-5.00', // negative amount for discount
          currency: 'USD',
          appliesTo: ['invoice_total'],
          metadata: {
            baseAttribute: 'subtotal',
            thresholdConditions: {
              minValue: 100.00 // Only apply to orders over $100
            }
          },
          description: 'Discount applied to orders with 3+ items',
          isActive: true,
        });
      }
      
      logger.info(`Fees created for ${company.name}`);
    }
    
    logger.info('Fees seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding fees');
    throw error;
  }
} 