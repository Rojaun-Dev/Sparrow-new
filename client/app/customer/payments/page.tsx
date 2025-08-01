'use client';

import Link from "next/link"
import { 
  Calendar, 
  ChevronDown, 
  CreditCard, 
  Download, 
  Eye, 
  Filter, 
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useUserPayments, useDownloadPaymentReceipt } from "@/hooks"
import { Payment, PaymentFilterParams } from "@/lib/api/types"
import { useToast } from "@/components/ui/use-toast"

export default function PaymentsPage() {
  const { toast } = useToast();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("history");
  
  // Filter state
  const [filters, setFilters] = useState<PaymentFilterParams>({
    page: 1,
    limit: 10,
    sortBy: 'paymentDate',
    sortOrder: 'desc'
  });
  
  // Form inputs state
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch payments with current filters
  const { 
    data: paymentsData, 
    isLoading, 
    error,
    refetch
  } = useUserPayments(filters);

  // Receipt Download mutation
  const downloadReceipt = useDownloadPaymentReceipt();
  
  // Apply filters when the apply button is clicked
  const applyFilters = () => {
    const newFilters: PaymentFilterParams = {
      ...filters,
      search: searchTerm || undefined,
      method: methodFilter !== 'all' ? methodFilter as any || undefined : undefined,
      dateFrom: fromDate || undefined,
      dateTo: toDate || undefined,
    };
    
    setFilters(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setMethodFilter('');
    setFromDate('');
    setToDate('');
    
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'paymentDate',
      sortOrder: 'desc'
    });
  };

  // Handle receipt download
  const handleDownloadReceipt = async (id: string) => {
    try {
      await downloadReceipt.mutateAsync(id);
      toast({
        title: "Receipt Downloaded",
        description: "Payment receipt has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download payment receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date string
  const formatDate = (dateString: string | null | undefined, payment?: Payment) => {
    // First try using the payment metadata for WiPay transactions
    if (payment && payment.meta) {
      // Look for transactionTimestamp or paymentProcessedAt in metadata
      const metaDate = payment.meta.transactionTimestamp || 
                       payment.meta.paymentProcessedAt || 
                       payment.meta.wiPayCallback?.timestamp || 
                       payment.meta.wiPayCallback?.date;
      
      if (metaDate) {
        const date = new Date(metaDate);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1971) {
          console.log('Using date from metadata:', metaDate);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        }
      }
    }
    
    // Fall back to regular date processing
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) return 'N/A';
    
    // Check if it's the Unix epoch default (1970-01-01 or close to it)
    if (date.getFullYear() < 1971) {
      console.log('Invalid date detected:', dateString);
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number, payment: Payment) => {
    // Check if payment has meta data with currency information
    const currency = payment.meta?.currency || 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format payment method display
  const formatPaymentMethod = (method: string, payment: Payment) => {
    switch (method) {
      case 'credit_card':
        return `Credit Card ${payment.transactionId ? `(${payment.transactionId.slice(-4)})` : ''}`;
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      case 'check':
        return 'Check';
      case 'online':
        return 'Online Payment';
      default:
        return method.replace('_', ' ');
    }
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      case "refunded":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  // Format status label
  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Example payment methods (would come from API in real implementation)
  const paymentMethods = [
    {
      id: "pm-001",
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2024,
      isDefault: true,
    },
    {
      id: "pm-002",
      type: "card",
      brand: "Mastercard",
      last4: "5555",
      expiryMonth: 10,
      expiryYear: 2025,
      isDefault: false,
    },
    {
      id: "pm-003",
      type: "paypal",
      email: "john.doe@example.com",
      isDefault: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Payment Methods
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Payment methods management will be available in a future release</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>Find specific transactions by invoice number, date range, or amount.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
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
                Failed to load payment history. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  {isLoading 
                    ? 'Loading payment history...'
                    : `Showing ${Array.isArray(paymentsData?.data) ? paymentsData.data.length : 0} transactions`
                  }
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Last 90 Days
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !Array.isArray(paymentsData?.data) || paymentsData.data.length === 0 ? (
                <>
                  {!Array.isArray(paymentsData?.data) && paymentsData?.data !== undefined && (
                    <>
                      {console.warn('Unexpected payments data shape:', paymentsData?.data)}
                      <div className="text-center py-2 text-red-500">
                        Warning: Unexpected response shape for payments data. Please contact support.
                        {process.env.NODE_ENV === 'development' && (
                          <pre className="text-xs text-muted-foreground overflow-x-auto bg-gray-100 p-2 mt-2 rounded">
                            {JSON.stringify(paymentsData?.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </>
                  )}
                  <div className="text-center py-8 text-muted-foreground">
                    No payment transactions found. Try adjusting your filters.
                  </div>
                </>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(paymentsData.data ?? []).map((payment: Payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.invoiceNumber ? (
                              <Link href={`/customer/invoices/${payment.invoiceId}`} className="text-primary hover:underline">
                                {payment.invoiceNumber}
                              </Link>
                            ) : (
                              payment.invoiceId
                            )}
                          </TableCell>
                          <TableCell>{formatDate(payment.paymentDate, payment)}</TableCell>
                          <TableCell>
                            {formatPaymentMethod(payment.paymentMethod, payment)}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount, payment)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(payment.status)}>
                              {formatStatusLabel(payment.status)}
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
                                {payment.invoiceId && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/customer/invoices/${payment.invoiceId}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Invoice
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {payment.status === "completed" && payment.amount > 0 && (
                                  <DropdownMenuItem disabled>
                                    <X className="mr-2 h-4 w-4" />
                                    Request Refund
                                  </DropdownMenuItem>
                                )}
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
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  {paymentsData?.pagination && 
                    `Page ${paymentsData.pagination.page} of ${paymentsData.pagination.totalPages}`
                  }
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!paymentsData?.pagination || paymentsData.pagination.page <= 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page ? prev.page - 1 : 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!paymentsData?.pagination || paymentsData.pagination.page >= paymentsData.pagination.totalPages}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page ? prev.page + 1 : 2 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="methods" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment methods.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${method.isDefault ? 'bg-secondary/50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {method.type === "card" ? (
                        <div className="flex h-10 w-16 items-center justify-center rounded-md border bg-white">
                          {method.brand === "Visa" ? (
                            <span className="text-blue-600 font-bold text-lg">VISA</span>
                          ) : method.brand === "Mastercard" ? (
                            <span className="text-red-600 font-bold text-lg">MC</span>
                          ) : (
                            <CreditCard className="h-6 w-6" />
                          )}
                        </div>
                      ) : method.type === "paypal" ? (
                        <div className="flex h-10 w-16 items-center justify-center rounded-md border bg-[#0070BA]">
                          <span className="text-white font-bold text-sm">PayPal</span>
                        </div>
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded-md border bg-gray-100">
                          <CreditCard className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        {method.type === "card" ? (
                          <div>
                            <p className="font-medium">
                              {method.brand} **** {method.last4}
                              {method.isDefault && (
                                <Badge className="ml-2 bg-secondary text-secondary-foreground">Default</Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                        ) : method.type === "paypal" ? (
                          <div>
                            <p className="font-medium">
                              PayPal Account
                              {method.isDefault && (
                                <Badge className="ml-2 bg-secondary text-secondary-foreground">Default</Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{method.email}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">Unknown Payment Method</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button disabled variant="outline" size="sm">
                          Set Default
                        </Button>
                      )}
                      <Button disabled variant="ghost" size="sm">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4 border-t px-6 py-4">
              <div className="w-full flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Payment methods are stored securely.</p>
                <Button disabled>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Payment Method
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                    Coming Soon
                  </Badge>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 