"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dutyFeeService, DUTY_FEE_TYPES, CreateDutyFeeRequest, UpdateDutyFeeRequest, DutyFee } from "@/lib/api/dutyFeeService";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const dutyFeeSchema = z.object({
  feeType: z.enum(DUTY_FEE_TYPES, {
    errorMap: () => ({ message: "Please select a valid fee type" })
  }),
  customFeeType: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.enum(['USD', 'JMD'], {
    errorMap: () => ({ message: "Please select a valid currency" })
  }),
  description: z.string().optional(),
}).refine((data) => {
  // If feeType is 'Other', customFeeType is required
  if (data.feeType === 'Other' && (!data.customFeeType || data.customFeeType.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Custom fee type is required when fee type is 'Other'",
  path: ["customFeeType"],
});

type DutyFeeFormValues = z.infer<typeof dutyFeeSchema>;

interface DutyFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageStatus: string;
  editingFee?: DutyFee | null;
  onDelete?: (feeId: string) => void;
  hasInvoice?: boolean;
}

export function DutyFeeModal({ isOpen, onClose, packageId, packageStatus, editingFee, onDelete, hasInvoice }: DutyFeeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if package allows duty fee modifications
  const restrictedStatuses = ['ready_for_pickup', 'delivered'];
  const canModifyFees = !restrictedStatuses.includes(packageStatus) && !hasInvoice;

  const form = useForm<DutyFeeFormValues>({
    resolver: zodResolver(dutyFeeSchema),
    defaultValues: editingFee ? {
      feeType: editingFee.feeType as any,
      customFeeType: editingFee.customFeeType || '',
      amount: parseFloat(editingFee.amount.toString()),
      currency: editingFee.currency,
      description: editingFee.description || '',
    } : {
      feeType: 'Electronics',
      customFeeType: '',
      amount: 0,
      currency: 'USD',
      description: '',
    },
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = form;
  const selectedFeeType = watch('feeType');

  // Reset form when editing fee changes
  useEffect(() => {
    if (editingFee) {
      reset({
        feeType: editingFee.feeType as any,
        customFeeType: editingFee.customFeeType || '',
        amount: parseFloat(editingFee.amount.toString()),
        currency: editingFee.currency,
        description: editingFee.description || '',
      });
    } else {
      reset({
        feeType: 'Electronics',
        customFeeType: '',
        amount: 0,
        currency: 'USD',
        description: '',
      });
    }
  }, [editingFee, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: DutyFeeFormValues) => {
      if (editingFee) {
        const updateData: UpdateDutyFeeRequest = {
          feeType: data.feeType,
          customFeeType: data.feeType === 'Other' ? data.customFeeType : undefined,
          amount: data.amount,
          currency: data.currency,
          description: data.description || undefined,
        };
        return dutyFeeService.updateDutyFee(editingFee.id, updateData);
      } else {
        const createData: CreateDutyFeeRequest = {
          packageId,
          feeType: data.feeType,
          customFeeType: data.feeType === 'Other' ? data.customFeeType : undefined,
          amount: data.amount,
          currency: data.currency,
          description: data.description || undefined,
        };
        return dutyFeeService.createDutyFee(createData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingFee ? "Duty fee has been updated successfully." : "Duty fee has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['duty-fees', packageId] });
      queryClient.invalidateQueries({ queryKey: ['package', packageId] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (editingFee ? "Failed to update duty fee." : "Failed to add duty fee."),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (feeId: string) => dutyFeeService.deleteDutyFee(feeId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Duty fee has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['duty-fees', packageId] });
      queryClient.invalidateQueries({ queryKey: ['package', packageId] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete duty fee.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DutyFeeFormValues) => {
    saveMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDelete = () => {
    if (editingFee && onDelete) {
      onDelete(editingFee.id);
    } else if (editingFee) {
      deleteMutation.mutate(editingFee.id);
    }
  };

  if (!canModifyFees) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cannot Modify Duty Fees</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {hasInvoice 
                ? "Duty fees cannot be modified for packages that have an associated invoice."
                : "Duty fees cannot be modified for packages that are ready for pickup or already delivered."
              }
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingFee ? 'Edit Duty Fee' : 'Add Duty Fee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="feeType">Fee Type</Label>
            <select
              {...register("feeType")}
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              {DUTY_FEE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.feeType && (
              <p className="text-red-600 text-sm mt-1">{errors.feeType.message}</p>
            )}
          </div>

          {selectedFeeType === 'Other' && (
            <div>
              <Label htmlFor="customFeeType">Custom Fee Type</Label>
              <Input
                {...register("customFeeType")}
                placeholder="Enter custom fee type"
                className="mt-1"
              />
              {errors.customFeeType && (
                <p className="text-red-600 text-sm mt-1">{errors.customFeeType.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              {...register("amount")}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="mt-1"
            />
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              {...register("currency")}
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="USD">USD</option>
              <option value="JMD">JMD</option>
            </select>
            {errors.currency && (
              <p className="text-red-600 text-sm mt-1">{errors.currency.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              {...register("description")}
              placeholder="Additional details about this fee"
              className="mt-1"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-between items-center">
            <div className="flex gap-2">
              {editingFee && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={saveMutation.isPending || deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending || deleteMutation.isPending}>
                {saveMutation.isPending ? (editingFee ? "Updating..." : "Adding...") : (editingFee ? "Update Duty Fee" : "Add Duty Fee")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}