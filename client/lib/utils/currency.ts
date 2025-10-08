import { SupportedCurrency, ExchangeRateSettings } from '../api/types';

/**
 * Convert amount from one currency to another using exchange rate settings
 */
export function convertCurrency(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  exchangeRateSettings?: ExchangeRateSettings
): number {
  // Add debugging
  console.log(`Converting ${amount} from ${fromCurrency} to ${toCurrency}`, 
              { exchangeRateSettings });
              
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // If no exchange rate settings provided, can't convert
  if (!exchangeRateSettings || !exchangeRateSettings.exchangeRate) {
    console.warn('No exchange rate settings or rate available for conversion');
    return amount;
  }

  const { exchangeRate } = exchangeRateSettings;
  
  // Default rate is USD to JMD (multiply by rate)
  if (fromCurrency === 'USD' && toCurrency === 'JMD') {
    const result = amount * exchangeRate;
    console.log(`USD to JMD: ${amount} * ${exchangeRate} = ${result}`);
    return result;
  }
  
  // JMD to USD (divide by rate)
  if (fromCurrency === 'JMD' && toCurrency === 'USD') {
    const result = amount / exchangeRate;
    console.log(`JMD to USD: ${amount} / ${exchangeRate} = ${result}`);
    return result;
  }

  // Fallback - shouldn't reach here with only USD and JMD
  console.warn(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
  return amount;
}

/**
 * Format currency amount with proper currency symbol
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'USD',
  showSymbol: boolean = true
): string {
  const symbols = {
    USD: '$',
    JMD: 'J$'
  };

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (showSymbol) {
    return `${symbols[currency]}${formattedAmount}`;
  }

  return formattedAmount;
}

/**
 * Get currency symbol for a given currency
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  const symbols = {
    USD: '$',
    JMD: 'J$'
  };
  return symbols[currency];
}

/**
 * Get available currency options for dropdowns
 */
export function getCurrencyOptions(): Array<{ value: SupportedCurrency; label: string }> {
  return [
    { value: 'USD', label: 'USD ($)' },
    { value: 'JMD', label: 'JMD (J$)' }
  ];
}

/**
 * Convert and format currency in one function
 */
export function convertAndFormatCurrency(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  exchangeRateSettings?: ExchangeRateSettings,
  showSymbol: boolean = true
): string {
  // Add debugging
  console.log(`Convert and format: ${amount} from ${fromCurrency} to ${toCurrency}`,
              { exchangeRateSettings });

  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency, exchangeRateSettings);
  return formatCurrency(convertedAmount, toCurrency, showSymbol);
}

/**
 * Round invoice total based on currency to reduce change requirements
 * JMD: Round to nearest 100 (e.g., J$3,247.50 → J$3,200)
 * USD: Round to nearest 10 (e.g., $32.47 → $30)
 */
export function roundInvoiceTotal(amount: number, currency: SupportedCurrency): number {
  if (currency === 'JMD') {
    return Math.round(amount / 100) * 100;
  } else if (currency === 'USD') {
    return Math.round(amount / 10) * 10;
  }
  // For other currencies, return original amount
  return amount;
} 