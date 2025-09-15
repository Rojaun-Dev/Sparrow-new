'use client';

import { useState } from 'react';
import { InvoiceCreator, InvoiceCreatorSkeleton } from '@/components/invoices/InvoiceCreator';
import { useGenerateInvoice, usePreviewInvoice } from '@/hooks/useInvoices';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PackageStatusUpdateDialog } from '@/components/packages/PackageStatusUpdateDialog';

export default function CreateInvoicePage() {
  const [showPackageStatusDialog, setShowPackageStatusDialog] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [invoicePackages, setInvoicePackages] = useState<any[]>([]);

  const router = useRouter();
  const { toast } = useToast();
  const generateInvoice = useGenerateInvoice();
  const previewInvoice = usePreviewInvoice();
  
  // Example: You can use loading state like this:
  // const [isLoading, setIsLoading] = useState(true);

  const handleSave = async (data: any) => {
    try {
      // Create as draft
      const draftData = { ...data, isDraft: true };
      const invoice = await generateInvoice.mutateAsync(draftData);
      
      toast({
        title: 'Draft Saved',
        description: 'Invoice has been saved as draft successfully',
      });

      // Navigate to the invoice details page
      if (invoice?.id) {
        router.push(`/admin/invoices/${invoice.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save invoice draft',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async (data: any) => {
    try {
      const preview = await previewInvoice.mutateAsync(data);
      console.log('Invoice preview:', preview);
      // You could open a preview dialog here if needed
    } catch (error: any) {
      toast({
        title: 'Preview Error',
        description: error?.message || 'Failed to generate invoice preview',
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async (data: any) => {
    try {
      // Create as final invoice
      const finalData = { ...data, isDraft: false };
      const invoice = await generateInvoice.mutateAsync(finalData);

      toast({
        title: 'Invoice Generated',
        description: 'Invoice has been generated successfully',
      });

      // Extract package information from the invoice data for the status update dialog
      const packages = [];
      if (data.packageIds && data.packageIds.length > 0) {
        // For invoices with specific packages, we need to get package details
        // This is a limitation - we need package details but only have IDs
        // For now, we'll create minimal package info from available data
        data.packageIds.forEach((packageId: string, index: number) => {
          packages.push({
            id: packageId,
            trackingNumber: `Package ${index + 1}`, // Limited info available
            description: `Package from invoice`,
          });
        });
      }

      // Store the generated invoice and packages
      setGeneratedInvoice(invoice);
      setInvoicePackages(packages);

      // Show package status update dialog if there are packages
      if (packages.length > 0) {
        setShowPackageStatusDialog(true);
      } else {
        // No packages to update, navigate directly
        if (invoice?.id) {
          router.push(`/admin/invoices/${invoice.id}`);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    }
  };

  // Example: Conditional rendering with loading state
  // if (isLoading) {
  //   return <InvoiceCreatorSkeleton />;
  // }

  return (
    <div className="flex flex-col">
      <div className='p-6'>
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-muted-foreground">
          Create a new invoice for your customers with detailed package information and fees.
        </p>
      </div>

      <InvoiceCreator
        mode="create"
        onSave={handleSave}
        onPreview={handlePreview}
        onGenerate={handleGenerate}
      />

      {/* Package Status Update Dialog */}
      <PackageStatusUpdateDialog
        open={showPackageStatusDialog}
        onOpenChange={setShowPackageStatusDialog}
        packages={invoicePackages}
        onComplete={() => {
          setShowPackageStatusDialog(false);
          // Navigate to the invoice details page
          if (generatedInvoice?.id) {
            router.push(`/admin/invoices/${generatedInvoice.id}`);
          }
        }}
      />
    </div>
  );
} 