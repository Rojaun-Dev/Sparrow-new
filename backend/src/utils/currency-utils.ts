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