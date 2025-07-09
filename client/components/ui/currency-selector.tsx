"use client";

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupportedCurrency } from "@/lib/api/types";
import { getCurrencyOptions } from "@/lib/utils/currency";

interface CurrencySelectorProps {
  value: SupportedCurrency;
  onValueChange: (currency: SupportedCurrency) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function CurrencySelector({ 
  value, 
  onValueChange, 
  disabled = false,
  className = "",
  size = "default"
}: CurrencySelectorProps) {
  const currencyOptions = getCurrencyOptions();

  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-10 text-sm",
    lg: "h-12 text-base"
  };

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={`w-[120px] ${sizeClasses[size]} ${className}`}>
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {currencyOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 