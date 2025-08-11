'use client';

import { InvoiceCreator, InvoiceCreatorSkeleton } from '@/components/invoices/InvoiceCreator';
import { useGenerateInvoice, usePreviewInvoice } from '@/hooks/useInvoices';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function CreateInvoicePage() {
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
    </div>
  );
} 