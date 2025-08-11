'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calculator } from 'lucide-react';

interface FeeCalculationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCalculateFees: () => void;
  onSkipFees: () => void;
  packageCount: number;
}

export function FeeCalculationDialog({
  open,
  onOpenChange,
  onCalculateFees,
  onSkipFees,
  packageCount
}: FeeCalculationDialogProps) {
  const handleCalculateFees = () => {
    onCalculateFees();
    onOpenChange(false);
  };

  const handleSkipFees = () => {
    onSkipFees();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Calculate Package Fees?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You've added {packageCount} package{packageCount > 1 ? 's' : ''} to this invoice. 
            Would you like to automatically calculate and add line items based on your currently configured fees?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSkipFees}>
            Skip Fee Calculation
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleCalculateFees}>
            Calculate Fees
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}