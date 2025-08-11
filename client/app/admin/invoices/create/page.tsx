'use client';

import { InvoiceCreator } from '@/components/invoices/InvoiceCreator';
import { useGenerateInvoice, usePreviewInvoice } from '@/hooks/useInvoices';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const generateInvoice = useGenerateInvoice();
  const previewInvoice = usePreviewInvoice();

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

      // Navigate to the invoice details page
      if (invoice?.id) {
        router.push(`/admin/invoices/${invoice.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    }
  };

  return (
    <InvoiceCreator
      mode="create"
      onSave={handleSave}
      onPreview={handlePreview}
      onGenerate={handleGenerate}
    />
  );
} 