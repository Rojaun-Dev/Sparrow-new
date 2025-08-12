'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { SupportedCurrency } from '@/lib/api/types';

interface CurrencyMismatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceCurrency: SupportedCurrency;
  feeCurrency: SupportedCurrency;
  onChangeInvoiceCurrency: () => void;
  onConvertFees: () => void;
  affectedFeesCount: number;
}

export function CurrencyMismatchDialog({
  isOpen,
  onClose,
  invoiceCurrency,
  feeCurrency,
  onChangeInvoiceCurrency,
  onConvertFees,
  affectedFeesCount
}: CurrencyMismatchDialogProps) {
  const getCurrencySymbol = (currency: SupportedCurrency) => {
    return currency === 'USD' ? '$' : 'J$';
  };

  const getCurrencyName = (currency: SupportedCurrency) => {
    return currency === 'USD' ? 'US Dollar' : 'Jamaican Dollar';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Currency Mismatch Detected
          </DialogTitle>
          <DialogDescription>
            There's a currency mismatch between your invoice and the generated fees.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{affectedFeesCount}</strong> fee{affectedFeesCount > 1 ? 's' : ''} from the selected package{affectedFeesCount > 1 ? 's' : ''} 
              {affectedFeesCount > 1 ? ' are' : ' is'} in <strong>{getCurrencyName(feeCurrency)} ({getCurrencySymbol(feeCurrency)})</strong>, 
              but your invoice is set to <strong>{getCurrencyName(invoiceCurrency)} ({getCurrencySymbol(invoiceCurrency)})</strong>.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              How would you like to resolve this currency mismatch?
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Option 1: Change Invoice Currency</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Change your invoice currency from {getCurrencyName(invoiceCurrency)} to {getCurrencyName(feeCurrency)} to match the fees.
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Option 2: Convert Fees</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Convert the fee amounts from {getCurrencyName(feeCurrency)} to {getCurrencyName(invoiceCurrency)} using the current exchange rate.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onConvertFees}>
            Convert Fees to {getCurrencySymbol(invoiceCurrency)}
          </Button>
          <Button onClick={onChangeInvoiceCurrency}>
            Change Invoice to {getCurrencySymbol(feeCurrency)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}