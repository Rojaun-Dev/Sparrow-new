"use client";
import { useExportCsv } from '@/hooks/useExportCsv';
import { paymentService, exportPaymentsCsv } from '@/lib/api/paymentService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Download, Filter, Search, FileText, Check, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export default function PaymentsPage() {
  const { user } = useAuth();
  const { exportCsv, loading: exportLoading } = useExportCsv();
  const { toast } = useToast();
  
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Fetch payments with filters
  const { data: paymentsResponse, isLoading, error } = usePayments({
    search: searchQuery,
    status: statusFilter as any,
    page: currentPage,
    limit: pageSize
  });

  const payments = paymentsResponse?.data || [];
  const totalPages = paymentsResponse?.pagination?.totalPages || 0;

  // Format handlers
  const formatDate = (dateString: string | null | undefined, payment?: any) => {
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
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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
      console.log(`Invalid date detected: ${dateString}`);
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency with exchange rate info
  const formatCurrencyWithRate = (payment: any) => {
    // Get currency from payment meta data or default to USD
    const currency = payment.meta?.currency || 'USD';
    const amount = payment.amount;
    const exchangeRate = payment.meta?.exchangeRate;
    
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
    
    if (currency !== 'USD' && exchangeRate && exchangeRate !== 1) {
      return (
        <>
          {formattedAmount}
          <span className="text-xs text-muted-foreground ml-1">
            (rate: {exchangeRate})
          </span>
        </>
      );
    }
    
    return formattedAmount;
  };

  // Export handler
  const handleExport = async () => {
    await exportCsv(
      (params) => exportPaymentsCsv(params, user?.companyId),
      {
        search: searchQuery,
        status: statusFilter || undefined
      },
      'payments.csv'
    );
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><Check className="mr-1 h-3 w-3" /> Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case 'refunded':
        return <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3" /> Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render mobile payment card
  const renderMobilePaymentCard = (payment: any) => {
    return (
      <Card key={payment.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Link href={`/admin/invoices/${payment.invoiceId}`} className="text-primary hover:underline">
              <CardTitle className="text-base">
                {(payment as any).invoiceNumber || (payment as any).invoice_number || 
                 (payment.invoiceId ? `${payment.invoiceId.substring(0, 8)}...` : '—')}
              </CardTitle>
            </Link>
            {getStatusBadge(payment.status)}
          </div>
          <CardDescription>
            <Link href={`/admin/customers/${payment.userId}`} className="text-primary hover:underline">
              {((payment as any).customerFirstName && (payment as any).customerLastName)
                ? `${(payment as any).customerFirstName} ${(payment as any).customerLastName}`
                : (payment as any).customerName ||
                  (payment.userId ? `${payment.userId.substring(0, 8)}...` : '—')}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 pt-0">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium">{formatCurrencyWithRate(payment)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p>{formatDate(payment.paymentDate, payment)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Method</p>
              <Badge variant="outline" className="mt-1">
                {payment.paymentMethod.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button variant="outline" className="gap-1" onClick={handleExport} disabled={exportLoading}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and manage all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Status
                    {statusFilter && <Badge className="ml-1 px-1">{statusFilter}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                    Failed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('refunded')}>
                    Refunded
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found. Try adjusting your search or filters.
            </div>
          ) : isMobile ? (
            // Mobile view - cards
            <div className="space-y-4">
              {payments.map(payment => renderMobilePaymentCard(payment))}
            </div>
          ) : (
            // Desktop view - table
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      {/* Invoice number */}
                      <TableCell>
                        <Link href={`/admin/invoices/${payment.invoiceId}`} className="text-primary hover:underline">
                          {/* Prefer the human-readable invoice number if we have it */}
                          {(
                            (payment as any).invoiceNumber || // populated by backend join
                            (payment as any).invoice_number || // fallback snake_case
                            (payment.invoiceId ? `${payment.invoiceId.substring(0, 8)}...` : '—')
                          )}
                        </Link>
                      </TableCell>
                      {/* Customer name */}
                      <TableCell>
                        <Link href={`/admin/customers/${payment.userId}`} className="text-primary hover:underline">
                          {(
                            ((payment as any).customerFirstName && (payment as any).customerLastName)
                              ? `${(payment as any).customerFirstName} ${(payment as any).customerLastName}`
                              : // Try generic user name property if the backend sends it
                                (payment as any).customerName ||
                                (payment.userId ? `${payment.userId.substring(0, 8)}...` : '—')
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate, payment)}</TableCell>
                      <TableCell>{formatCurrencyWithRate(payment)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.paymentMethod.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-2">
              <div>
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
} 