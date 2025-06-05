"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Download, ExternalLink, FileText, Printer } from "lucide-react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInvoice } from "@/hooks/useInvoices"
import { usePackagesByInvoiceId } from "@/hooks/usePackages"
import { useUser } from "@/hooks/useUsers"
import { useMyCompany } from "@/hooks/useCompanies"
import InvoicePDFRenderer from "@/components/invoices/InvoicePDFRenderer"
import { Skeleton } from "@/components/ui/skeleton"

// Define types for the payment history
type PaymentHistory = {
  date: string;
  method: string;
  transactionId: string;
  amount: string;
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

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const resolvedParams = use(params);
  
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
          
          {invoice && relatedPackages && user && company ? (
            <InvoicePDFRenderer
              invoice={invoice}
              packages={relatedPackages}
              user={user}
              company={company}
              buttonText="Download PDF"
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
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-right">
                              ${typeof item.lineTotal === 'string' 
                                ? parseFloat(item.lineTotal).toFixed(2)
                                : (item.lineTotal || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                            No detailed items available
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="text-right font-medium">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right">
                          ${typeof invoice.subtotal === 'string' 
                            ? parseFloat(invoice.subtotal).toFixed(2)
                            : (invoice.subtotal || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-right font-medium">
                          Tax
                        </TableCell>
                        <TableCell className="text-right">
                          ${typeof invoice.taxAmount === 'string' 
                            ? parseFloat(invoice.taxAmount).toFixed(2)
                            : (invoice.taxAmount || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-right font-medium">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${typeof invoice.totalAmount === 'string' 
                            ? parseFloat(invoice.totalAmount).toFixed(2)
                            : (invoice.totalAmount || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Show payment history only if payments property exists and has items */}
              {((invoice as any).payments && Array.isArray((invoice as any).payments) && (invoice as any).payments.length > 0) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-4 text-base font-medium">Payment History</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {((invoice as any).payments as any[]).map((payment: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(payment.date || payment.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{payment.method || payment.paymentMethod || 'Unknown'}</TableCell>
                              <TableCell className="font-mono text-xs">{payment.transactionId || payment.id || 'N/A'}</TableCell>
                              <TableCell className="text-right">
                                ${typeof payment.amount === 'string' 
                                  ? parseFloat(payment.amount).toFixed(2)
                                  : (payment.amount || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>
                {invoice.status === "paid" 
                  ? "This invoice has been paid in full." 
                  : `Due on ${new Date(invoice.dueDate).toLocaleDateString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Due:</span>
                  <span className="font-bold text-lg">
                    ${typeof invoice.totalAmount === 'string' 
                      ? parseFloat(invoice.totalAmount).toFixed(2)
                      : (invoice.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <Separator />
                {invoice.status === "paid" ? (
                  <div className="rounded-md bg-green-50 p-4 text-green-700 text-sm">
                    <p>Payment complete. Thank you!</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {invoice.status === "overdue" 
                      ? "This invoice is past due. Please make payment as soon as possible." 
                      : "Please make payment before the due date."}
                  </p>
                )}
              </div>
            </CardContent>
            {invoice.status !== "paid" && (
              <CardFooter className="border-t px-6 pt-4">
                <Button className="w-full" disabled variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now (Coming Soon)
                </Button>
                <div className="text-xs text-muted-foreground text-center mt-2">
                  Online payments are not yet available. Please pay in person or contact support.
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader component
function InvoiceDetailsSkeleton() {
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <div className="space-y-1">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-[200px] w-full" />
              
              <Separator />
              
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Separator />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 