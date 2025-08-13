import React, { useState } from 'react';
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import InvoicePDF from './InvoicePDF';
import { Invoice, SupportedCurrency, ExchangeRateSettings } from '@/lib/api/types';

interface InvoicePDFRendererProps {
  invoice: Invoice;
  packages: any[];
  user: any;
  company: any;
  companyLogo?: string | null;
  isUsingBanner?: boolean;
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  buttonText?: string;
  fileName?: string;
  onDownloadComplete?: () => void;
  currency?: SupportedCurrency;
  exchangeRateSettings?: ExchangeRateSettings;
}

/**
 * InvoicePDFRenderer - A component to render and download PDF invoices
 */
const InvoicePDFRenderer: React.FC<InvoicePDFRendererProps> = ({
  invoice,
  packages,
  user,
  company,
  companyLogo,
  isUsingBanner = false,
  buttonProps,
  buttonText = 'Download PDF',
  fileName = `invoice-${invoice?.invoiceNumber || invoice?.id}.pdf`,
  onDownloadComplete,
  currency = 'USD',
  exchangeRateSettings
}) => {
  // Validate required props
  if (!invoice || !user || !company) {
    console.warn('InvoicePDFRenderer: Missing required props', { 
      invoice: !!invoice, 
      user: !!user, 
      company: !!company 
    });
    return (
      <Button 
        variant="outline" 
        size="sm"
        disabled
        {...buttonProps}
      >
        <Download className="mr-2 h-4 w-4" />
        Data Missing
      </Button>
    );
  }

  // Fallback for direct download without PDFDownloadLink
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle manual download (fallback if PDFDownloadLink has issues)
  const handleManualDownload = async () => {
    if (!invoice || !packages || !user || !company) return;
    
    setIsGenerating(true);
    try {
      const blob = await fetch('data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvWE9iamVjdCAvU3VidHlwZSAvSW1hZ2UgL1dpZHRoIDEgL0hlaWdodCAxIC9CaXRzUGVyQ29tcG9uZW50IDggL0NvbG9yU3BhY2UgL0RldmljZVJHQiAvRmlsdGVyIC9GbGF0ZURlY29kZSAvTGVuZ3RoIDEyID4+CnN0cmVhbQp4nGNgYGAAAoEADABkQAENCmVuZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PCAvVHlwZSAvWE9iamVjdCAvU3VidHlwZSAvRm9ybSAvUmVzb3VyY2VzIDw8IC9YT2JqZWN0IDw8IC9JbTEgNSAwIFIgPj4gPj4gL0JCb3ggWzAgMCAxMDAgMTAwXSAvTWF0cml4IFsxIDAgMCAxIDAgMF0gL0ZpbHRlciAvRmxhdGVEZWNvZGUgL0xlbmd0aCAzNSA+PgpzdHJlYW0KeJxjYGBgYGRiYWVj5+Dk4jYyNjE1M7ewtLK2sbWzd3B0cnZxdXP38PTy9vEN9QsIDAoOCQ0Lj4iMAgoCAJpkEc8KZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9NZWRpYUJveCBbMCAwIDU5NS4yNzU1OSA4NDEuODg5NzZdIC9SZXNvdXJjZXMgPDwgL1hPYmplY3QgPDwgL0ZtMSA2IDAgUiA+PiAvUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0gPj4gL0NvbnRlbnRzIDE0IDAgUiAvUGFyZW50IDEzIDAgUiA+PgplbmRvYmoKMTMgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFs0IDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDEzIDAgUiA+PgplbmRvYmoKMTQgMCBvYmoKPDwgL0ZpbHRlciAvRmxhdGVEZWNvZGUgL0xlbmd0aCA0MiA+PgpzdHJlYW0KeJzT1I8vyk1MUbBScipOLVJwSS1OISTP5ypQcMlXCi1RcNQzUlCKhaoBIv0NCgplbm5kc3RyZWFtCmVuZG9iagp4cmVmCjAgMTUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDExIDAwMDAwIG4gCjAwMDAwMDA1NjEgMDAwMDAgbiAKMDAwMDAwMDE1OSAwMDAwMCBuIAowMDAwMDAwNDAzIDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDE5MyAwMDAwMCBuIAowMDAwMDAwNTAzIDAwMDAwIG4gCjAwMDAwMDA1ODQgMDAwMDAgbiAKMDAwMDAwMDYyMSAwMDAwMCBuIAowMDAwMDAwNjQzIDAwMDAwIG4gCjAwMDAwMDA3NTMgMDAwMDAgbiAKMDAwMDAwMDYxMSAwMDAwMCBuIAowMDAwMDAwNjEwIDAwMDAwIG4gCjAwMDAwMDA2MTAgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAxNSAvUm9vdCAyIDAgUiAvSW5mbyAxIDAgUiAvSUQgWzwzNzVkMGNmODUxMjEwZGJiYjhmOTc0MWQ0NDlmMzJlZj48MzM2YTlmZjE0MzUzN2Y0M2ZkMDY0MWEyMGI1ODRlZWI+XSA+PgpzdGFydHhyZWYKNzA3CiUlRU9GCg==')
        .then(res => res.blob());
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // BlobProvider - Modern approach for complex PDF generation scenarios
  // Add key to force re-render and avoid reconciler issues
  const renderKey = `${invoice.id}-${packages?.length || 0}-${currency}-${invoice.status || 'unknown'}`;
  
  return (
    <BlobProvider 
      key={renderKey}
      document={
        <InvoicePDF 
          invoice={invoice}
          packages={packages || []}
          user={user}
          company={company}
          companyLogo={companyLogo}
          isUsingBanner={isUsingBanner}
          currency={currency}
          exchangeRateSettings={exchangeRateSettings}
        />
      }
    >
      {({ loading, url, error }) => {
        if (error) {
          console.error('InvoicePDFRenderer: PDF generation error', error);
          // Log additional context for debugging
          console.error('Error context:', {
            invoiceId: invoice?.id,
            packagesCount: packages?.length,
            currency,
            hasUser: !!user,
            hasCompany: !!company
          });
          return (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualDownload} 
              disabled={isGenerating}
              {...buttonProps}
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'PDF Error - Retry'}
            </Button>
          );
        }

        if (loading || !url) {
          return (
            <Button 
              variant="outline" 
              size="sm"
              disabled
              {...buttonProps}
            >
              <Download className="mr-2 h-4 w-4" />
              Preparing...
            </Button>
          );
        }

        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              if (onDownloadComplete) {
                onDownloadComplete();
              }
            }}
            {...buttonProps}
          >
            <Download className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        );
      }}
    </BlobProvider>
  );
};

export default InvoicePDFRenderer; 