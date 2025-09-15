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
import { useCurrency } from '@/hooks/useCurrency';
import { SupportedCurrency } from '@/lib/api/types';
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
  currency: SupportedCurrency;
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

  // Currency management
  const { selectedCurrency, convertAndFormat, convert } = useCurrency();

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
      currency: selectedCurrency, // Use current selected currency
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

  const calculateCustomLineItemTotal = (currency: SupportedCurrency) => {
    return customLineItems
      .filter(item => item.currency === currency)
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  // Navigation functions
  const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const goToPrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Final invoice generation
  const onSubmit = async (data: InvoiceFormValues) => {
    // Convert all custom line items to USD for backend consistency
    const convertedCustomLineItems = customLineItems.map(item => {
      const unitPriceInUSD = item.currency === 'USD'
        ? item.unitPrice
        : convert ? convert(item.unitPrice, item.currency) : item.unitPrice;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: unitPriceInUSD,
        packageId: packageId, // Associate with the package
        isTax: false, // Custom line items are not tax by default
      };
    });

    const payload = {
      userId,
      packageIds: [packageId],
      notes: data.notes,
      dueDate: new Date(data.dueDate),
      sendNotification: data.sendNotification,
      generateFees: true, // This will automatically include duty fees
      customLineItems: convertedCustomLineItems,
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

              {/* Step 2: Duty Fees & Custom Line Items */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  {/* Duty Fees Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Duty Fees</h3>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
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
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="font-medium">No duty fees added yet</p>
                        <p className="text-sm">Click "Add Duty Fee" to create fees for this package</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dutyFees.map((fee) => (
                          <div key={fee.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {fee.feeType === 'Other' && fee.customFeeType ? fee.customFeeType : fee.feeType}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-semibold">{fee.currency} {Number(fee.amount).toFixed(2)}</span>
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
                                className="text-gray-600 hover:text-blue-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDutyFee(fee.id)}
                                disabled={!packageData || packageData.status === 'ready_for_pickup' || packageData.status === 'delivered'}
                                className="text-gray-600 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Duty Fee Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-blue-900">USD Total: ${calculateDutyFeeTotal('USD').toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-blue-900">JMD Total: J${calculateDutyFeeTotal('JMD').toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Additional Charges</span>
                    </div>
                  </div>

                  {/* Custom Line Items Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Custom Line Items</h3>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addCustomLineItem}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Line Item
                      </Button>
                    </div>

                    {customLineItems.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="font-medium">No custom line items added</p>
                        <p className="text-sm">Click "Add Line Item" to create additional charges or services</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customLineItems.map((item, index) => (
                          <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                            {editingLineItemIndex === index ? (
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                                  <Input
                                    value={item.description}
                                    onChange={(e) => updateCustomLineItem(index, { description: e.target.value })}
                                    placeholder="Item description"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Currency</Label>
                                    <Select
                                      value={item.currency}
                                      onValueChange={(value: SupportedCurrency) => updateCustomLineItem(index, { currency: value })}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="JMD">JMD (J$)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Quantity</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateCustomLineItem(index, { quantity: parseInt(e.target.value) || 1 })}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">Unit Price ({item.currency})</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.unitPrice}
                                      onChange={(e) => updateCustomLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setEditingLineItemIndex(null)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeCustomLineItem(index)}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{item.description || 'Untitled Item'}</div>
                                  <div className="text-sm text-gray-600">
                                    {item.quantity} × {item.currency === 'USD' ? '$' : 'J$'}{item.unitPrice.toFixed(2)} = <span className="font-semibold">{item.currency === 'USD' ? '$' : 'J$'}{(item.quantity * item.unitPrice).toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingLineItemIndex(index)}
                                    className="text-gray-600 hover:text-blue-600"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCustomLineItem(index)}
                                    className="text-gray-600 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Line Items Summary */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-green-900">USD Total: ${calculateCustomLineItemTotal('USD').toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-green-900">JMD Total: J${calculateCustomLineItemTotal('JMD').toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review and Generate */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Review Invoice</h3>
                    <p className="text-sm text-gray-600 mt-1">Please review all details before generating the invoice</p>
                  </div>

                  <div className="space-y-4">
                    {/* Package Info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Package Information</h4>
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">{packageData?.trackingNumber}</span>
                        {packageData?.description && ` - ${packageData.description}`}
                      </p>
                    </div>

                    {/* Duty Fees Summary */}
                    {dutyFees && dutyFees.length > 0 && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2">Duty Fees ({dutyFees.length} items)</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-purple-800">
                            <span className="font-medium">USD: ${calculateDutyFeeTotal('USD').toFixed(2)}</span>
                          </div>
                          <div className="text-purple-800">
                            <span className="font-medium">JMD: J${calculateDutyFeeTotal('JMD').toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom Line Items Summary */}
                    {customLineItems.length > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">Custom Line Items ({customLineItems.length} items)</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-green-800">
                            <span className="font-medium">USD: ${calculateCustomLineItemTotal('USD').toFixed(2)}</span>
                          </div>
                          <div className="text-green-800">
                            <span className="font-medium">JMD: J${calculateCustomLineItemTotal('JMD').toFixed(2)}</span>
                          </div>
                        </div>
                        {/* Show conversion note if mixing currencies */}
                        {calculateCustomLineItemTotal('USD') > 0 && calculateCustomLineItemTotal('JMD') > 0 && (
                          <div className="text-xs text-green-700 mt-2 italic">
                            Note: JMD amounts will be converted to USD for invoice processing
                          </div>
                        )}
                      </div>
                    )}

                    {/* Invoice Details */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Invoice Details</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div><span className="font-medium">Due Date:</span> {watch('dueDate')}</div>
                        <div><span className="font-medium">Send Notification:</span> {watch('sendNotification') ? 'Yes' : 'No'}</div>
                        {watch('notes') && (
                          <div><span className="font-medium">Notes:</span> {watch('notes')}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {generateInvoice.isError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-red-800 text-sm">
                        <span className="font-medium">Error:</span> {generateInvoice.error instanceof Error ? generateInvoice.error.message : 'Failed to generate invoice.'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dialog Footer with Navigation */}
              <DialogFooter className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
                <div className="flex space-x-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPrevStep}
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Step indicator */}
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          step === currentStep
                            ? 'bg-blue-600'
                            : step < currentStep
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>

                    {currentStep < 3 ? (
                      <Button
                        type="button"
                        onClick={goToNextStep}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={generateInvoice.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
                      </Button>
                    )}
                  </div>
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