interface ExchangeRateSettings {
  baseCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  lastUpdated?: string;
  autoUpdate?: boolean;
}

/**
 * Convert amount from one currency to another using exchange rate settings
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRateSettings: ExchangeRateSettings
): number {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const { baseCurrency, targetCurrency, exchangeRate } = exchangeRateSettings;
  
  // Convert from base to target currency
  if (fromCurrency === baseCurrency && toCurrency === targetCurrency) {
    return amount * exchangeRate;
  }
  
  // Convert from target to base currency
  if (fromCurrency === targetCurrency && toCurrency === baseCurrency) {
    return amount / exchangeRate;
  }
  
  // If neither matches the configured pair, return original amount
  // This handles cases where currencies don't match the configured exchange rate
  console.warn(`Cannot convert from ${fromCurrency} to ${toCurrency} with exchange rate settings`, exchangeRateSettings);
  return amount;
}

/**
 * Get the display currency for billing (usually the company's base currency)
 */
export function getDisplayCurrency(exchangeRateSettings: ExchangeRateSettings): string {
  return exchangeRateSettings.baseCurrency || 'USD';
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = currency === 'JMD' ? 'J$' : '$';
  return `${symbol}${formatter.format(amount)}`;
}

/**
 * Round invoice total based on currency to reduce change requirements
 * JMD: Round to nearest 100 (e.g., J$3,247.50 → J$3,200)
 * USD: Round to nearest 10 (e.g., $32.47 → $30)
 *
 * Special handling for small amounts:
 * - If amount > 0 but rounds to 0, use minimum increment instead
 * - Ensures invoices always have a non-zero total if there are charges
 */
export function roundInvoiceTotal(amount: number, currency: string): number {
  // Handle zero or negative amounts
  if (amount <= 0) {
    return 0;
  }

  if (currency === 'JMD') {
    const rounded = Math.round(amount / 100) * 100;
    // If rounds to 0 but amount is positive, use minimum of 100
    return rounded === 0 ? 100 : rounded;
  } else if (currency === 'USD') {
    const rounded = Math.round(amount / 10) * 10;
    // If rounds to 0 but amount is positive, use minimum of 10
    return rounded === 0 ? 10 : rounded;
  }

  // For other currencies, return original amount
  return amount;
}