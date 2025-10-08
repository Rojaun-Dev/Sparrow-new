'use client';

import Link from "next/link"
import { 
  Calendar, 
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
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useUserInvoices } from "@/hooks/useInvoices"
import { Invoice, InvoiceFilterParams } from "@/lib/api/types"
import { useToast } from "@/components/ui/use-toast"
import { useCurrency } from "@/hooks/useCurrency"
import { CurrencySelector } from "@/components/ui/currency-selector"
import { usersService } from "@/lib/api"
import { packageService } from "@/lib/api/packageService"
import { companyService } from "@/lib/api/companyService"
import InvoicePDFRenderer from "@/components/invoices/InvoicePDFRenderer"
import { PayNowButton } from "@/components/invoices/PayNowButton"
import { usePaymentAvailability } from "@/hooks/usePayWiPay"
import { useMyCompany } from "@/hooks/useCompanies"
import { useCompanyLogo } from "@/hooks/useCompanyAssets"

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
  const { selectedCurrency, setSelectedCurrency, convertAndFormat, convertAndFormatInvoiceTotal, exchangeRateSettings } = useCurrency();

  // Payment availability check
  const { data: paymentSettings } = usePaymentAvailability();
  
  // Company data for PDF generation
  const { data: company } = useMyCompany();
  const { logoUrl, isUsingBanner } = useCompanyLogo(company?.id);

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

  // Handle PDF download with InvoicePDFRenderer approach
  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      // Fetch user data for the invoice
      const user = await usersService.getUser(invoice.userId);
      
      // Fetch packages for the invoice
      const packages = await packageService.getPackagesByInvoiceId(invoice.id);
      
      if (!user) {
        toast({
          title: "Error",
          description: "Could not fetch user data for PDF generation.",
          variant: "destructive",
        });
        return;
      }
      
      // Import the PDF generation logic from the renderer
      const { pdf } = await import('@react-pdf/renderer');
      const InvoicePDF = (await import('@/components/invoices/InvoicePDF')).default;
      const React = (await import('react')).default;
      
      const pdfDocument = React.createElement(InvoicePDF, {
        invoice,
        packages: packages || [],
        user,
        company,
        companyLogo: logoUrl,
        isUsingBanner,
        currency: selectedCurrency,
        exchangeRateSettings: exchangeRateSettings || undefined
      });
      
      // Generate and download the PDF
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Downloaded",
        description: "Invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle payment initiation directly
  const handlePayNow = async (invoice: Invoice) => {
    try {
      // Import the usePayWiPay hook dynamically
      const { usePayWiPay } = await import('@/hooks/usePayWiPay');
      
      // Since we can't use hooks here, we'll make a direct API call
      // Import the API client
      const { ApiClient } = await import('@/lib/api/apiClient');
      const apiClient = new ApiClient();
      
      // Store authentication token in session storage before redirect
      const token = localStorage.getItem('token');
      if (token) {
        sessionStorage.setItem('wipay_auth_token', token);
      }
      
      // Store the selected currency in session storage for after payment return
      sessionStorage.setItem('wipay_currency', selectedCurrency);
      
      // Construct the response URL to point to our payment result page
      const returnUrl = `${window.location.origin}/customer/invoices/${invoice.id}`;
      
      // Call API to create payment request
      const response = await apiClient.post('/companies/current/payments/wipay/request', {
        invoiceId: invoice.id,
        responseUrl: returnUrl,
        origin: 'SparrowX-Customer-Portal',
        currency: selectedCurrency
      });
      
      // Redirect to payment page
      if (response && response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        throw new Error('No redirect URL returned from payment service');
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
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

  // Format invoice total with rounding
  const formatInvoiceTotal = (amount: number) => {
    return convertAndFormatInvoiceTotal(amount);
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
            <ResponsiveTable
              data={invoicesData.data}
              keyExtractor={(invoice) => invoice.id}
              loading={isLoading}
              emptyMessage="No invoices found. Try adjusting your filters."
              columns={[
                {
                  header: "Invoice #",
                  accessorKey: "invoiceNumber",
                  className: "w-[120px] font-medium",
                  cardLabel: "Invoice Number"
                },
                {
                  header: "Issue Date",
                  accessorKey: "issueDate",
                  cell: (invoice) => formatDate(invoice.issueDate)
                },
                {
                  header: "Due Date",
                  accessorKey: "dueDate",
                  cell: (invoice) => formatDate(invoice.dueDate)
                },
                {
                  header: "Amount",
                  accessorKey: "totalAmount",
                  cell: (invoice) => formatInvoiceTotal(invoice.totalAmount)
                },
                {
                  header: "Status",
                  accessorKey: "status",
                  cell: (invoice) => (
                    <Badge className={getStatusBadgeColor(invoice.status)}>
                      {formatStatusLabel(invoice.status)}
                    </Badge>
                  )
                },
              ]}
              actions={[
                {
                  label: "View Details",
                  href: (invoice) => `/customer/invoices/${invoice.id}`,
                  icon: Eye
                },
                {
                  label: "Pay Now",
                  onClick: (invoice) => handlePayNow(invoice),
                  icon: CreditCard,
                  hidden: (invoice) => !(invoice.status === "draft" || invoice.status === "issued" || invoice.status === "overdue") || !paymentSettings?.isEnabled
                },
                {
                  label: "Download PDF",
                  onClick: (invoice) => handleDownloadPdf(invoice),
                  icon: Download
                }
              ]}
            />
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