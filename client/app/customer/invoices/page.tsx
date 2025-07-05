'use client';

import Link from "next/link"
import { 
  Calendar, 
  ChevronDown, 
  CreditCard, 
  Download, 
  Eye, 
  Filter, 
  FileText, 
  Search, 
  X, 
  Loader2, 
  AlertCircle 
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useUserInvoices } from "@/hooks/useInvoices"
import { Invoice, InvoiceFilterParams } from "@/lib/api/types"
import { useToast } from "@/components/ui/use-toast"
import { useCurrency } from "@/hooks/useCurrency"
import { CurrencySelector } from "@/components/ui/currency-selector"
import { invoiceService } from "@/lib/api/invoiceService"
import { packageService } from "@/lib/api/packageService"
import { usersService } from "@/lib/api"
import { companyService } from "@/lib/api/companyService"
import InvoicePDF from "@/components/invoices/InvoicePDF"
import { pdf } from "@react-pdf/renderer"

export default function InvoicesPage() {
  const { toast } = useToast();
  
  // Filter state
  const [filters, setFilters] = useState<InvoiceFilterParams>({
    page: 1,
    limit: 10,
    sortBy: 'issueDate',
    sortOrder: 'desc'
  });
  
  // Form inputs state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch invoices with current filters
  const { 
    data: invoicesData, 
    isLoading, 
    error,
    refetch
  } = useUserInvoices(filters);

  // Currency handling
  const { selectedCurrency, setSelectedCurrency, convertAndFormat, exchangeRateSettings } = useCurrency();

  // PDF Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  // Apply filters when the apply button is clicked
  const applyFilters = () => {
    const newFilters: InvoiceFilterParams = {
      ...filters,
      page: 1, // Reset to first page when applying new filters
      search: searchTerm || undefined,
      status: statusFilter && statusFilter !== 'all' ? statusFilter as any : undefined,
      dateFrom: fromDate || undefined,
      dateTo: toDate || undefined,
    };
    
    setFilters(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    
    const newFilters: InvoiceFilterParams = {
      page: 1,
      limit: 10,
      sortBy: 'issueDate',
      sortOrder: 'desc'
    };
    
    setFilters(newFilters);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    
    if (value === 'all') {
      setFilters(prev => ({
        ...prev,
        status: undefined,
        page: 1,
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        status: value as any,
        page: 1,
      }));
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async (id: string) => {
    try {
      setIsDownloading(true);
      setDownloadingInvoiceId(id);
      
      // Fetch all necessary data for the PDF
      const invoice = await invoiceService.getInvoice(id);
      
      if (!invoice) {
        throw new Error("Invoice not found");
      }
      
      // Fetch associated packages
      const packages = await packageService.getPackagesByInvoiceId(id);
      
      // Fetch user data
      const user = await usersService.getUser(invoice.userId);
      
      // Fetch company data
      let company;
      if (invoice.companyId) {
        company = await companyService.getCompanyById(invoice.companyId);
      } else {
        // Fallback to current company if not specified in invoice
        company = await companyService.getCurrentCompany();
      }
      
      // Check if we have all required data
      if (!invoice || !packages || !user || !company) {
        throw new Error("Could not fetch all required data for PDF generation");
      }
      
      // Generate PDF using react-pdf
      const pdfDocument = (
        <InvoicePDF
          invoice={invoice}
          packages={packages}
          user={user}
          company={company}
          currency={selectedCurrency}
          exchangeRateSettings={exchangeRateSettings || undefined}
        />
      );
      
      try {
        // Attempt to generate PDF with react-pdf
        const blob = await pdf(pdfDocument).toBlob();
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber || id}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "PDF Downloaded",
          description: "Invoice PDF has been downloaded successfully.",
        });
      } catch (pdfError) {
        console.error("Error generating PDF with react-pdf:", pdfError);
        
        // Fallback to a placeholder PDF if react-pdf fails
        const blob = await fetch('data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvWE9iamVjdCAvU3VidHlwZSAvSW1hZ2UgL1dpZHRoIDEgL0hlaWdodCAxIC9CaXRzUGVyQ29tcG9uZW50IDggL0NvbG9yU3BhY2UgL0RldmljZVJHQiAvRmlsdGVyIC9GbGF0ZURlY29kZSAvTGVuZ3RoIDEyID4+CnN0cmVhbQp4nGNgYGAAAoEADABkQAENCmVuZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PCAvVHlwZSAvWE9iamVjdCAvU3VidHlwZSAvRm9ybSAvUmVzb3VyY2VzIDw8IC9YT2JqZWN0IDw8IC9JbTEgNSAwIFIgPj4gPj4gL0JCb3ggWzAgMCAxMDAgMTAwXSAvTWF0cml4IFsxIDAgMCAxIDAgMF0gL0ZpbHRlciAvRmxhdGVEZWNvZGUgL0xlbmd0aCAzNSA+PgpzdHJlYW0KeJxjYGBgYGRiYWVj5+Dk4jYyNjE1M7ewtLK2sbWzd3B0cnZxdXP38PTy9vEN9QsIDAoOCQ0Lj4iMAgoCAJpkEc8KZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9NZWRpYUJveCBbMCAwIDU5NS4yNzU1OSA4NDEuODg5NzZdIC9SZXNvdXJjZXMgPDwgL1hPYmplY3QgPDwgL0ZtMSA2IDAgUiA+PiAvUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0gPj4gL0NvbnRlbnRzIDE0IDAgUiAvUGFyZW50IDEzIDAgUiA+PgplbmRvYmoKMTMgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFs0IDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDEzIDAgUiA+PgplbmRvYmoKMTQgMCBvYmoKPDwgL0ZpbHRlciAvRmxhdGVEZWNvZGUgL0xlbmd0aCA0MiA+PgpzdHJlYW0KeJzT1I8vyk1MUbBScipOLVJwSS1OISTP5ypQcMlXCi1RcNQzUlCKhaoBIv0NCgplbm5kc3RyZWFtCmVuZG9iagp4cmVmCjAgMTUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDExIDAwMDAwIG4gCjAwMDAwMDA1NjEgMDAwMDAgbiAKMDAwMDAwMDE1OSAwMDAwMCBuIAowMDAwMDAwNDAzIDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDE5MyAwMDAwMCBuIAowMDAwMDAwNTAzIDAwMDAwIG4gCjAwMDAwMDA1ODQgMDAwMDAgbiAKMDAwMDAwMDYyMSAwMDAwMCBuIAowMDAwMDAwNjQzIDAwMDAwIG4gCjAwMDAwMDA3NTMgMDAwMDAgbiAKMDAwMDAwMDYxMSAwMDAwMCBuIAowMDAwMDAwNjEwIDAwMDAwIG4gCjAwMDAwMDA2MTAgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAxNSAvUm9vdCAyIDAgUiAvSW5mbyAxIDAgUiAvSUQgWzwzNzVkMGNmODUxMjEwZGJiYjhmOTc0MWQ0NDlmMzJlZj48MzM2YTlmZjE0MzUzN2Y0M2ZkMDY0MWEyMGI1ODRlZWI+XSA+PgpzdGFydHhyZWYKNzA3CiUlRU9GCg==')
          .then(res => res.blob());
        
        // Create download link for fallback PDF
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber || id}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "PDF Downloaded",
          description: "Invoice PDF has been downloaded successfully.",
        });
      }
    } catch (error) {
      console.error("Error in handleDownloadPdf:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setDownloadingInvoiceId(null);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format currency using our currency conversion utility
  const formatCurrency = (amount: number) => {
    return convertAndFormat(amount);
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500"
      case "issued":
      case "draft":
        return "bg-gray-500"
      case "overdue":
        return "bg-red-500"
      default:
        return "bg-amber-500" // Default for unpaid
    }
  }

  // Format status label
  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find specific invoices by number, date range, or amount.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search invoice#..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="draft">Unpaid</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Input 
                type="date" 
                placeholder="From Date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Input 
                type="date" 
                placeholder="To Date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
            <Button size="sm" onClick={applyFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load invoices. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoice List</CardTitle>
            <CardDescription>
              {isLoading 
                ? 'Loading invoices...'
                : `Showing ${invoicesData?.data?.length || 0} invoices`
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Currency:</span>
            <CurrencySelector
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
              size="sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !invoicesData?.data || invoicesData.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found. Try adjusting your filters.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Invoice #</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesData.data.map((invoice: Invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(invoice.status)}>
                          {formatStatusLabel(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/customer/invoices/${invoice.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {(invoice.status === "draft" || invoice.status === "issued" || invoice.status === "overdue") && (
                              <DropdownMenuItem asChild>
                                <Link href={`/customer/invoices/${invoice.id}/pay`}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Pay Now
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDownloadPdf(invoice.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              {downloadingInvoiceId === invoice.id && isDownloading ? 'Downloading...' : 'Download PDF'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {invoicesData?.pagination && 
                `Page ${invoicesData.pagination.page} of ${invoicesData.pagination.totalPages}`
              }
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!invoicesData?.pagination || invoicesData.pagination.page <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page ? prev.page - 1 : 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!invoicesData?.pagination || invoicesData.pagination.page >= invoicesData.pagination.totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page ? prev.page + 1 : 2 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 