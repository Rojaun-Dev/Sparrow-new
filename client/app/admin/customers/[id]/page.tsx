"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  useUpdateCompanyUser,
  useDeleteCompanyUser,
  useReactivateCompanyUser,
  useDeactivateCompanyUser,
} from "@/hooks/useCompanyUsers";
import {
  useAdminUserPackages,
  useAdminUserPreAlerts,
  useAdminUserPayments,
  useAdminUserInvoices,
} from "@/hooks/useAdminUserData";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";
import { useUser } from "@/hooks/useUsers";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCustomerViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.id as string;
  // companyId may be undefined if not in route
  const [companyId, setCompanyId] = useState<string | undefined>(params.companyId as string | undefined);

  // Profile
  const { data: user, isLoading: userLoading, error: userError } = useUser(userId);
  const updateUserMutation = useUpdateCompanyUser();
  const deactivateUserMutation = useDeactivateCompanyUser();
  const deleteUserMutation = useDeleteCompanyUser();
  const reactivateUserMutation = useReactivateCompanyUser();

  // Set companyId from user if not in params
  useEffect(() => {
    if (!companyId && user?.companyId) {
      setCompanyId(user.companyId);
    }
  }, [companyId, user]);

  // Pagination state for each tab
  const [packagesPage, setPackagesPage] = useState(1);
  const [packagesPageSize, setPackagesPageSize] = useState(10);
  const [prealertsPage, setPrealertsPage] = useState(1);
  const [prealertsPageSize, setPrealertsPageSize] = useState(10);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(10);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesPageSize, setInvoicesPageSize] = useState(10);

  // Related data (admin view) - always call hooks, but control with enabled and pagination
  const { data: packagesData, isLoading: packagesLoading, error: packagesError } = useAdminUserPackages(
    companyId!, userId, { enabled: !!companyId && !!userId, 
      queryKey: ['admin-user-packages', companyId, userId, packagesPage, packagesPageSize],
      // Pass pagination as query params
      select: (d: any) => d, // no transformation
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      // Pass pagination params
      staleTime: 0,
      // Custom fetcher
      queryFn: async () => {
        const url = `/companies/${companyId}/packages/user/${userId}?page=${packagesPage}&limit=${packagesPageSize}`;
        return await (await import('@/lib/api/apiClient')).apiClient.get(url);
      }
    }
  );
  const { data: preAlertsData, isLoading: preAlertsLoading, error: preAlertsError } = useAdminUserPreAlerts(
    companyId!, userId, { enabled: !!companyId && !!userId, 
      queryKey: ['admin-user-prealerts', companyId, userId, prealertsPage, prealertsPageSize],
      select: (d: any) => d, refetchOnWindowFocus: false, keepPreviousData: true, staleTime: 0,
      queryFn: async () => {
        const url = `/companies/${companyId}/prealerts/user/${userId}?page=${prealertsPage}&limit=${prealertsPageSize}`;
        return await (await import('@/lib/api/apiClient')).apiClient.get(url);
      }
    }
  );
  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError } = useAdminUserPayments(
    companyId!, userId, { enabled: !!companyId && !!userId,
      queryKey: ['admin-user-payments', companyId, userId, paymentsPage, paymentsPageSize],
      select: (d: any) => d, refetchOnWindowFocus: false, keepPreviousData: true, staleTime: 0,
      queryFn: async () => {
        const url = `/companies/${companyId}/payments/user/${userId}?page=${paymentsPage}&limit=${paymentsPageSize}`;
        return await (await import('@/lib/api/apiClient')).apiClient.get(url);
      }
    }
  );
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useAdminUserInvoices(
    companyId!, userId, { enabled: !!companyId && !!userId,
      queryKey: ['admin-user-invoices', companyId, userId, invoicesPage, invoicesPageSize],
      select: (d: any) => d, refetchOnWindowFocus: false, keepPreviousData: true, staleTime: 0,
      queryFn: async () => {
        const url = `/companies/${companyId}/invoices/user/${userId}?page=${invoicesPage}&limit=${invoicesPageSize}`;
        return await (await import('@/lib/api/apiClient')).apiClient.get(url);
      }
    }
  );

  // UI state
  const [editTrn, setEditTrn] = useState(false);
  const [trnValue, setTrnValue] = useState("");
  const [tab, setTab] = useState("packages");

  // Handle TRN edit
  const handleTrnEdit = () => {
    setEditTrn(true);
    setTrnValue(user?.trn || "");
  };
  const handleTrnSave = async () => {
    updateUserMutation.mutate(
      { userId, userData: { trn: trnValue }, companyId },
      {
        onSuccess: () => {
          toast({ title: "TRN updated", description: "User TRN was updated.", variant: "default" });
          setEditTrn(false);
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to update TRN", variant: "destructive" });
        },
      }
    );
  };

  // Deactivate (soft delete)
  const handleDeactivate = () => {
    deactivateUserMutation.mutate(
      { userId, companyId },
      {
        onSuccess: () => {
          toast({ title: "User deactivated", description: "User was deactivated.", variant: "default" });
          // Invalidate user and related queries
          router.refresh();
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to deactivate user", variant: "destructive" });
        },
      }
    );
  };

  // Reactivate
  const handleReactivate = () => {
    reactivateUserMutation.mutate(
      { userId, companyId },
      {
        onSuccess: () => {
          toast({ title: "User reactivated", description: "User was reactivated.", variant: "default" });
          router.refresh();
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to reactivate user", variant: "destructive" });
        },
      }
    );
  };

  // Hard delete
  const handleHardDelete = () => {
    if (!window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;
    deleteUserMutation.mutate(
      { userId, companyId },
      {
        onSuccess: () => {
          toast({ title: "User deleted", description: "User was permanently deleted.", variant: "default" });
          router.push("/admin/customers");
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to delete user", variant: "destructive" });
        },
      }
    );
  };

  // Helper to get array data from paginated or array response
  function getArray<T>(result: any): T[] {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result.data && Array.isArray(result.data)) return result.data;
    return [];
  }

  // Formatters
  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : "-";
  const formatDateTime = (date?: string) => date ? new Date(date).toLocaleString() : "-";
  const formatCurrency = (amount?: number) => typeof amount === "number" ? `$${amount.toFixed(2)}` : "-";

  // Add a type guard for paginated API results
  function isPaginatedResult(obj: any): obj is { pagination: { page: number; pageSize: number; totalCount: number; totalPages: number } } {
    return obj && typeof obj === 'object' && obj.pagination && typeof obj.pagination.page === 'number';
  }

  // Loading/error states
  if (userLoading || (!companyId && !userError)) return (
    <div className="flex flex-col items-center justify-center h-64 gap-2">
      <Loader className="animate-spin mr-2" />
      <span className="text-muted-foreground">Loading user...</span>
    </div>
  );
  if (userError || !user) return (
    <div className="flex flex-col items-center text-red-600 gap-2">
      <AlertCircle className="mr-2" />
      <span>Failed to load user.</span>
    </div>
  );
  if (!companyId) return (
    <div className="flex flex-col items-center text-red-600 gap-2">
      <AlertCircle className="mr-2" />
      <span>Could not determine company for this user.</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
              <div className="text-muted-foreground text-sm">{user.email}</div>
              <div className="text-muted-foreground text-sm">Role: {user.role}</div>
              <div className="text-muted-foreground text-sm">Status: {user.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-600">Inactive</span>}</div>
            </div>
            <div className="flex gap-2">
              {user.isActive ? (
                <Button variant="destructive" onClick={handleDeactivate} disabled={deactivateUserMutation.status === 'pending'}>Deactivate</Button>
              ) : (
                <Button variant="default" onClick={handleReactivate} disabled={reactivateUserMutation.status === 'pending'}>Reactivate</Button>
              )}
              <Button variant="outline" onClick={handleHardDelete} disabled={deleteUserMutation.status === 'pending'}>Delete</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-2 font-semibold">Contact Info</div>
              <div>Email: {user.email}</div>
              <div>Phone: {user.phone || <span className="text-muted-foreground">N/A</span>}</div>
              <div>Address: {user.address || <span className="text-muted-foreground">N/A</span>}</div>
              <div>TRN: {editTrn ? (
                <span className="flex items-center gap-2">
                  <Input value={trnValue} onChange={e => setTrnValue(e.target.value)} className="w-32" />
                  <Button size="sm" onClick={handleTrnSave} disabled={updateUserMutation.status === 'pending'}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditTrn(false)}>Cancel</Button>
                </span>
              ) : (
                <span className="flex items-center gap-2">{user.trn || <span className="text-muted-foreground">N/A</span>} <Button size="sm" variant="ghost" onClick={handleTrnEdit}>Edit</Button></span>
              )}</div>
            </div>
            <div>
              <div className="mb-2 font-semibold">Other Info</div>
              <div>Created: {new Date(user.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(user.updatedAt).toLocaleString()}</div>
              <div>Company ID: {user.companyId}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <div className="flex gap-4 mb-4">
          <button className={`px-3 py-1 rounded transition text-base ${tab === "packages" ? "font-bold underline text-primary" : "hover:underline"}`} onClick={() => setTab("packages")}>Packages</button>
          <button className={`px-3 py-1 rounded transition text-base ${tab === "prealerts" ? "font-bold underline text-primary" : "hover:underline"}`} onClick={() => setTab("prealerts")}>Pre-alerts</button>
          <button className={`px-3 py-1 rounded transition text-base ${tab === "payments" ? "font-bold underline text-primary" : "hover:underline"}`} onClick={() => setTab("payments")}>Payments</button>
          <button className={`px-3 py-1 rounded transition text-base ${tab === "invoices" ? "font-bold underline text-primary" : "hover:underline"}`} onClick={() => setTab("invoices")}>Invoices</button>
        </div>
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          {tab === "packages" && (
            <EnhancedDataTable
              type="package"
              data={getArray(packagesData)}
              loading={packagesLoading}
              error={packagesError}
              formatDate={formatDate}
              {...(isPaginatedResult(packagesData) ? {
                pagination: packagesData.pagination,
                page: packagesPage,
                pageSize: packagesPageSize,
                onPageChange: setPackagesPage,
                onPageSizeChange: setPackagesPageSize,
              } : {})}
            />
          )}
          {tab === "prealerts" && (
            <EnhancedDataTable
              type="prealert"
              data={getArray(preAlertsData)}
              loading={preAlertsLoading}
              error={preAlertsError}
              formatDate={formatDate}
              {...(isPaginatedResult(preAlertsData) ? {
                pagination: preAlertsData.pagination,
                page: prealertsPage,
                pageSize: prealertsPageSize,
                onPageChange: setPrealertsPage,
                onPageSizeChange: setPrealertsPageSize,
              } : {})}
            />
          )}
          {tab === "payments" && (
            <EnhancedDataTable
              type="payment"
              data={getArray(paymentsData)}
              loading={paymentsLoading}
              error={paymentsError}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              {...(isPaginatedResult(paymentsData) ? {
                pagination: paymentsData.pagination,
                page: paymentsPage,
                pageSize: paymentsPageSize,
                onPageChange: setPaymentsPage,
                onPageSizeChange: setPaymentsPageSize,
              } : {})}
            />
          )}
          {tab === "invoices" && (
            <EnhancedDataTable
              type="invoice"
              data={getArray(invoicesData)}
              loading={invoicesLoading}
              error={invoicesError}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              {...(isPaginatedResult(invoicesData) ? {
                pagination: invoicesData.pagination,
                page: invoicesPage,
                pageSize: invoicesPageSize,
                onPageChange: setInvoicesPage,
                onPageSizeChange: setInvoicesPageSize,
              } : {})}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// EnhancedDataTable: Modern, type-aware, pretty table with links, badges, formatting, loading, and empty states
function EnhancedDataTable({ type, data, loading, error, formatDate, formatCurrency, pagination, page, pageSize, onPageChange, onPageSizeChange }: {
  type: 'package' | 'prealert' | 'payment' | 'invoice',
  data: any[],
  loading?: boolean,
  error?: any,
  formatDate?: (date?: string) => string,
  formatCurrency?: (amount?: number) => string,
  pagination?: { page: number, pageSize: number, totalCount: number, totalPages: number },
  page?: number,
  pageSize?: number,
  onPageChange?: (page: number) => void,
  onPageSizeChange?: (size: number) => void,
}) {
  // Column definitions and renderers by type
  const columns = useMemo(() => {
    switch (type) {
      case 'package':
        return [
          { key: 'trackingNumber', label: 'Tracking Number', render: (row: any) => <Link className="text-primary underline" href={`/admin/packages/${row.id}`}>{row.trackingNumber}</Link> },
          { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status} /> },
          { key: 'weight', label: 'Weight', render: (row: any) => row.weight ? `${row.weight} kg` : '-' },
          { key: 'receivedDate', label: 'Received', render: (row: any) => formatDate?.(row.receivedDate) },
        ];
      case 'prealert':
        return [
          { key: 'trackingNumber', label: 'Tracking Number', render: (row: any) => row.trackingNumber },
          { key: 'courier', label: 'Courier', render: (row: any) => row.courier },
          { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status} type="prealert" /> },
          { key: 'estimatedArrival', label: 'Est. Arrival', render: (row: any) => formatDate?.(row.estimatedArrival) },
        ];
      case 'payment':
        return [
          { key: 'amount', label: 'Amount', render: (row: any) => formatCurrency?.(row.amount) },
          { key: 'paymentMethod', label: 'Method', render: (row: any) => row.paymentMethod },
          { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status} type="payment" /> },
          { key: 'paymentDate', label: 'Date', render: (row: any) => formatDate?.(row.paymentDate) },
          { key: 'id', label: 'Details', render: (row: any) => <Link className="text-primary underline" href={`/admin/payments/${row.id}`}>View</Link> },
        ];
      case 'invoice':
        return [
          { key: 'invoiceNumber', label: 'Invoice #', render: (row: any) => <Link className="text-primary underline" href={`/admin/invoices/${row.id}`}>{row.invoiceNumber}</Link> },
          { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status} type="invoice" /> },
          { key: 'totalAmount', label: 'Total', render: (row: any) => formatCurrency?.(row.totalAmount) },
          { key: 'issueDate', label: 'Issued', render: (row: any) => formatDate?.(row.issueDate) },
        ];
      default:
        return [];
    }
  }, [type, formatDate, formatCurrency]);

  if (loading) return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
    </div>
  );
  if (error) return (
    <div className="text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Failed to load data.</div>
  );
  if (!data.length) return (
    <div className="flex flex-col items-center py-8 text-muted-foreground">
      <span className="text-2xl mb-2">🗂️</span>
      <span>No {type}s found for this customer.</span>
    </div>
  );
  return (
    <div>
      <div className="overflow-x-auto rounded border mt-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {columns.map(col => <th key={col.key} className="px-4 py-2 text-left font-semibold bg-muted uppercase tracking-wide text-xs">{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i} className="border-b last:border-0 hover:bg-accent/30 transition">
                {columns.map(col => <td key={col.key} className="px-4 py-2">{col.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} | {pagination.totalCount} total
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => onPageChange && onPageChange(Math.max(1, (page || 1) - 1))} disabled={pagination.page === 1}>Previous</button>
            <span className="mx-2">{pagination.page}</span>
            <button className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => onPageChange && onPageChange(Math.min(pagination.totalPages, (page || 1) + 1))} disabled={pagination.page === pagination.totalPages}>Next</button>
            <select className="ml-2 border rounded px-2 py-1" value={pageSize} onChange={e => onPageSizeChange && onPageSizeChange(Number(e.target.value))}>
              {[10, 20, 50].map(size => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// StatusBadge: Color-coded badge for status fields
function StatusBadge({ status, type }: { status: string, type?: 'prealert' | 'payment' | 'invoice' | 'package' }) {
  let color: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' = 'secondary';
  switch (type || "package") {
    case "package":
      if (status === "delivered") color = "success";
      else if (status === "ready_for_pickup") color = "outline";
      else if (status === "returned") color = "destructive";
      else if (status === "processed") color = "outline";
      else if (status === "received") color = "default";
      else if (status === "pre_alert") color = "secondary";
      break;
    case "prealert":
      if (status === "matched") color = "success";
      else if (status === "pending") color = "outline";
      else if (status === "cancelled") color = "destructive";
      break;
    case "payment":
      if (status === "completed") color = "success";
      else if (status === "pending") color = "outline";
      else if (status === "failed" || status === "refunded") color = "destructive";
      break;
    case "invoice":
      if (status === "paid") color = "success";
      else if (status === "overdue") color = "destructive";
      else if (status === "issued") color = "outline";
      else if (status === "draft") color = "secondary";
      else if (status === "cancelled") color = "secondary";
      break;
  }
  return <Badge variant={color}>{formatStatusText(status)}</Badge>;
}

function formatStatusText(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
} 