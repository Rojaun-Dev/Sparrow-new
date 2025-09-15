import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useGenerateInvoice } from '@/hooks/useInvoices';
import { useInvoiceByPackageId } from '@/hooks/useInvoices';
import { usePackage } from '@/hooks/usePackages';
import { useToast } from "@/hooks/use-toast";
import { PackageStatusUpdateDialog } from '@/components/packages/PackageStatusUpdateDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

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
  const [showPackageStatusDialog, setShowPackageStatusDialog] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  const { data: relatedInvoice, isLoading: isLoadingRelatedInvoice } = useInvoiceByPackageId(packageId || '');
  const { data: packageData } = usePackage(packageId || '');
  const generateInvoice = useGenerateInvoice();
  const router = useRouter();
  const { toast } = useToast();

  if (!packageId || !userId) return null;
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice for this Package?</DialogTitle>
          </DialogHeader>
          <div>
            {isLoadingRelatedInvoice ? (
              <p>Checking for existing invoice...</p>
            ) : relatedInvoice ? (
              <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                This package already has an invoice. You cannot generate another invoice for it.
              </div>
            ) : (
              <p>This will generate an invoice for this package and redirect you to the invoice detail page.</p>
            )}
            {generateInvoice.isError && (
              <div className="text-red-600 mt-2 text-sm">
                {generateInvoice.error instanceof Error ? generateInvoice.error.message : 'Failed to generate invoice.'}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                generateInvoice.mutate(
                  { userId, packageIds: [packageId] },
                  {
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
                  }
                );
              }}
              disabled={generateInvoice.isPending || !!relatedInvoice || isLoadingRelatedInvoice}
            >
              {generateInvoice.isPending ? 'Generating...' : 'Confirm'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generateInvoice.isPending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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