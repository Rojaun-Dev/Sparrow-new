"use client";
import { useParams } from "next/navigation";
import { useInvoice, useDownloadInvoicePdf, useCancelInvoice } from "@/hooks/useInvoices";
import { useGenerateInvoicePdf } from "@/hooks/useGenerateInvoicePdf";
import { useState } from "react";
import Link from 'next/link';
import { usePackages, useUpdatePackageStatus, useBulkUpdatePackageStatus } from '@/hooks/usePackages';
import { useUser } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMyAdminCompany } from "@/hooks/useCompanies";
import { usePackagesByInvoiceId } from '@/hooks/usePackages';
import InvoicePDFRenderer from '@/components/invoices/InvoicePDFRenderer';
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer } from "lucide-react";
import { invoiceService } from '@/lib/api/invoiceService';
import { BlobProvider } from '@react-pdf/renderer';
import InvoicePDF from '@/components/invoices/InvoicePDF';
import { PaymentProcessingModal } from "@/components/invoices/PaymentProcessingModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { SupportedCurrency } from "@/lib/api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanyLogo } from "@/hooks/useCompanyAssets";

function CustomerNameDisplay({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);
  if (isLoading) return <Skeleton className="h-5 w-40" />;
  if (!user) return <p className="text-base">Customer ID: {userId}</p>;
  return (
    <Link href={`/admin/customers/${userId}`} className="text-blue-600 hover:underline">
      {user.firstName} {user.lastName}
    </Link>
  );
}

function CompanyNameDisplay({ company }: { company: any }) {
  if (!company) return <Skeleton className="h-5 w-40" />;
  return <p className="text-base">{company.name}</p>;
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "paid": return "bg-green-500";
    case "unpaid": return "bg-amber-500";
    case "overdue": return "bg-red-500";
    case "cancelled": return "bg-red-500";
    case "draft": return "bg-gray-500";
    case "pre_alert": return "bg-gray-500";
    case "received": return "bg-blue-500";
    case "processing": return "bg-amber-500";
    case "ready_for_pickup": return "bg-green-500";
    case "in_transit": return "bg-blue-600";
    case "delivered": return "bg-green-700";
    default: return "bg-gray-500";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "paid": return "Paid";
    case "unpaid": return "Unpaid";
    case "overdue": return "Overdue";
    case "cancelled": return "Cancelled";
    case "draft": return "Draft";
    case "pre_alert": return "Pre-Alert";
    case "received": return "Received";
    case "processing": return "Processing";
    case "ready_for_pickup": return "Ready for Pickup";
    case "in_transit": return "In Transit";
    case "delivered": return "Delivered";
    default: return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }
}

// Helper to safely format numbers as currency
function safeToFixed(val: any, digits = 2) {
  const n = Number(val);
  return isNaN(n) ? '0.00' : n.toFixed(digits);
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = Array.isArray(id) ? id[0] : id;
  const { data: invoice, isLoading, error, refetch } = useInvoice(invoiceId as string);
  const { data: packages, isLoading: packagesLoading, refetch: refetchPackages } = usePackagesByInvoiceId(invoiceId as string);
  const { data: customer, isLoading: customerLoading } = useUser(invoice?.userId as string);
  const { data: company } = useMyAdminCompany();
  const { logoUrl, isUsingBanner } = useCompanyLogo(company?.id);
  const downloadPdfMutation = useDownloadInvoicePdf();
  const { generatePdf, isLoading: isPdfLoading } = useGenerateInvoicePdf(invoiceId || "");
  const { toast } = useToast();
  const updatePackageStatus = useUpdatePackageStatus();
  const bulkUpdatePackageStatus = useBulkUpdatePackageStatus();
  
  // Currency conversion
  const { selectedCurrency, setSelectedCurrency, convertAndFormat, convert, exchangeRateSettings } = useCurrency();
  
  // Payment form state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Deliver packages modal state
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  
  // Cancel invoice state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const cancelMutation = useCancelInvoice();
  
  // Prefill payment amount with total invoice amount
  const handleOpenPaymentDialog = () => {
    setShowPaymentDialog(true);
  };

  // Handle cancel invoice
  const handleCancelInvoice = () => {
    if (!invoice?.id) return;
    
    cancelMutation.mutate(invoice.id, {
      onSuccess: () => {
        toast({
          title: "Invoice cancelled",
          description: "The invoice has been cancelled and all packages have been unlinked. These packages can now be included in new invoices.",
        });
        setShowCancelDialog(false);
        refetch(); // Refresh invoice data
        refetchPackages(); // Refresh packages data to show they're no longer linked
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error?.message || "Failed to cancel invoice",
          variant: "destructive",
        });
      },
    });
  };

  // Helper function to check if invoice can be cancelled
  const canCancelInvoice = (status: string) => {
    return ['draft', 'issued', 'overdue'].includes(status);
  };

  // Remove deduplication and recalculation logic
  const items = invoice?.items || [];
  const subtotal = invoice?.subtotal ?? 0;
  const totalTax = invoice?.taxAmount ?? 0;
  const total = invoice?.totalAmount ?? 0;

  // Only show each package once in the Related Packages section
  const uniquePackages = Array.isArray(packages)
    ? packages.filter((pkg, idx, arr) => arr.findIndex(p => p.id === pkg.id) === idx)
    : [];

  // Helper function to check if packages need to be marked as ready for pickup
  const hasPackagesNotReadyForPickup = uniquePackages.some(pkg => pkg.status !== 'ready_for_pickup' && pkg.status !== 'delivered');

  // Helper function to check if packages need to be marked as delivered
  const hasPackagesNotDelivered = uniquePackages.some(pkg => pkg.status !== 'delivered');

  // Handle marking packages as ready for pickup
  const handleMarkAsReadyForPickup = async () => {
    if (!uniquePackages.length) return;

    const packagesToUpdate = uniquePackages.filter(pkg => pkg.status !== 'ready_for_pickup' && pkg.status !== 'delivered');

    if (packagesToUpdate.length === 0) {
      toast({
        title: "No packages to update",
        description: "All packages are already ready for pickup or delivered.",
      });
      return;
    }

    try {
      await bulkUpdatePackageStatus.mutateAsync({
        packageIds: packagesToUpdate.map(pkg => pkg.id),
        status: 'ready_for_pickup',
        sendNotification: true
      });

      // Refresh packages data
      refetchPackages();

      // Show success message
      toast({
        title: "Packages marked as ready for pickup",
        description: `Successfully marked ${packagesToUpdate.length} package(s) as ready for pickup.`,
      });
    } catch (error) {
      console.error('Error marking packages as ready for pickup:', error);
      toast({
        title: "Error",
        description: "Failed to mark packages as ready for pickup. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle marking packages as delivered
  const handleMarkAsDelivered = async () => {
    if (!uniquePackages.length) return;

    const packagesToUpdate = uniquePackages.filter(pkg => pkg.status !== 'delivered');

    if (packagesToUpdate.length === 0) {
      toast({
        title: "No packages to update",
        description: "All packages are already delivered.",
      });
      return;
    }

    try {
      // Mark undelivered packages as delivered
      await bulkUpdatePackageStatus.mutateAsync({
        packageIds: packagesToUpdate.map(pkg => pkg.id),
        status: 'delivered',
        sendNotification: true
      });
      
      // Refresh packages data
      refetchPackages();
      
      // Close modal
      setShowDeliverModal(false);
      
      // Show success message
      toast({
        title: "Packages marked as delivered",
        description: `Successfully marked ${packagesToUpdate.length} package(s) as delivered.`,
      });
    } catch (error) {
      console.error('Error marking packages as delivered:', error);
      toast({
        title: "Error",
        description: "Failed to mark packages as delivered. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Group items by description and type, summing their lineTotal values
  const groupedItemsMap = new Map();
  for (const item of items) {
    const key = `${item.type}||${item.description}`;
    if (!groupedItemsMap.has(key)) {
      groupedItemsMap.set(key, { ...item });
    } else {
      const existing = groupedItemsMap.get(key);
      existing.lineTotal += Number(item.lineTotal);
      existing.quantity += Number(item.quantity);
    }
  }
  const groupedItems = Array.from(groupedItemsMap.values());

  if (!invoiceId) {
    return <div className="p-8 text-center text-gray-500">Invalid invoice ID.</div>;
  }
  if (isLoading) {
    return <div className="p-8 text-center">Loading invoice...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error.message || "Failed to load invoice."}</div>;
  }
  if (!invoice) {
    return <div className="p-8 text-center text-gray-500">Invoice not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Invoice</h1>
            <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          {invoice?.status === 'cancelled' ? (
            <Button variant="outline" size="sm" disabled>
              <Printer className="mr-2 h-4 w-4" />
              Cancelled - Cannot Print
            </Button>
          ) : invoice && customer && company ? (
            <InvoicePDFRenderer
              invoice={{ ...invoice, items }}
              packages={packages || []}
              user={customer}
              company={company}
              companyLogo={logoUrl}
              isUsingBanner={isUsingBanner}
              buttonText="Print"
              buttonProps={{ className: 'print-pdf-btn' }}
              onDownloadComplete={() => {}}
              currency={selectedCurrency}
              exchangeRateSettings={exchangeRateSettings || undefined}
            />
          ) : (
            <Button variant="outline" size="sm" disabled>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          )}
          {canCancelInvoice(invoice.status) && (
            <Button variant="destructive" size="sm" onClick={() => setShowCancelDialog(true)}>
              Cancel Invoice
            </Button>
          )}
          <Button variant="secondary" disabled>Email to Customer</Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Issued on {new Date(invoice.issueDate).toLocaleDateString()}</CardDescription>
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
                    <CompanyNameDisplay company={company} />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium">Related Packages</h3>
                  <div className="flex gap-2">
                    {/* Action button for 'issued' status - mark packages as ready for pickup */}
                    {invoice?.status === 'issued' && hasPackagesNotReadyForPickup && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAsReadyForPickup}
                        disabled={bulkUpdatePackageStatus.isPending}
                        className="flex items-center gap-2"
                      >
                        {bulkUpdatePackageStatus.isPending ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Updating...
                          </>
                        ) : (
                          <>
                            📦 Mark All as Ready for Pickup
                          </>
                        )}
                      </Button>
                    )}

                    {/* Action button for 'paid' status - mark undelivered packages as delivered */}
                    {invoice?.status === 'paid' && hasPackagesNotDelivered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAsDelivered}
                        disabled={bulkUpdatePackageStatus.isPending}
                        className="flex items-center gap-2"
                      >
                        {bulkUpdatePackageStatus.isPending ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Updating...
                          </>
                        ) : (
                          <>
                            ✅ Mark All as Delivered
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {packagesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : uniquePackages && uniquePackages.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left">Tracking #</th>
                          <th className="p-2 text-left">Description</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniquePackages.map((pkg) => (
                          <tr key={pkg.id}>
                            <td className="font-medium p-2">{pkg.trackingNumber}</td>
                            <td className="p-2">{pkg.description || "No description"}</td>
                            <td className="p-2">
                              <Badge className={getStatusBadgeColor(pkg.status)}>
                                {getStatusLabel(pkg.status || "unknown")}
                              </Badge>
                            </td>
                            <td className="text-right p-2">
                              <Button asChild variant="ghost" size="icon">
                                <Link href={`/admin/packages/${pkg.id}`}>
                                  <ArrowLeft className="h-4 w-4" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No packages associated with this invoice.</p>
                )}
              </div>
              <Separator />
              <div>
                <h3 className="mb-4 text-base font-medium">Invoice Items</h3>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedItems && groupedItems.length > 0 ? (
                        groupedItems.map((item, index) => (
                          <tr key={index}>
                            <td className="font-medium p-2">{item.description}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{convertAndFormat(item.unitPrice)}</td>
                            <td className="p-2 text-right">{convertAndFormat(item.lineTotal)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center text-muted-foreground py-4">
                            No detailed items available
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={2}></td>
                        <td className="text-right font-medium">Subtotal</td>
                        <td className="text-right">{convertAndFormat(subtotal)}</td>
                      </tr>
                      {totalTax > 0 && (
                        <tr>
                          <td colSpan={2}></td>
                          <td className="text-right font-medium">Tax</td>
                          <td className="text-right">{convertAndFormat(totalTax)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={2}></td>
                        <td className="text-right font-bold">Total</td>
                        <td className="text-right font-bold">{convertAndFormat(total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
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
                    {convertAndFormat(total)}
                  </span>
                </div>
                <Separator />
                {invoice.status === "paid" ? (
                  <div className="rounded-md bg-green-50 p-4 text-green-700 text-sm">
                    <p>Payment complete. Thank you!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {invoice.status === "overdue"
                        ? "This invoice is past due. Please make payment as soon as possible."
                        : "Please make payment before the due date."}
                    </p>
                    <Button className="mt-4 w-full" variant="default" onClick={handleOpenPaymentDialog}>
                      Process Payment
                    </Button>
                    <PaymentProcessingModal
                      open={showPaymentDialog}
                      onOpenChange={setShowPaymentDialog}
                      invoiceId={invoiceId || ""}
                      userId={invoice.userId}
                      initialAmount={invoice.totalAmount?.toString() || "0"}
                      onSuccess={() => {
                        refetch(); // Refresh invoice data
                        setShowDeliverModal(true); // Show deliver modal
                      }}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Modal to mark packages as delivered after payment */}
      <Dialog open={showDeliverModal} onOpenChange={setShowDeliverModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Packages as Delivered?</DialogTitle>
            <DialogDescription>
              Payment was successful. Would you like to mark all associated packages as delivered?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliverModal(false)}>
              No, keep as ready for pickup
            </Button>
            <Button 
              variant="default" 
              onClick={handleMarkAsDelivered}
              disabled={updatePackageStatus.isPending}
            >
              {updatePackageStatus.isPending ? "Marking as delivered..." : "Yes, mark as delivered"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invoice?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this invoice? This action cannot be undone. 
              Cancelled invoices will be excluded from all revenue calculations and statistics.
              All packages will be unlinked from this invoice and can be included in new invoices.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Invoice
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelInvoice} 
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}