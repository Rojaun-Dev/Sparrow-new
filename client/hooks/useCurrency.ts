import { useState, useEffect } from 'react';
import { useCompanySettings } from './useCompanySettings';
import { SupportedCurrency, ExchangeRateSettings } from '@/lib/api/types';
import { 
  convertCurrency, 
  formatCurrency, 
  convertAndFormatCurrency 
} from '@/lib/utils/currency';
import { apiClient } from '@/lib/api/apiClient';

export function useCurrency() {
  const { settings } = useCompanySettings();
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');
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
  const convertAndFormat = (amount: number, fromCurrency: SupportedCurrency = 'USD'): string => {
    // If currencies are the same, just format
    if (fromCurrency === selectedCurrency) {
      return formatCurrency(amount, selectedCurrency);
    }
    
    // If no exchange rate settings, just format in original currency
    if (!exchangeRateSettings || !exchangeRateSettings.exchangeRate) {
      console.warn('No exchange rate settings available for conversion');
      return formatCurrency(amount, fromCurrency);
    }
    
    console.log('Converting and formatting:', { 
      amount, 
      fromCurrency, 
      toCurrency: selectedCurrency, 
      rate: exchangeRateSettings.exchangeRate 
    });
    
    return convertAndFormatCurrency(
      amount,
      fromCurrency,
      selectedCurrency,
      exchangeRateSettings
    );
  };
  
  return {
    selectedCurrency,
    setSelectedCurrency: handleCurrencyChange,
    convert,
    format,
    convertAndFormat,
    exchangeRateSettings
  };
} 