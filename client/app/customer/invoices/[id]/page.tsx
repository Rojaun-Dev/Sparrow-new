"use client"

import { use, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertCircle, CreditCard, Download, ExternalLink, FileText, Printer, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInvoice } from "@/hooks/useInvoices"
import { usePackagesByInvoiceId } from "@/hooks/usePackages"
import { useUser } from "@/hooks/useUsers"
import { useMyCompany } from "@/hooks/useCompanies"
import InvoicePDFRenderer from "@/components/invoices/InvoicePDFRenderer"
import { Skeleton } from "@/components/ui/skeleton"
import { usePayWiPay, usePaymentAvailability } from "@/hooks/usePayWiPay"
import { useCompanySettings } from "@/hooks/useCompanySettings"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { useCurrency } from "@/hooks/useCurrency"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SupportedCurrency } from "@/lib/api/types"

// Define types for the payment history
type PaymentHistory = {
  date: string;
  method: string;
  transactionId: string;
  amount: string;
}

// PaymentResultModal component
function PaymentResultModal({ 
  isOpen, 
  onClose,
  status,
  message,
  transactionId,
  error
}: { 
  isOpen: boolean;
  onClose: () => void;
  status: string | null;
  message: string | null;
  transactionId: string | null;
  error: string | null;
}) {
  const isSuccess = status === "success" || status === "completed";
  const router = useRouter();
  
  const handleViewPayments = () => {
    router.push('/customer/payments');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isSuccess ? "Payment Successful" : "Payment Failed"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-center py-4">
            {isSuccess ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          
          {message && (
            <Alert variant={isSuccess ? "default" : "destructive"}>
              <AlertTitle>{isSuccess ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {transactionId && (
            <div className="text-sm text-center">
              <p className="font-medium">Transaction ID:</p>
              <p className="text-muted-foreground">{transactionId}</p>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>System Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onClose} className="w-full sm:w-1/2">
            Close
          </Button>
          <Button 
            onClick={handleViewPayments} 
            variant="outline" 
            className="w-full sm:w-1/2"
          >
            View All Payments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Customer Name Display Component
function CustomerNameDisplay({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);
  
  if (isLoading) {
    return <Skeleton className="h-5 w-40" />;
  }
  
  if (!user) {
    return <p className="text-base">Customer ID: {userId}</p>;
  }
  
  return (
    <p className="text-base">
      {user.firstName} {user.lastName}
    </p>
  );
}

// Company Name Display Component
function CompanyNameDisplay({ companyId }: { companyId: string }) {
  const { data: company, isLoading } = useMyCompany();
  
  if (isLoading) {
    return <Skeleton className="h-5 w-40" />;
  }
  
  if (!company) {
    return <p className="text-base">Company ID: {companyId}</p>;
  }
  
  return <p className="text-base">{company.name}</p>;
}

// PayNowButton component
function PayNowButton({ invoice }: { invoice: any }) {
  const { initiate, isLoading, error } = usePayWiPay();
  const { data: paymentSettings, isLoading: isLoadingPaymentSettings } = usePaymentAvailability();
  const [showError, setShowError] = useState(false);
  
  // Check if WiPay is enabled in company settings
  const isWiPayEnabled = paymentSettings?.isEnabled;
  
  const handlePayment = async () => {
    if (!isWiPayEnabled) {
      setShowError(true);
      return;
    }
    
    try {
      await initiate({
        invoiceId: invoice.id,
        origin: 'SparrowX-Customer-Portal'
      });
    } catch (err) {
      console.error("Payment initiation error:", err);
      setShowError(true);
    }
  };
  
  if (isLoadingPaymentSettings) {
    return (
      <div className="space-y-3 w-full">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    );
  }
  
  if (!isWiPayEnabled) {
    return (
      <div className="space-y-3 w-full">
        <Button className="w-full" variant="outline" disabled>
          <CreditCard className="mr-2 h-4 w-4" />
          Online Payment Not Available
        </Button>
        <div className="text-xs text-muted-foreground text-center">
          Online payments are not enabled. Please pay in person or contact support.
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 w-full">
      {showError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "There was a problem initiating the payment. Please try again or contact support."}
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        className="w-full" 
        onClick={handlePayment} 
        disabled={isLoading}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
      
      <div className="text-xs text-muted-foreground text-center">
        Secure payment processing provided by WiPay
      </div>
    </div>
  );
}

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const resolvedParams = use(params);
  
  // State for payment result modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentTransactionId, setPaymentTransactionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [hasProcessedCallback, setHasProcessedCallback] = useState(false);
  
  // Get URL search params for payment result
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Refresh auth token on component mount
  useEffect(() => {
    // Check if we're returning from WiPay
    const hasPaymentParams = searchParams.get("status") !== null;
    
    if (hasPaymentParams && typeof window !== 'undefined') {
      // Force a token refresh by setting it again from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        // Ensure token is also in cookie for middleware
        document.cookie = `token=${token}; path=/; max-age=${60*60*24*7}; samesite=lax`; // 7 days
        console.log('Refreshed authentication token in cookies after WiPay redirect');
      }
    }
  }, [searchParams]);
  
  // Check for payment result in URL and restore authentication if needed
  useEffect(() => {
    // Check if we have a stored auth token from before the WiPay redirect
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('wipay_auth_token');
      if (storedToken) {
        // Restore the token to localStorage
        localStorage.setItem('token', storedToken);
        // Set the token in cookies for middleware
        document.cookie = `token=${storedToken}; path=/; max-age=${60*60*24*7}; samesite=lax`; // 7 days
        // Clean up session storage
        sessionStorage.removeItem('wipay_auth_token');
        console.log('Restored authentication token after WiPay redirect');
      }
    }
    
    const status = searchParams.get("status");
    const message = searchParams.get("message");
    const transactionId = searchParams.get("transaction_id");
    
    // Only process if we have payment parameters and haven't processed them yet
    if (status && !hasProcessedCallback) {
      setPaymentStatus(status);
      setPaymentMessage(message);
      setPaymentTransactionId(transactionId);
      setShowPaymentModal(true);
      setHasProcessedCallback(true);
      
      // Clean up URL parameters to avoid reprocessing on refresh
      // but preserve the invoice ID
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url);
    }
  }, [searchParams, hasProcessedCallback]);
  
  // Fetch invoice data using the useInvoice hook
  const { data: invoice, isLoading, isError, error } = useInvoice(resolvedParams.id);
  
  // Fetch related packages
  const { data: relatedPackages, isLoading: isLoadingPackages } = usePackagesByInvoiceId(resolvedParams.id);
  
  // Deduplicate relatedPackages by id
  const uniquePackages = Array.isArray(relatedPackages)
    ? relatedPackages.filter((pkg, idx, arr) => arr.findIndex(p => p.id === pkg.id) === idx)
    : [];
  
  // Fetch user data
  const { data: user } = useUser(invoice?.userId);
  
  // Fetch company data
  const { data: company } = useMyCompany();

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500"
      case "unpaid":
        return "bg-amber-500"
      case "overdue":
        return "bg-red-500"
      case "draft":
        return "bg-gray-500"
      case "pre_alert":
        return "bg-gray-500"
      case "received":
        return "bg-blue-500"
      case "processing":
        return "bg-amber-500"
      case "ready_for_pickup":
        return "bg-green-500"
      case "in_transit":
        return "bg-blue-600"
      case "delivered":
        return "bg-green-700"
      default:
        return "bg-gray-500"
    }
  }

  // Add currency conversion support
  const { selectedCurrency, setSelectedCurrency, convertAndFormat, exchangeRateSettings } = useCurrency();

  if (isLoading) {
    return <InvoiceDetailsSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h3 className="text-xl font-semibold mb-2">Error Loading Invoice</h3>
        <p className="text-muted-foreground mb-4">{error?.message || "Failed to load invoice details"}</p>
        <Button asChild variant="outline">
          <Link href="/customer/invoices">Return to Invoices</Link>
        </Button>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h3 className="text-xl font-semibold mb-2">Invoice Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested invoice could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/customer/invoices">Return to Invoices</Link>
        </Button>
      </div>
    )
  }

  // Get status label from status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid"
      case "unpaid":
        return "Unpaid"
      case "overdue":
        return "Overdue"
      case "draft":
        return "Draft"
      case "pre_alert":
        return "Pre-Alert"
      case "received":
        return "Received"
      case "processing":
        return "Processing"
      case "ready_for_pickup":
        return "Ready for Pickup"
      case "in_transit":
        return "In Transit"
      case "delivered":
        return "Delivered"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Payment Result Modal */}
      <PaymentResultModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        status={paymentStatus}
        message={paymentMessage}
        transactionId={paymentTransactionId}
        error={paymentError}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/customer/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Invoice</h1>
            <p className="text-sm text-muted-foreground">
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          
          <div className="flex items-center gap-2">
            <Select
              value={selectedCurrency}
              onValueChange={(value: SupportedCurrency) => setSelectedCurrency(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="JMD">JMD (J$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {invoice && relatedPackages && user && company ? (
            <InvoicePDFRenderer
              invoice={invoice}
              packages={relatedPackages}
              user={user}
              company={company}
              buttonText="Download PDF"
              currency={selectedCurrency}
              exchangeRateSettings={exchangeRateSettings || undefined}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
            >
              <Download className="mr-2 h-4 w-4" />
              Loading PDF...
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Issued on {new Date(invoice.issueDate).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(invoice.status)}>
                {getStatusLabel(invoice.status)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoice Date</h3>
                    <p className="text-base">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                    <p className={`text-base ${invoice.status === "overdue" ? "text-red-600 font-medium" : ""}`}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                    <p className="text-base">{invoice.invoiceNumber}</p>
                  </div>
                  {invoice.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                      <p className="text-base">{invoice.notes}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                    <CustomerNameDisplay userId={invoice.userId} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                    <CompanyNameDisplay companyId={invoice.companyId} />
                  </div>
                </div>
              </div>
              
              <Separator />
              
                  <div>
                    <h3 className="mb-4 text-base font-medium">Related Packages</h3>
                {isLoadingPackages ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : uniquePackages && uniquePackages.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tracking #</TableHead>
                            <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {uniquePackages.map((pkg) => (
                            <TableRow key={pkg.id}>
                              <TableCell className="font-medium">{pkg.trackingNumber}</TableCell>
                            <TableCell>{pkg.description || "No description"}</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(pkg.status)}>
                                {getStatusLabel(pkg.status || "unknown")}
                              </Badge>
                            </TableCell>
                              <TableCell className="text-right">
                              <Button asChild variant="ghost" size="icon">
                                  <Link href={`/customer/packages/${pkg.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                ) : (
                  <p className="text-muted-foreground">No packages associated with this invoice.</p>
                )}
                  </div>
              
                  <Separator />
              
              <div>
                <h3 className="mb-4 text-base font-medium">Invoice Items</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                            <TableCell className="text-right">${parseFloat(item.lineTotal).toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">No items on this invoice</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span>${parseFloat(invoice.subtotal?.toString() || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tax</span>
                    <span>${parseFloat(invoice.taxAmount?.toString() || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${parseFloat(invoice.totalAmount?.toString() || "0").toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>
                {invoice.status === "paid" 
                  ? "This invoice has been paid"
                  : "Make a payment for this invoice"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoice.status === "paid" ? (
                <div className="space-y-4">
                  <div className="rounded-md bg-green-50 p-4 text-green-700">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <p className="font-medium">Payment Complete</p>
                    </div>
                    <p className="text-sm mt-1">
                      This invoice has been fully paid.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/customer/payments')}
                  >
                    View Payment History
                  </Button>
                </div>
              ) : (
                <PayNowButton invoice={invoice} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InvoiceDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-20 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40 mt-1" />
              </div>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-32 mt-1" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-40 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
              
              <Skeleton className="h-px w-full" />
              
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <Skeleton className="h-px w-full" />
              
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 