"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Download, ExternalLink, FileText, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usePayment, useDownloadPaymentReceipt } from "@/hooks/usePayments"
import { Skeleton } from "@/components/ui/skeleton"

export default function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const resolvedParams = use(params);
  
  // Fetch payment data using the usePayment hook
  const { data: payment, isLoading, isError, error } = usePayment(resolvedParams.id);
  const { mutate: downloadReceipt, isPending: isDownloading } = useDownloadPaymentReceipt();

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      case "refunded":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get status label from status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "processing":
        return "Processing"
      case "failed":
        return "Failed"
      case "refunded":
        return "Refunded"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  // Format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Get currency symbol
  const getCurrencySymbol = (currency = 'USD') => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'JMD': 'J$'
    };
    return symbols[currency] || '$';
  };

  // Get payment currency
  const paymentCurrency = payment.meta?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(paymentCurrency);

  if (isLoading) {
    return <PaymentDetailsSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h3 className="text-xl font-semibold mb-2">Error Loading Payment</h3>
        <p className="text-muted-foreground mb-4">{error?.message || "Failed to load payment details"}</p>
        <Button asChild variant="outline">
          <Link href="/customer/payments">Return to Payments</Link>
        </Button>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h3 className="text-xl font-semibold mb-2">Payment Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested payment could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/customer/payments">Return to Payments</Link>
        </Button>
      </div>
    )
  }

  // Format date for display - check metadata first, then use paymentDate, fall back to createdAt
  let dateToUse;
  
  // First try using metadata if available (especially for WiPay payments)
  if (payment?.meta) {
    const metaDate = payment.meta.transactionTimestamp || 
                     payment.meta.paymentProcessedAt || 
                     payment.meta.wiPayCallback?.timestamp || 
                     payment.meta.wiPayCallback?.date;
    
    if (metaDate) {
      const date = new Date(metaDate);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1971) {
        dateToUse = metaDate;
        console.log('Using date from payment metadata:', metaDate);
      }
    }
  }
  
  // Fall back to payment date or creation date
  if (!dateToUse) {
    dateToUse = payment?.paymentDate || payment?.createdAt;
  }
  
  // Format the date and time
  let formattedDate = "N/A";
  let formattedTime = "";
  
  if (dateToUse) {
    const date = new Date(dateToUse);
    // Check if the date is valid and not from 1970
    if (!isNaN(date.getTime()) && date.getFullYear() > 1971) {
      formattedDate = date.toLocaleDateString();
      formattedTime = date.toLocaleTimeString();
    } else {
      console.log('Invalid payment date detected:', dateToUse);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/customer/payments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Payment Receipt</h1>
            <p className="text-sm text-muted-foreground">
              {payment.reference || `Receipt-${payment.id.substring(0, 8)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => downloadReceipt(payment.id)}
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Transaction completed on {formattedDate}
            </CardDescription>
          </div>
          <Badge className={getStatusBadgeColor(payment.status)}>
            {getStatusLabel(payment.status)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Date</h3>
                <p className="text-base">{formattedDate} {formattedTime && `at ${formattedTime}`}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                <p className="text-base">{payment.paymentMethod || "Credit Card"}</p>
                {payment.paymentDetails && (
                  <p className="text-sm text-muted-foreground">{payment.paymentDetails}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Transaction ID</h3>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-mono">{payment.transactionId || payment.id}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                <p className="text-base">Customer ID: {payment.userId}</p>
                {payment.companyId && (
                  <p className="text-base">Company ID: {payment.companyId}</p>
                )}
              </div>
              {payment.invoiceId && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                  <Link href={`/customer/invoices/${payment.invoiceId}`} className="text-base text-primary hover:underline">
                    {payment.reference || payment.invoiceId}
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="mb-4 text-base font-medium">Payment Summary</h3>
            <div className="rounded-md border">
              <div className="p-4">
                <div className="space-y-2">
                  {payment.items && payment.items.length > 0 ? (
                    payment.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span>{formatCurrency(item.amount, paymentCurrency)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>Invoice Payment</span>
                      <span>{formatCurrency(payment.amount, paymentCurrency)}</span>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-base font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(payment.amount, paymentCurrency)}</span>
                </div>
                {payment.meta?.exchangeRate && payment.meta?.exchangeRate !== 1 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Exchange rate: $1 USD = {getCurrencySymbol(paymentCurrency)}{payment.meta.exchangeRate} {paymentCurrency}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>If you have any questions about this payment, please contact our support team.</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t px-6 pt-4">
          <Button variant="outline" asChild>
            <Link href="/customer/payments">Return to Payment History</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Skeleton loader component
function PaymentDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60 mt-1" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-5 w-40" />
                  {i === 2 && <Skeleton className="h-4 w-36 mt-1" />}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <div className="space-y-1">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-[100px] w-full" />
          </div>
          
          <Skeleton className="h-16 w-full" />
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Skeleton className="h-10 w-40 mx-auto" />
        </CardFooter>
      </Card>
    </div>
  )
} 