"use client";
import { useParams } from "next/navigation";
import { useInvoice, useDownloadInvoicePdf } from "@/hooks/useInvoices";
import { useGenerateInvoicePdf } from "@/hooks/useGenerateInvoicePdf";
import { useState } from "react";
import Link from 'next/link';
import { usePackages } from '@/hooks/usePackages';
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
import { useProcessPayment } from '@/hooks/usePayments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { data: invoice, isLoading, error, refetch } = useInvoice(id || "");
  const { data: customer } = useUser(invoice?.userId);
  const { data: company } = useMyAdminCompany();
  const { data: relatedPackages, isLoading: isLoadingPackages } = usePackagesByInvoiceId(id || "");
  const { generatePdf, isLoading: isPdfLoading } = useGenerateInvoicePdf(id || "");
  const { toast } = useToast();
  
  // Process payment hook
  const { mutate: processPayment, isPending: isProcessingPayment } = useProcessPayment();

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [transactionId, setTransactionId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);

  // Helper to update all related packages to a given status
  const updateAllPackagesStatus = async (status: string) => {
    if (!relatedPackages) return;
    setIsMarkingDelivered(true);
    try {
      await Promise.all(
        relatedPackages.map(pkg =>
          window.fetch(`/api/packages/${pkg.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, sendNotification })
          })
        )
      );
      toast({ title: `All packages marked as ${status.replace(/_/g, ' ')}` });
    } catch (err: any) {
      toast({ title: 'Failed to update packages', description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setIsMarkingDelivered(false);
      setShowDeliverModal(false);
      refetch();
    }
  };

  // Handle payment processing
  const handleProcessPayment = () => {
    if (!id || !invoice?.userId) return;
    
    // Validate amount - must be a positive number and cannot exceed the total
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return;
    }

    if (amount > parseFloat(invoice.totalAmount.toString())) {
      toast({
        title: "Amount too high",
        description: "Payment amount cannot exceed the invoice total",
        variant: "destructive"
      });
      return;
    }

    processPayment(
      {
        invoiceId: id,
        paymentData: {
          userId: invoice.userId,
          amount,
          paymentMethod: paymentMethod as any,
          transactionId: transactionId || undefined,
          notes: paymentNotes || undefined,
          status: "completed" // Mark as completed immediately
        },
        sendNotification
      },
      {
        onSuccess: async () => {
          toast({
            title: "Payment successful",
            description: "The payment has been processed successfully",
            variant: "default"
          });
          setShowPaymentDialog(false);
          // Mark all related packages as ready_for_pickup
          await updateAllPackagesStatus('ready_for_pickup');
          // Prompt to mark as delivered
          setShowDeliverModal(true);
          refetch(); // Refresh invoice data
        },
        onError: (error) => {
          toast({
            title: "Payment failed",
            description: error instanceof Error ? error.message : "An error occurred while processing the payment",
            variant: "destructive"
          });
        }
      }
    );
  };

  // Prefill payment amount with total invoice amount
  const handleOpenPaymentDialog = () => {
    if (invoice?.totalAmount) {
      setPaymentAmount(invoice.totalAmount.toString());
    }
    setShowPaymentDialog(true);
  };

  // Remove deduplication and recalculation logic
  const items = invoice?.items || [];
  const subtotal = invoice?.subtotal ?? 0;
  const totalTax = invoice?.taxAmount ?? 0;
  const total = invoice?.totalAmount ?? 0;

  // Only show each package once in the Related Packages section
  const uniquePackages = Array.isArray(relatedPackages)
    ? relatedPackages.filter((pkg, idx, arr) => arr.findIndex(p => p.id === pkg.id) === idx)
    : [];

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

  if (!id) {
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
          {invoice && customer && company ? (
            <InvoicePDFRenderer
              invoice={{ ...invoice, items }}
              packages={relatedPackages || []}
              user={customer}
              company={company}
              buttonText="Print"
              buttonProps={{ className: 'print-pdf-btn' }}
              onDownloadComplete={() => {}}
            />
          ) : (
            <Button variant="outline" size="sm" disabled>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          )}
          <Button variant="secondary" disabled>Email to Customer</Button>
          {invoice && relatedPackages && customer && company ? (
            <InvoicePDFRenderer
              invoice={invoice}
              packages={relatedPackages}
              user={customer}
              company={company}
              buttonText="Download PDF"
            />
          ) : (
            <Button variant="outline" size="sm" disabled>
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
                <h3 className="mb-4 text-base font-medium">Related Packages</h3>
                {isLoadingPackages ? (
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
                            <td className="p-2 text-right">${safeToFixed(item.unitPrice)}</td>
                            <td className="p-2 text-right">${safeToFixed(item.lineTotal)}</td>
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
                        <td className="text-right">${safeToFixed(subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={2}></td>
                        <td className="text-right font-medium">Tax</td>
                        <td className="text-right">${safeToFixed(totalTax)}</td>
                      </tr>
                      <tr>
                        <td colSpan={2}></td>
                        <td className="text-right font-bold">Total</td>
                        <td className="text-right font-bold">${safeToFixed(total)}</td>
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
                    ${safeToFixed(total)}
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
                    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                      <DialogTrigger asChild>
                        <Button className="mt-4 w-full" variant="default" onClick={handleOpenPaymentDialog}>
                          Process Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Process Payment</DialogTitle>
                          <DialogDescription>
                            Enter the payment details for invoice #{invoice.invoiceNumber}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="amount">Payment Amount</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="method">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger id="method">
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="credit_card">Credit Card</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                            <Input
                              id="transactionId"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="Enter transaction reference"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Input
                              id="notes"
                              value={paymentNotes}
                              onChange={(e) => setPaymentNotes(e.target.value)}
                              placeholder="Add payment notes"
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={sendNotification}
                                onChange={e => setSendNotification(e.target.checked)}
                              />
                              Send notification to customer
                            </label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleProcessPayment} 
                            disabled={isProcessingPayment || !paymentAmount}
                          >
                            {isProcessingPayment ? "Processing..." : "Complete Payment"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
            <Button variant="outline" onClick={() => setShowDeliverModal(false)} disabled={isMarkingDelivered}>
              No, keep as ready for pickup
            </Button>
            <Button variant="default" onClick={() => updateAllPackagesStatus('delivered')} disabled={isMarkingDelivered}>
              {isMarkingDelivered ? 'Marking...' : 'Yes, mark as delivered'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 