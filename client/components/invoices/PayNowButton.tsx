"use client"

import React, { useState } from "react"
import { CreditCard, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { SupportedCurrency } from "@/lib/api/types"
import { usePayWiPay, usePaymentAvailability } from "@/hooks/usePayWiPay"
import { useCompanySettings } from "@/hooks/useCompanySettings"

interface PayNowButtonProps {
  invoice: any;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showCurrencySelector?: boolean;
  currency?: SupportedCurrency;
}

export function PayNowButton({ 
  invoice, 
  variant = "default",
  size = "default",
  className = "",
  showCurrencySelector = true,
  currency = 'USD'
}: PayNowButtonProps) {
  const { initiate, isLoading, error } = usePayWiPay();
  const { data: paymentSettings, isLoading: isLoadingPaymentSettings } = usePaymentAvailability();
  const [showError, setShowError] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);
  const { settings } = useCompanySettings();
  
  // Update selectedCurrency when currency prop changes
  React.useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);
  
  // Check if WiPay is enabled in company settings
  const isWiPayEnabled = paymentSettings?.isEnabled;
  
  // Check if exchange rate is available
  const hasExchangeRate = settings?.exchangeRateSettings?.exchangeRate && settings?.exchangeRateSettings?.exchangeRate > 0;
  
  const handlePayment = async () => {
    if (!isWiPayEnabled) {
      setShowError(true);
      return;
    }
    
    try {
      await initiate({
        invoiceId: invoice.id,
        origin: 'SparrowX-Customer-Portal',
        currency: selectedCurrency
      });
    } catch (err) {
      console.error("Payment initiation error:", err);
      setShowError(true);
    }
  };
  
  if (isLoadingPaymentSettings) {
    return (
      <div className="space-y-2">
        <Skeleton className={`h-10 ${size === "sm" ? "w-24" : "w-32"}`} />
        {showCurrencySelector && <Skeleton className="h-4 w-20" />}
      </div>
    );
  }
  
  if (!isWiPayEnabled) {
    return (
      <div className="space-y-2">
        <Button 
          className={className}
          variant="outline" 
          size={size}
          disabled
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Payment Not Available
        </Button>
        {showCurrencySelector && (
          <div className="text-xs text-muted-foreground text-center">
            Online payments are not enabled
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {showError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "There was a problem initiating the payment. Please try again or contact support."}
          </AlertDescription>
        </Alert>
      )}
      
      {showCurrencySelector && hasExchangeRate && (
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Select Payment Currency
          </label>
          <Select 
            value={selectedCurrency}
            onValueChange={(value) => setSelectedCurrency(value as SupportedCurrency)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="JMD">JMD (J$)</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-xs text-muted-foreground mt-1">
            {selectedCurrency === 'JMD' ? (
              <>Exchange rate: $1 USD = J${settings?.exchangeRateSettings?.exchangeRate ?? 150} JMD</>
            ) : (
              <>Prices shown in USD</>
            )}
          </div>
        </div>
      )}
      
      <Button 
        className={className}
        variant={variant}
        size={size}
        onClick={handlePayment} 
        disabled={isLoading}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {isLoading ? "Processing..." : `Pay Now${showCurrencySelector ? ` (${selectedCurrency})` : ""}`}
      </Button>
      
      {showCurrencySelector && (
        <div className="text-xs text-muted-foreground text-center">
          Secure payment processing provided by WiPay
        </div>
      )}
    </div>
  );
}