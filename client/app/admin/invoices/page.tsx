"use client";

import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useExportCsv } from "@/hooks/useExportCsv";
import { invoiceService } from "@/lib/api/invoiceService";
import { useUsers } from "@/hooks/useUsers";
import Link from "next/link";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import InvoicePDFRenderer from '@/components/invoices/InvoicePDFRenderer';
import { useCompany, useMyAdminCompany } from '@/hooks/useCompanies';
import { usePackagesByInvoiceId } from '@/hooks/usePackages';
import { useUser } from '@/hooks/useUsers';
import { useInvoice } from '@/hooks/useInvoices';
import { useCurrency } from '@/hooks/useCurrency';
import { CurrencySelector } from '@/components/ui/currency-selector';
import type { InvoiceStatus } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<{ search: string; status: InvoiceStatus | '' }>({ search: '', status: '' });

  const { data, isLoading, error } = useInvoices({ page, limit: pageSize, search: filters.search, status: filters.status ? filters.status as InvoiceStatus : undefined });
  const { exportCsv } = useExportCsv();
  const { data: usersData } = useUsers();
  const usersMap = Array.isArray(usersData) ? usersData.reduce((acc, u) => { acc[u.id] = u; return acc; }, {}) : {};
  const { selectedCurrency, setSelectedCurrency, convertAndFormat } = useCurrency();

  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [sendNotification, setSendNotification] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async ({ id, notify }: { id: string; notify: boolean }) => {
      // You may need to update this endpoint to accept notify param if supported
      await invoiceService.deleteInvoice(id, { notify });
    },
    onSuccess: () => {
      toast({ title: 'Invoice deleted', description: 'The invoice was successfully deleted.' });
      setDeleteDialogOpen(false);
      setDeleteInvoiceId(null);
      setSendNotification(false);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to delete invoice', variant: 'destructive' });
    },
  });

  const handleExport = async () => {
    await exportCsv(async () => invoiceService.exportInvoicesCsv({ ...filters }), undefined, "invoices.csv");
  };

  const handleDelete = (id: string) => {
    setDeleteInvoiceId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteInvoiceId) {
      deleteMutation.mutate({ id: deleteInvoiceId, notify: sendNotification });
    }
  };

  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);

  // Print dialog data hooks
  const { data: printInvoice } = useInvoice(printInvoiceId || '');
  const { data: printUser } = useUser(printInvoice?.userId);
  const { data: printCompany } = useMyAdminCompany();
  const { data: printPackages } = usePackagesByInvoiceId(printInvoiceId || '');

  // Deduplicate and process items for print
  let printItems = printInvoice && Array.isArray(printInvoice.items) ? [...printInvoice.items] : [];
  const seenFixed = new Set();
  printItems = printItems.filter(item => {
    if (item.type === 'handling' || item.type === 'shipping' || item.type === 'customs' || item.type === 'other') {
      const key = `${item.type}-${item.description}`;
      if (seenFixed.has(key)) return false;
      seenFixed.add(key);
      return true;
    }
    return true;
  });
  const printSubtotal = printItems.filter(item => item.type !== 'tax').reduce((sum, item) => sum + Number(item.lineTotal), 0);
  let percentageSubtotalItems = printItems.filter(item => item.type === 'other' && item.description?.toLowerCase().includes('percentage'));
  printItems = printItems.filter(item => !(item.type === 'other' && item.description?.toLowerCase().includes('percentage')));
  if (percentageSubtotalItems.length > 0) {
    const percent = 0.01 * (parseFloat(percentageSubtotalItems[0].description.match(/\d+/)?.[0] || '10'));
    const pctAmount = printSubtotal * percent;
    printItems.push({
      ...percentageSubtotalItems[0],
      lineTotal: pctAmount,
      unitPrice: pctAmount,
      quantity: 1,
    });
  }

  const handlePrint = (id: string) => {
    setPrintInvoiceId(id);
    setPrintDialogOpen(true);
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">All Invoices</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>View and manage all invoices for your company</CardDescription>
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
          {/* Filters */}
          <div className="mb-4 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search invoice number or customer..."
              className="border rounded px-2 py-1 text-sm"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value as InvoiceStatus | '' }))}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">Failed to load invoices</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 mt-4">
                {Array.isArray(data?.data) && data.data.length > 0 ? data.data.map(inv => (
                  <Card key={inv.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{inv.invoiceNumber}</CardTitle>
                        <CardDescription>
                          {inv.status && (
                            <Badge variant={
                              inv.status === 'paid' ? 'success' : 
                              inv.status === 'overdue' ? 'destructive' : 
                              inv.status === 'draft' ? 'outline' : 
                              'secondary'
                            }>
                              {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      <div className="text-lg font-semibold">
                        {inv.totalAmount ? convertAndFormat(Number(inv.totalAmount)) : "-"}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                        <span className="text-sm">
                          {usersMap[inv.userId] ? (
                            <Link href={`/admin/customers/${inv.userId}`} className="text-blue-600 hover:underline">
                              {usersMap[inv.userId].firstName} {usersMap[inv.userId].lastName}
                            </Link>
                          ) : inv.userId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Issue Date:</span>
                        <span className="text-sm">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                        <span className="text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</span>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Link href={`/admin/invoices/${inv.id}`} passHref>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => handlePrint(inv.id)}>
                          Print
                        </Button>
                        {inv.status === 'draft' && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(inv.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No invoices found.
                  </div>
                )}
              </div>
              
              {/* Desktop Table - Hide on Mobile */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Associated Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(data?.data) && data.data.length > 0 ? data.data.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.invoiceNumber}</TableCell>
                        <TableCell>
                          {usersMap[inv.userId] ? (
                            <Link href={`/admin/customers/${inv.userId}`} className="text-blue-600 hover:underline">
                              {usersMap[inv.userId].firstName} {usersMap[inv.userId].lastName}
                            </Link>
                          ) : inv.userId}
                        </TableCell>
                        <TableCell>{inv.status}</TableCell>
                        <TableCell>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{inv.totalAmount ? convertAndFormat(Number(inv.totalAmount)) : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/admin/invoices/${inv.id}`} passHref legacyBehavior>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                            <Button size="sm" variant="outline" onClick={() => handlePrint(inv.id)}>
                              Print
                            </Button>
                            {inv.status === 'draft' && (
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(inv.id)}>
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No invoices found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {data && data.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={data.pagination.page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={data.pagination.page === data.pagination.totalPages}
                      onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                  <div>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 20, 50, 100].map(size => (
                        <option key={size} value={size}>{size} / page</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <Checkbox id="notify-checkbox" checked={sendNotification} onCheckedChange={checked => setSendNotification(checked === true)} />
            <label htmlFor="notify-checkbox" className="text-sm select-none cursor-pointer">Send notification to customer</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Invoice</DialogTitle>
            <DialogDescription>Generate and download the invoice PDF.</DialogDescription>
          </DialogHeader>
          {printInvoice && printUser && printCompany ? (
            <InvoicePDFRenderer
              invoice={{ ...printInvoice, items: printItems }}
              packages={printPackages || []}
              user={printUser}
              company={printCompany}
              buttonText="Download PDF"
              buttonProps={{ className: 'print-pdf-btn' }}
              onDownloadComplete={() => setPrintDialogOpen(false)}
            />
          ) : (
            <div className="py-8 text-center">Loading invoice data...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 