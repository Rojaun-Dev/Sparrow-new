"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedCurrency } from '@/lib/api/types';

interface CurrencyContextType {
  selectedCurrency: SupportedCurrency;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');

  // Load saved currency preference from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency') as SupportedCurrency;
    if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'JMD')) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);

  // Save currency preference to localStorage whenever it changes
  const handleSetSelectedCurrency = (currency: SupportedCurrency) => {
    setSelectedCurrency(currency);
    localStorage.setItem('selectedCurrency', currency);
  };

  return (
    <CurrencyContext.Provider 
      value={{
        selectedCurrency,
        setSelectedCurrency: handleSetSelectedCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
} 