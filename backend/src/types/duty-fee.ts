export interface DutyFee {
  id: string;
  companyId: string;
  packageId: string;
  feeType: string;
  customFeeType?: string | null;
  amount: string | number;
  currency: 'USD' | 'JMD';
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDutyFeeRequest {
  packageId: string;
  feeType: string;
  customFeeType?: string;
  amount: number;
  currency: 'USD' | 'JMD';
  description?: string;
}

export interface UpdateDutyFeeRequest {
  feeType?: string;
  customFeeType?: string;
  amount?: number;
  currency?: 'USD' | 'JMD';
  description?: string;
}

export const DUTY_FEE_TYPES = [
  'Electronics',
  'Clothing & Footwear', 
  'Food & Grocery',
  'Household Appliances',
  'Furniture',
  'Construction Materials',
  'Tools & Machinery',
  'Cosmetics & Personal',
  'Medical Equipment',
  'Agricultural Products',
  'Pet Supplies',
  'Books & Education',
  'Mobile Accessories',
  'ANIMALS',
  'SOLAR EQUIPMENT',
  'WRIST WATCHES',
  'Other'
] as const;

export type DutyFeeType = typeof DUTY_FEE_TYPES[number];