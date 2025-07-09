import React, { useState, useEffect } from 'react';
import { useProcessPayment } from '@/hooks/usePayments';
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";
import { SupportedCurrency } from "@/lib/api/types";

interface PaymentProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
  userId: string;
  initialAmount?: string;
  companyId?: string;
  onSuccess?: () => void;
}

export function PaymentProcessingModal({
  open,
  onOpenChange,
  invoiceId,
  userId,
  initialAmount = '',
  companyId,
  onSuccess
}: PaymentProcessingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: processPayment, isPending: isProcessingPayment } = useProcessPayment();
  const { selectedCurrency, setSelectedCurrency, convert, convertAndFormat } = useCurrency();

  // Form state
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [paymentAmount, setPaymentAmount] = useState(initialAmount);
  const [originalAmountUSD, setOriginalAmountUSD] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open && initialAmount) {
      const parsedAmount = parseFloat(initialAmount);
      setPaymentAmount(initialAmount);
      
      // Store the original USD amount for currency conversions
      if (!isNaN(parsedAmount)) {
        setOriginalAmountUSD(parsedAmount);
      }
    }
  }, [open, initialAmount]);

  // Update payment amount when currency changes
  useEffect(() => {
    if (originalAmountUSD !== null) {
      if (selectedCurrency === 'USD') {
        setPaymentAmount(originalAmountUSD.toFixed(2));
      } else {
        // Convert from USD to JMD
        const convertedAmount = convert(originalAmountUSD);
        setPaymentAmount(convertedAmount.toFixed(2));
      }
    }
  }, [selectedCurrency, originalAmountUSD, convert]);

  // Handle currency change
  const handleCurrencyChange = (currency: SupportedCurrency) => {
    // Store current amount in USD before changing currency
    const currentAmount = parseFloat(paymentAmount);
    if (!isNaN(currentAmount) && originalAmountUSD === null) {
      // If this is the first currency change, store the original amount
      if (selectedCurrency === 'USD') {
        setOriginalAmountUSD(currentAmount);
      } else {
        // Convert current JMD amount to USD for storage
        const usdAmount = convert(currentAmount, selectedCurrency);
        setOriginalAmountUSD(usdAmount);
      }
    }
    
    setSelectedCurrency(currency);
  };

  // Convert amount back to USD when processing payment
  const getUSDAmount = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) return 0;
    
    // If currency is already USD, no conversion needed
    if (selectedCurrency === 'USD') return amount;
    
    // Convert from JMD to USD
    return convert(amount, selectedCurrency);
  };

  const handleProcessPayment = () => {
    if (!invoiceId || !userId) return;
    
    // Get amount in USD for processing
    const amount = getUSDAmount();
    
    // Validate amount - must be a positive number
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return;
    }

    // Prepare meta data with currency information
    const meta = {
      currency: selectedCurrency,
      displayAmount: parseFloat(paymentAmount),
      exchangeRate: selectedCurrency === 'USD' ? 1 : convert(1),
      originalAmount: parseFloat(paymentAmount),
      convertedAmount: amount,
      baseCurrency: 'USD',
      paymentProcessedAt: new Date().toISOString()
    };

    processPayment(
      {
        invoiceId,
        paymentData: {
          userId,
          amount,
          paymentMethod: paymentMethod as any,
          transactionId: transactionId || undefined,
          notes: paymentNotes || undefined,
          status: "completed", // Mark as completed immediately
          meta: meta // Include meta data with currency information
          // Don't set paymentDate, let backend handle it as a Date object
        },
        sendNotification
      },
      {
        onSuccess: () => {
          toast({
            title: "Payment successful",
            description: "The payment has been processed successfully",
            variant: "default"
          });
          onOpenChange(false);
          
          // Reset form
          setPaymentAmount(initialAmount);
          setTransactionId("");
          setPaymentNotes("");
          setOriginalAmountUSD(null);
          
          // Invalidate relevant queries if companyId is provided
          if (companyId) {
            queryClient.invalidateQueries({ queryKey: ['admin-user-invoices', companyId, userId], exact: false });
            queryClient.invalidateQueries({ queryKey: ['admin-user-payments', companyId, userId], exact: false });
          }
          
          // Call success callback if provided
          if (onSuccess) {
            onSuccess();
          }
        },
        onError: (error) => {
          toast({
            title: "Payment failed",
            description: error instanceof Error ? error.message : "An error occurred while processing the payment",
            variant: "destructive"
          });
        }
      }
    );
  };

  // Don't render if no invoice ID
  if (!invoiceId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Invoice Payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="amount">Amount</Label>
              <Select
                value={selectedCurrency}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="JMD">JMD (J$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={paymentAmount}
              readOnly
              className="bg-gray-50"
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction reference"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Add payment notes"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendNotification"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="sendNotification"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Notify customer about this payment
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcessPayment} 
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? "Processing..." : "Process Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 