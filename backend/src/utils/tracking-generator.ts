import { randomUUID } from 'crypto';
import { db } from '../db';
import { companies } from '../db/schema/companies';
import { packages } from '../db/schema/packages';
import { eq } from 'drizzle-orm';

/**
 * Generates a unique internal tracking ID for a package
 * Format: [Company Prefix (first 3 chars)]-[Year (2 digits)]-[Month (2 digits)]-[Unique Identifier (6 chars)]
 * Example: ABC-23-05-ABC123
 */
export async function generateTrackingId(companyId: string): Promise<string> {
  // Get company name/code to use as prefix (first 3 characters)
  const companyResult = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  
  // If company not found, use a default prefix
  const prefix = companyResult.length > 0
    ? companyResult[0].name.substring(0, 3).toUpperCase()
    : 'SPC';
  
  // Get current date components
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01-12
  
  // Generate a unique identifier (6 characters)
  const uniqueId = generateUniqueIdentifier();
  
  // Combine into tracking ID
  const trackingId = `${prefix}-${year}-${month}-${uniqueId}`;
  
  // Check if this tracking ID already exists (very unlikely, but safety check)
  const existingPackage = await db
    .select()
    .from(packages)
    .where(eq(packages.trackingNumber, trackingId))
    .limit(1);
  
  // If exists (very unlikely), generate a new one recursively
  if (existingPackage.length > 0) {
    return generateTrackingId(companyId);
  }
  
  return trackingId;
}

/**
 * Generate a unique 6-character alphanumeric identifier (A-Z, 0-9)
 */
function generateUniqueIdentifier(): string {
  // Alphanumeric characters for random ID (excluding ambiguous characters like O, 0, I, 1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  // UUID for randomness
  const uuid = randomUUID();
  
  // Use the UUID to create a 6-character ID from the allowed characters
  for (let i = 0; i < 6; i++) {
    // Convert segment of the UUID to a number and use it to pick a character
    const index = parseInt(uuid.slice(i * 4, i * 4 + 4), 16) % chars.length;
    result += chars[index];
  }
  
  return result;
} 