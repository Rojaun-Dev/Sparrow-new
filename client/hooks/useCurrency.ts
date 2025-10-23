import { useState, useEffect } from 'react';
import { useCompanySettings } from './useCompanySettings';
import { SupportedCurrency, ExchangeRateSettings } from '@/lib/api/types';
import {
  convertCurrency,
  formatCurrency,
  roundInvoiceTotal
} from '@/lib/utils/currency';
import { apiClient } from '@/lib/api/apiClient';

export function useCurrency() {
  const { settings } = useCompanySettings();
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('JMD');
  const [exchangeRateSettings, setExchangeRateSettings] = useState<ExchangeRateSettings | null>(null);
  
  // Load exchange rate settings from API
  useEffect(() => {
    async function fetchExchangeRateSettings() {
      try {
        const settingsData: any = await apiClient.get('/company-settings');
        if (settingsData?.exchangeRateSettings) {
          console.log('Loaded exchange rate settings:', settingsData.exchangeRateSettings);
          setExchangeRateSettings(settingsData.exchangeRateSettings);
        } else {
          console.warn('No exchange rate settings found in API response');
        }
      } catch (error) {
        console.error('Failed to load exchange rate settings:', error);
      }
    }
    
    fetchExchangeRateSettings();
  }, []);
  
  // Load saved currency preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('selectedCurrency') as SupportedCurrency;
      if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'JMD')) {
        setSelectedCurrency(savedCurrency);
      } else {
        setSelectedCurrency('JMD'); // Default to JMD if no saved preference
      }
    }
  }, []);
  
  // Use settings from props if available
  useEffect(() => {
    if (settings?.exchangeRateSettings) {
      console.log('Updated exchange rate settings from props:', settings.exchangeRateSettings);
      setExchangeRateSettings(settings.exchangeRateSettings);
    }
  }, [settings?.exchangeRateSettings]);
  
  // Save currency preference to localStorage whenever it changes
  const handleCurrencyChange = (currency: SupportedCurrency) => {
    console.log('Currency changed to:', currency);
    setSelectedCurrency(currency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCurrency', currency);
    }
  };
  
  // Convert amount from USD to the selected currency
  const convert = (amount: number, fromCurrency: SupportedCurrency = 'USD'): number => {
    // If currencies are the same, no conversion needed
    if (fromCurrency === selectedCurrency) {
      return amount;
    }
    
    // If no exchange rate settings, return original amount
    if (!exchangeRateSettings || !exchangeRateSettings.exchangeRate) {
      console.warn('No exchange rate settings available for conversion');
      return amount;
    }
    
    return convertCurrency(
      amount,
      fromCurrency,
      selectedCurrency,
      exchangeRateSettings
    );
  };
  
  // Format amount in the selected currency
  const format = (amount: number): string => {
    return formatCurrency(amount, selectedCurrency);
  };
  
  // Convert and format in one step
  const convertAndFormat = (amount: number, fromCurrency: SupportedCurrency = 'USD', returnNumeric: boolean = false): string | number => {
    let convertedAmount: number;

    // If currencies are the same, just format
    if (fromCurrency === selectedCurrency) {
      convertedAmount = amount;
    } else if (!exchangeRateSettings || !exchangeRateSettings.exchangeRate) {
      // If no exchange rate settings, use original amount
      console.warn('No exchange rate settings available for conversion');
      convertedAmount = amount;
    } else {
      // Convert the amount
      console.log('Converting and formatting:', {
        amount,
        fromCurrency,
        toCurrency: selectedCurrency,
        rate: exchangeRateSettings.exchangeRate
      });

      convertedAmount = convertCurrency(
        amount,
        fromCurrency,
        selectedCurrency,
        exchangeRateSettings
      );
    }

    // Return numeric value if requested
    if (returnNumeric) {
      return convertedAmount;
    }

    // Return formatted string
    return formatCurrency(convertedAmount, selectedCurrency);
  };

  // Convert, round, and format invoice total (ensures totals are always rounded)
  const convertAndFormatInvoiceTotal = (amount: number, fromCurrency: SupportedCurrency = 'USD'): string => {
    // Convert to selected currency
    let convertedAmount = convert(amount, fromCurrency);

    // Round based on target currency (JMD: nearest 100, USD: nearest 10)
    convertedAmount = roundInvoiceTotal(convertedAmount, selectedCurrency);

    // Format for display
    return format(convertedAmount);
  };

  // Format invoice total using the rounded value from feeBreakdown if available
  // This prevents floating-point errors from currency conversion
  const formatInvoiceTotal = (invoice: any): string => {
    // Check if invoice has rounded total in feeBreakdown
    if (invoice.feeBreakdown?.roundedTotal && invoice.feeBreakdown?.displayCurrency) {
      const roundedTotal = invoice.feeBreakdown.roundedTotal;
      const displayCurrency = invoice.feeBreakdown.displayCurrency as SupportedCurrency;

      // If rounded total is in selected currency, format it directly
      if (displayCurrency === selectedCurrency) {
        return format(roundedTotal);
      }

      // Otherwise convert and format
      return convertAndFormat(roundedTotal, displayCurrency);
    }

    // Fallback: convert totalAmount from storage currency (USD)
    return convertAndFormat(Number(invoice.totalAmount) || 0, 'USD');
  };

  return {
    selectedCurrency,
    setSelectedCurrency: handleCurrencyChange,
    convert,
    format,
    convertAndFormat,
    convertAndFormatInvoiceTotal,
    formatInvoiceTotal,
    exchangeRateSettings
  };
} 