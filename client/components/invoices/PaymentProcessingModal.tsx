import React, { useState } from 'react';
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

  // Form state
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [paymentAmount, setPaymentAmount] = useState(initialAmount);
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (open && initialAmount) {
      setPaymentAmount(initialAmount);
    }
  }, [open, initialAmount]);

  const handleProcessPayment = () => {
    if (!invoiceId || !userId) return;
    
    // Validate amount - must be a positive number
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return;
    }

    processPayment(
      {
        invoiceId,
        paymentData: {
          userId,
          amount,
          paymentMethod: paymentMethod as any,
          transactionId: transactionId || undefined,
          notes: paymentNotes || undefined,
          status: "completed" // Mark as completed immediately
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
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
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