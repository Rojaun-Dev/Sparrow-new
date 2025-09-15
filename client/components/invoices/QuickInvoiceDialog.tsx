import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useGenerateInvoice } from '@/hooks/useInvoices';
import { useInvoiceByPackageId } from '@/hooks/useInvoices';
import { usePackage } from '@/hooks/usePackages';
import { useToast } from "@/hooks/use-toast";
import { PackageStatusUpdateDialog } from '@/components/packages/PackageStatusUpdateDialog';
import { DutyFeeModal } from '@/components/duty-fee-modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dutyFeeService, DutyFee } from '@/lib/api/dutyFeeService';
import { Plus, Edit2, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schema for invoice details
const invoiceFormSchema = z.object({
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  sendNotification: z.boolean().default(true),
});

// Line item interface (for UI only)
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface QuickInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string | null;
  userId: string | null;
  onSuccess?: () => void;
}

export function QuickInvoiceDialog({
  open,
  onOpenChange,
  packageId,
  userId,
  onSuccess
}: QuickInvoiceDialogProps) {
  // Dialog state management
  const [currentStep, setCurrentStep] = useState(1);
  const [showPackageStatusDialog, setShowPackageStatusDialog] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  // Duty fee management
  const [showDutyFeeModal, setShowDutyFeeModal] = useState(false);
  const [editingDutyFee, setEditingDutyFee] = useState<DutyFee | null>(null);

  // Custom line items state
  const [customLineItems, setCustomLineItems] = useState<LineItem[]>([]);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState<number | null>(null);

  // API hooks
  const { data: relatedInvoice, isLoading: isLoadingRelatedInvoice } = useInvoiceByPackageId(packageId || '');
  const { data: packageData } = usePackage(packageId || '');
  const generateInvoice = useGenerateInvoice();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch duty fees for the package
  const { data: dutyFees, isLoading: isDutyFeesLoading } = useQuery({
    queryKey: ['duty-fees', packageId],
    queryFn: () => dutyFeeService.getDutyFeesByPackageId(packageId!),
    enabled: !!packageId && open,
  });

  // Form handling
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      notes: '',
      sendNotification: true,
    },
  });

  const { register, handleSubmit, formState: { errors }, reset, watch } = form;

  // Reset form and state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setCustomLineItems([]);
      setEditingDutyFee(null);
      setEditingLineItemIndex(null);
      reset();
    }
  }, [open, reset]);

  // Custom line item management
  const addCustomLineItem = () => {
    const newItem: LineItem = {
      id: `custom-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setCustomLineItems(prev => [...prev, newItem]);
    setEditingLineItemIndex(customLineItems.length);
  };

  const updateCustomLineItem = (index: number, updates: Partial<LineItem>) => {
    setCustomLineItems(prev =>
      prev.map((item, i) => i === index ? { ...item, ...updates } : item)
    );
  };

  const removeCustomLineItem = (index: number) => {
    setCustomLineItems(prev => prev.filter((_, i) => i !== index));
    setEditingLineItemIndex(null);
  };

  // Duty fee handlers
  const handleEditDutyFee = (fee: DutyFee) => {
    setEditingDutyFee(fee);
    setShowDutyFeeModal(true);
  };

  const handleDeleteDutyFee = async (feeId: string) => {
    try {
      await dutyFeeService.deleteDutyFee(feeId);
      queryClient.invalidateQueries({ queryKey: ['duty-fees', packageId] });
      toast({
        title: "Success",
        description: "Duty fee deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete duty fee",
        variant: "destructive",
      });
    }
  };

  // Calculate totals
  const calculateDutyFeeTotal = (currency: 'USD' | 'JMD') => {
    if (!dutyFees) return 0;
    return dutyFees
      .filter(fee => fee.currency === currency)
      .reduce((sum, fee) => sum + Number(fee.amount), 0);
  };

  const calculateCustomLineItemTotal = () => {
    return customLineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  // Navigation functions
  const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const goToPrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Final invoice generation
  const onSubmit = async (data: InvoiceFormValues) => {
    const payload = {
      userId,
      packageIds: [packageId],
      notes: data.notes,
      dueDate: new Date(data.dueDate),
      sendNotification: data.sendNotification,
      generateFees: true, // This will automatically include duty fees
      customLineItems: customLineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        packageId: packageId, // Associate with the package
        isTax: false, // Custom line items are not tax by default
      })),
    };

    generateInvoice.mutate(payload, {
      onSuccess: (invoice: any) => {
        onOpenChange(false);
        setGeneratedInvoice(invoice);

        toast({
          title: 'Invoice created',
          description: 'The invoice was successfully created.'
        });

        // Show package status update dialog
        setShowPackageStatusDialog(true);

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error?.message || 'Failed to create invoice',
          variant: 'destructive'
        });
      },
    });
  };

  if (!packageId || !userId) return null;
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Quick Invoice - Step {currentStep} of 3
              {packageData && (
                <span className="text-base font-normal text-gray-600 ml-2">
                  ({packageData.trackingNumber})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoadingRelatedInvoice ? (
            <div className="p-4">
              <p>Checking for existing invoice...</p>
            </div>
          ) : relatedInvoice ? (
            <div className="p-4">
              <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-4">
                This package already has an invoice. You cannot generate another invoice for it.
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
              {/* Step 1: Basic Invoice Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Configure basic invoice details for package: <span className="font-semibold">{packageData?.trackingNumber}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">Due Date</Label>
                      <Input
                        {...register("dueDate")}
                        type="date"
                        className="mt-1"
                      />
                      {errors.dueDate && (
                        <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
                      <Textarea
                        {...register("notes")}
                        placeholder="Additional notes for this invoice..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        {...register("sendNotification")}
                        type="checkbox"
                        id="sendNotification"
                        className="rounded"
                      />
                      <Label htmlFor="sendNotification" className="text-sm font-medium text-gray-700">Send notification to customer</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Duty Fees */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Duty Fees</h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingDutyFee(null);
                        setShowDutyFeeModal(true);
                      }}
                      disabled={!packageData || packageData.status === 'ready_for_pickup' || packageData.status === 'delivered'}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Duty Fee
                    </Button>
                  </div>

                  {isDutyFeesLoading ? (
                    <p className="text-sm text-gray-500">Loading duty fees...</p>
                  ) : !dutyFees || dutyFees.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No duty fees added yet.</p>
                      <p className="text-sm">Click "Add Duty Fee" to create fees for this package.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dutyFees.map((fee) => (
                        <div key={fee.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">
                              {fee.feeType === 'Other' && fee.customFeeType ? fee.customFeeType : fee.feeType}
                            </div>
                            <div className="text-sm text-gray-600">
                              {fee.currency} {Number(fee.amount).toFixed(2)}
                              {fee.description && ` - ${fee.description}`}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDutyFee(fee)}
                              disabled={!packageData || packageData.status === 'ready_for_pickup' || packageData.status === 'delivered'}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDutyFee(fee.id)}
                              disabled={!packageData || packageData.status === 'ready_for_pickup' || packageData.status === 'delivered'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Duty Fee Summary */}
                      <Separator />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>USD Total: ${calculateDutyFeeTotal('USD').toFixed(2)}</strong>
                        </div>
                        <div>
                          <strong>JMD Total: J${calculateDutyFeeTotal('JMD').toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Custom Line Items */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Custom Line Items</h3>
                    <Button type="button" size="sm" onClick={addCustomLineItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line Item
                    </Button>
                  </div>

                  {customLineItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No custom line items added.</p>
                      <p className="text-sm">Click "Add Line Item" to create additional charges or services.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customLineItems.map((item, index) => (
                        <div key={item.id} className="p-3 border rounded-lg">
                          {editingLineItemIndex === index ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="md:col-span-2">
                                <Label>Description</Label>
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateCustomLineItem(index, { description: e.target.value })}
                                  placeholder="Item description"
                                />
                              </div>
                              <div>
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateCustomLineItem(index, { quantity: parseInt(e.target.value) || 1 })}
                                />
                              </div>
                              <div>
                                <Label>Unit Price (USD)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => updateCustomLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="flex items-end space-x-2 md:col-span-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => setEditingLineItemIndex(null)}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeCustomLineItem(index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{item.description || 'Untitled Item'}</div>
                                <div className="text-sm text-gray-600">
                                  {item.quantity} × ${item.unitPrice.toFixed(2)} = ${(item.quantity * item.unitPrice).toFixed(2)}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingLineItemIndex(index)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCustomLineItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Line Items Summary */}
                      <Separator />
                      <div className="text-sm">
                        <strong>Total: ${calculateCustomLineItemTotal().toFixed(2)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review and Generate */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Review Invoice</h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Package</h4>
                      <p className="text-sm">{packageData?.trackingNumber} - {packageData?.description}</p>
                    </div>

                    {dutyFees && dutyFees.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Duty Fees ({dutyFees.length})</h4>
                        <div className="text-sm space-y-1">
                          <div>USD: ${calculateDutyFeeTotal('USD').toFixed(2)}</div>
                          <div>JMD: J${calculateDutyFeeTotal('JMD').toFixed(2)}</div>
                        </div>
                      </div>
                    )}

                    {customLineItems.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Custom Line Items ({customLineItems.length})</h4>
                        <div className="text-sm">
                          <div>Total: ${calculateCustomLineItemTotal().toFixed(2)}</div>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Invoice Details</h4>
                      <div className="text-sm space-y-1">
                        <div>Due Date: {watch('dueDate')}</div>
                        <div>Send Notification: {watch('sendNotification') ? 'Yes' : 'No'}</div>
                        {watch('notes') && <div>Notes: {watch('notes')}</div>}
                      </div>
                    </div>
                  </div>

                  {generateInvoice.isError && (
                    <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                      {generateInvoice.error instanceof Error ? generateInvoice.error.message : 'Failed to generate invoice.'}
                    </div>
                  )}
                </div>
              )}

              {/* Dialog Footer with Navigation */}
              <DialogFooter className="flex justify-between">
                <div className="flex space-x-2">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={goToPrevStep}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>

                  {currentStep < 4 ? (
                    <Button type="button" onClick={goToNextStep}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={generateInvoice.isPending}>
                      {generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Duty Fee Modal */}
      <DutyFeeModal
        isOpen={showDutyFeeModal}
        onClose={() => {
          setShowDutyFeeModal(false);
          setEditingDutyFee(null);
        }}
        packageId={packageId!}
        packageStatus={packageData?.status || ''}
        editingFee={editingDutyFee}
        hasInvoice={!!relatedInvoice}
      />

      {/* Package Status Update Dialog */}
      <PackageStatusUpdateDialog
        open={showPackageStatusDialog}
        onOpenChange={setShowPackageStatusDialog}
        packages={packageData ? [{
          id: packageData.id,
          trackingNumber: packageData.trackingNumber,
          description: packageData.description,
          weight: packageData.weight
        }] : []}
        onComplete={() => {
          setShowPackageStatusDialog(false);
          // Navigate to the invoice details page
          if (generatedInvoice && generatedInvoice.id) {
            router.push(`/admin/invoices/${generatedInvoice.id}`);
          }
        }}
      />
    </>
  );
} 