"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, AlertCircle, CheckCircle, Package, CreditCard, User, Mail, Phone, MapPin, Hash, Clock, Building2, Contact, UserX, UserCheck, Trash2, Pencil, X, Check, Info, Calendar } from "lucide-react";
import { useUser } from "@/hooks/useUsers";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerStatisticsForAdmin } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { AddPackageModal } from "@/components/packages/AddPackageModal";
import { useGenerateInvoice } from '@/hooks/useInvoices';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePayAllInvoices } from '@/hooks/usePayments';
import { QuickInvoiceDialog } from "@/components/invoices/QuickInvoiceDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCustomerViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Add filter state for each table
  const [packageFilter, setPackageFilter] = useState({ status: '', search: '' });
  const [prealertFilter, setPrealertFilter] = useState({ status: '', search: '' });
  const [paymentFilter, setPaymentFilter] = useState({ status: '', search: '' });
  const [invoiceFilter, setInvoiceFilter] = useState({ status: '', search: '' });

  // Add state for AddPackageModal
  const [addPackageOpen, setAddPackageOpen] = useState(false);

  // Quick Invoice
  const [quickInvoiceOpen, setQuickInvoiceOpen] = useState(false);
  const [quickInvoicePackageId, setQuickInvoicePackageId] = useState<string | null>(null);

  // Add state for Pay All Invoices modal
  const [payAllInvoicesOpen, setPayAllInvoicesOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [paymentNotes, setPaymentNotes] = useState("");
  const payAllInvoicesMutation = usePayAllInvoices();

  // Handlers for action buttons
  const handleAddPackage = useCallback(() => {
    setAddPackageOpen(true);
  }, []);
  const handleMatchPrealerts = useCallback(() => {
    // TODO: Open match prealerts modal or trigger match
    toast({ title: 'Match Prealerts', description: 'Open match prealerts modal/action (not implemented).' });
    // router.refresh(); // Uncomment when API call is implemented
  }, [toast]);
  const handleMakePayment = useCallback(() => {
    setPayAllInvoicesOpen(true);
  }, []);
  const handleGenerateInvoice = useCallback(() => {
    router.push(`/admin/invoices/create?customerId=${userId}`);
  }, [router, userId]);

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
          queryClient.invalidateQueries({ queryKey: ['admin-user-packages', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-prealerts', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-payments', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-invoices', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['customer-statistics', userId, companyId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId], exact: true });
          // router.refresh(); // Not needed for client data
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
          queryClient.invalidateQueries({ queryKey: ['admin-user-packages', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-prealerts', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-payments', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-invoices', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['customer-statistics', userId, companyId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId], exact: true });
          // router.refresh();
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
          queryClient.invalidateQueries({ queryKey: ['admin-user-packages', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-prealerts', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-payments', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-invoices', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['customer-statistics', userId, companyId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId], exact: true });
          // router.refresh();
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
          queryClient.invalidateQueries({ queryKey: ['admin-user-packages', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-prealerts', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-payments', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-invoices', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['customer-statistics', userId, companyId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId], exact: true });
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
  const formatCurrency = (amount?: number | string) => {
    if (amount === null || amount === undefined) return "-";
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(num)) return "-";
    return `$${num.toFixed(2)}`;
  };
  // Format payment method by removing underscores and capitalizing words
  const formatPaymentMethod = (method?: string) => {
    if (!method) return "-";
    return method
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Add a type guard for paginated API results
  function isPaginatedResult(obj: any): obj is { pagination: { page: number; pageSize: number; totalCount: number; totalPages: number } } {
    return obj && typeof obj === 'object' && obj.pagination && typeof obj.pagination.page === 'number';
  }

  // Add after user, companyId are available
  const { data: stats, isLoading: statsLoading, error: statsError } = useCustomerStatisticsForAdmin(userId, companyId!);

  // Handler for quick invoice
  const handleQuickInvoice = (packageId: string) => {
    setQuickInvoicePackageId(packageId);
    setQuickInvoiceOpen(true);
  };

  // Handle paying all invoices
  const handlePayAllInvoices = () => {
    if (!userId) return;
    
    payAllInvoicesMutation.mutate(
      {
        userId,
        paymentMethod,
        notes: paymentNotes
      },
      {
        onSuccess: (result) => {
          // Check result structure
          if (result.results && result.results.length > 0) {
            toast({
              title: "Payments processed",
              description: `Successfully processed ${result.results.length} invoice payments.`,
              variant: "default"
            });
          } else {
            toast({
              title: "No payments processed",
              description: result.message || "No outstanding invoices found or all payments failed.",
              variant: "default"
            });
          }
          
          // Close the modal
          setPayAllInvoicesOpen(false);
          
          // Reset form
          setPaymentMethod("credit_card");
          setPaymentNotes("");
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['admin-user-payments', companyId, userId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-user-invoices', companyId, userId], exact: false });
        },
        onError: (error: any) => {
          toast({
            title: "Payment processing failed",
            description: error.message || "Failed to process payments for outstanding invoices.",
            variant: "destructive"
          });
        }
      }
    );
  };

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
    <div className="py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Customer Details</h1>
      <Card className="border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{user.firstName} {user.lastName}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant={user.isActive ? "success" : "destructive"} className="px-4 py-1.5 text-sm font-semibold">
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline" className="px-4 py-1.5 text-sm font-semibold">
                  {user.role}
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              {user.isActive ? (
                <Button variant="destructive" onClick={handleDeactivate} disabled={deactivateUserMutation.status === 'pending'} className="font-semibold">
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              ) : (
                <Button variant="default" onClick={handleReactivate} disabled={reactivateUserMutation.status === 'pending'} className="font-semibold">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Reactivate
                </Button>
              )}
              <Button variant="outline" onClick={handleHardDelete} disabled={deleteUserMutation.status === 'pending'} className="font-semibold">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-muted-foreground mb-4">Personal Information</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">First Name</dt>
                  <dd className="text-sm font-medium">{user.firstName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">Last Name</dt>
                  <dd className="text-sm font-medium">{user.lastName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">Email Address</dt>
                  <dd className="text-sm font-medium">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">Phone Number</dt>
                  <dd className="text-sm font-medium">
                    {user.phone ? user.phone : <span className="text-muted-foreground">Not provided</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">TRN</dt>
                  <dd className="text-sm">
                    {editTrn ? (
                      <span className="flex items-center gap-2">
                        <Input value={trnValue} onChange={e => setTrnValue(e.target.value)} className="w-32 font-medium" />
                        <Button size="sm" onClick={handleTrnSave} disabled={updateUserMutation.status === 'pending'}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditTrn(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-32 px-3 py-2 border border-muted rounded bg-muted/20 text-sm select-text"
                          style={{ minHeight: '2.25rem', display: 'inline-flex', alignItems: 'center' }}
                        >
                          {user.trn ? user.trn : <span className="text-muted-foreground">N/A</span>}
                        </span>
                        <Button size="sm" variant="ghost" onClick={handleTrnEdit}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-medium text-muted-foreground mb-4">Address Information</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">Address</dt>
                  <dd className="text-sm whitespace-pre-wrap">
                    {user.address ? user.address : <span className="text-muted-foreground">No address provided</span>}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-muted-foreground mb-4">Account Information</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">Status</dt>
                  <dd className="text-sm">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">Created</dt>
                  <dd className="text-sm">{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-normal text-muted-foreground mb-1">Internal ID</dt>
                  <dd className="text-sm font-mono">{user.prefId || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Customer Statistics Section */}
      <h2 className="text-xl font-semibold tracking-tight mt-10 mb-4">Customer Statistics</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Packages */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-blue-900">Total Packages</CardTitle>
            </div>
            <div className="rounded-full bg-blue-100 p-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20 rounded" />
            ) : (
              <div className="text-3xl font-bold text-blue-900">{stats?.totalPackages ?? '-'}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">All packages for this customer</div>
          </CardContent>
        </Card>
        {/* Delivered */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-green-900">Delivered</CardTitle>
            </div>
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20 rounded" />
            ) : (
              <div className="text-3xl font-bold text-green-900">{stats?.packagesByStatus?.delivered ?? 0}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">Completed deliveries</div>
          </CardContent>
        </Card>
        {/* Pre-Alerts */}
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-yellow-900">Pre-Alerts</CardTitle>
            </div>
            <div className="rounded-full bg-yellow-100 p-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20 rounded" />
            ) : (
              <div className="text-3xl font-bold text-yellow-900">{stats?.pendingPreAlerts ?? 0}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">Registered pre-alerts</div>
          </CardContent>
        </Card>
        {/* Outstanding Invoices */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-red-900">Outstanding Invoices</CardTitle>
            </div>
            <div className="rounded-full bg-red-100 p-2">
              <CreditCard className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20 rounded" />
            ) : (
              <div className="text-3xl font-bold text-red-900">{stats?.outstandingInvoices?.count ?? 0}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">Unpaid invoices</div>
          </CardContent>
        </Card>
      </div>
      {statsError && (
        <div className="text-red-600 mt-2">Failed to load statistics.</div>
      )}

      <div className="mt-8">
        <div className="flex gap-4 mb-4">
          <button className={`px-3 py-1 rounded transition text-base ${tab === "packages" ? "font-bold underline text-primary" : "hover:underline"}`} onClick={() => setTab("packages")}>Packages</button>
          <button className={`px-3 py-1 rounded transition text-base ${tab === "prealerts" ? "font-bold underline text-primary" : "hover:underline"}`} onClick={() => setTab("prealerts")}>Pre-alerts</button>
          <button className={`px-3 py-1 rounded transition text-base ${tab === "payments" ? "font-bold underline text-primary" : "hover:underline"}`} onClick={() => setTab("payments")}>Payments</button>
          <button className={`px-3 py-1 rounded transition text-base ${tab === "invoices" ? "font-bold underline text-primary" : "hover:underline"}`} onClick={() => setTab("invoices")}>Invoices</button>
        </div>
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          {tab === "packages" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search tracking number..."
                    value={packageFilter.search}
                    onChange={e => setPackageFilter(f => ({ ...f, search: e.target.value }))}
                    className="w-48"
                  />
                  <select
                    value={packageFilter.status}
                    onChange={e => setPackageFilter(f => ({ ...f, status: e.target.value }))}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">All Statuses</option>
                    <option value="delivered">Delivered</option>
                    <option value="ready_for_pickup">Ready for Pickup</option>
                    <option value="returned">Returned</option>
                    <option value="processed">Processed</option>
                    <option value="received">Received</option>
                    <option value="pre_alert">Pre-Alert</option>
                  </select>
                </div>
                <Button onClick={handleAddPackage} variant="default">Add Package</Button>
              </div>
              <EnhancedDataTableWithQuickInvoice
                type="package"
                data={getArray(packagesData).filter(pkg =>
                  (!packageFilter.status || (pkg as any).status === packageFilter.status) &&
                  (!packageFilter.search || ((pkg as any).trackingNumber || '').toLowerCase().includes(packageFilter.search.toLowerCase()))
                )}
                loading={packagesLoading}
                error={packagesError}
                formatDate={formatDate}
                onQuickInvoice={handleQuickInvoice}
                {...(isPaginatedResult(packagesData) ? {
                  pagination: packagesData.pagination,
                  page: packagesPage,
                  pageSize: packagesPageSize,
                  onPageChange: setPackagesPage,
                  onPageSizeChange: setPackagesPageSize,
                } : {})}
              />
            </div>
          )}
          {tab === "prealerts" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search tracking number..."
                    value={prealertFilter.search}
                    onChange={e => setPrealertFilter(f => ({ ...f, search: e.target.value }))}
                    className="w-48"
                  />
                  <select
                    value={prealertFilter.status}
                    onChange={e => setPrealertFilter(f => ({ ...f, status: e.target.value }))}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">All Statuses</option>
                    <option value="matched">Matched</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <Button onClick={handleMatchPrealerts} variant="default">Match Prealerts</Button>
              </div>
              <EnhancedDataTable
                type="prealert"
                data={getArray(preAlertsData).filter(pre =>
                  (!prealertFilter.status || (pre as any).status === prealertFilter.status) &&
                  (!prealertFilter.search || ((pre as any).trackingNumber || '').toLowerCase().includes(prealertFilter.search.toLowerCase()))
                )}
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
            </div>
          )}
          {tab === "payments" && (
            <div>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Search method..."
                  value={paymentFilter.search}
                  onChange={e => setPaymentFilter(f => ({ ...f, search: e.target.value }))}
                  className="w-48"
                />
                <select
                  value={paymentFilter.status}
                  onChange={e => setPaymentFilter(f => ({ ...f, status: e.target.value }))}
                  className="border rounded px-2 py-1"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <EnhancedDataTable
                type="payment"
                data={getArray(paymentsData).filter(pay =>
                  (!paymentFilter.status || (pay as any).status === paymentFilter.status) &&
                  (!paymentFilter.search || ((pay as any).paymentMethod || '').toLowerCase().includes(paymentFilter.search.toLowerCase()))
                )}
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
            </div>
          )}
          {tab === "invoices" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search invoice number..."
                    value={invoiceFilter.search}
                    onChange={e => setInvoiceFilter(f => ({ ...f, search: e.target.value }))}
                    className="w-48"
                  />
                  <select
                    value={invoiceFilter.status}
                    onChange={e => setInvoiceFilter(f => ({ ...f, status: e.target.value }))}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="issued">Issued</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleGenerateInvoice} variant="default">Generate Invoice</Button>
                </div> 
              </div>
              <EnhancedDataTable
                type="invoice"
                data={getArray(invoicesData).filter(inv =>
                  (!invoiceFilter.status || (inv as any).status === invoiceFilter.status) &&
                  (!invoiceFilter.search || ((inv as any).invoiceNumber || '').toLowerCase().includes(invoiceFilter.search.toLowerCase()))
                )}
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
            </div>
          )}
        </div>
      </div>

      {/* AddPackageModal integration */}
      <AddPackageModal
        open={addPackageOpen}
        onClose={() => setAddPackageOpen(false)}
        customerId={userId}
        customerSelectable={false}
        companyId={user.companyId}
        onSuccess={() => {
          toast({ title: 'Package added', description: 'A new package was added for this customer.' });
          queryClient.invalidateQueries({ queryKey: ['admin-user-packages', companyId, userId], exact: false });
        }}
      />

      {/* Quick Invoice Dialog */}
      <QuickInvoiceDialog 
        open={quickInvoiceOpen}
        onOpenChange={setQuickInvoiceOpen}
        packageId={quickInvoicePackageId}
        userId={userId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-user-invoices', companyId, userId], exact: false });
        }}
      />

      {/* Pay All Invoices Dialog */}
      <Dialog open={payAllInvoicesOpen} onOpenChange={setPayAllInvoicesOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pay All Outstanding Invoices</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
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
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add payment notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayAllInvoicesOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayAllInvoices} 
              disabled={payAllInvoicesMutation.isPending}
            >
              {payAllInvoicesMutation.isPending ? "Processing..." : "Pay All Invoices"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  formatCurrency?: (amount?: number | string) => string,
  pagination?: { page: number, pageSize: number, totalCount: number, totalPages: number },
  page?: number,
  pageSize?: number,
  onPageChange?: (page: number) => void,
  onPageSizeChange?: (size: number) => void,
}) {
  // Format payment method by removing underscores and capitalizing words
  const formatPaymentMethod = (method?: string) => {
    if (!method) return "-";
    return method
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };
  
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
          { key: 'amount', label: 'Amount', render: (row: any) => {
            return formatCurrency?.(row.amount || row.totalAmount);
          }},
          { key: 'paymentMethod', label: 'Method', render: (row: any) => {
            if (!row.paymentMethod) return '-';
            return row.paymentMethod
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase());
          }},
          { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status} type="payment" /> },
          { key: 'paymentDate', label: 'Date', render: (row: any) => formatDate?.(row.paymentDate || row.createdAt) },
        ];
      case 'invoice':
        return [
          { key: 'invoiceNumber', label: 'Invoice #', render: (row: any) => <Link className="text-primary underline" href={`/admin/invoices/${row.id}`}>{row.invoiceNumber}</Link> },
          { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status} type="invoice" /> },
          { key: 'totalAmount', label: 'Total', render: (row: any) => {
            return formatCurrency?.(row.totalAmount || row.amount);
          }},
          { key: 'issueDate', label: 'Issued', render: (row: any) => formatDate?.(row.issueDate || row.createdAt) },
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
  
  // Mobile card view for small screens
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <div>
      {isMobileView ? (
        // Mobile card view
        <div className="space-y-4">
          {data.map((row, i) => (
            <Card key={row.id || i} className="overflow-hidden">
              <CardHeader className="p-4 bg-muted/30">
                <CardTitle className="text-sm font-medium">
                  {type === 'package' && row.trackingNumber}
                  {type === 'prealert' && row.trackingNumber}
                  {type === 'payment' && `Payment #${row.id?.slice(0,8) || i}`}
                  {type === 'invoice' && row.invoiceNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid gap-1 pt-4">
                  {columns.map(col => (
                    <div key={col.key} className="grid grid-cols-2 text-sm">
                      <span className="font-medium text-muted-foreground">{col.label}</span>
                      <span>{col.render(row)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Desktop table view
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
      )}
      
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
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

// EnhancedDataTableWithQuickInvoice: EnhancedDataTable with Quick Invoice button
function EnhancedDataTableWithQuickInvoice(props: any) {
  // Format payment method by removing underscores and capitalizing words
  const formatPaymentMethod = (method?: string) => {
    if (!method) return "-";
    return method
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };
  
  if (props.type !== 'package') return <EnhancedDataTable {...props} />;
  
  // Mobile card view for small screens
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const columns = [
    { key: 'trackingNumber', label: 'Tracking Number', render: (row: any) => <Link className="text-primary underline" href={`/admin/packages/${row.id}`}>{row.trackingNumber}</Link> },
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status} /> },
    { key: 'weight', label: 'Weight', render: (row: any) => row.weight ? `${row.weight} kg` : '-' },
    { key: 'receivedDate', label: 'Received', render: (row: any) => props.formatDate?.(row.receivedDate) },
    { key: 'actions', label: 'Actions', render: (row: any) => (
      <Button size="sm" variant="outline" onClick={() => props.onQuickInvoice(row.id)}>
        Quick Invoice
      </Button>
    ) },
  ];
  
  if (props.loading) return <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>;
  if (props.error) return <div className="text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Failed to load data.</div>;
  if (!props.data.length) return <div className="flex flex-col items-center py-8 text-muted-foreground"><span className="text-2xl mb-2">🗂️</span><span>No packages found for this customer.</span></div>;
  
  return (
    <div>
      {isMobileView ? (
        // Mobile card view
        <div className="space-y-4">
          {props.data.map((row: any, i: number) => (
            <Card key={row.id || i} className="overflow-hidden">
              <CardHeader className="p-4 bg-muted/30">
                <CardTitle className="text-sm font-medium">
                  {row.trackingNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid gap-1 pt-4">
                  {columns.map(col => (
                    <div key={col.key} className="grid grid-cols-2 text-sm">
                      <span className="font-medium text-muted-foreground">{col.label}</span>
                      <span>{col.render(row)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Desktop table view
        <div className="overflow-x-auto rounded border mt-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {columns.map(col => <th key={col.key} className="px-4 py-2 text-left font-semibold bg-muted uppercase tracking-wide text-xs">{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {props.data.map((row: any, i: number) => (
                <tr key={row.id || i} className="border-b last:border-0 hover:bg-accent/30 transition">
                  {columns.map(col => <td key={col.key} className="px-4 py-2">{col.render(row)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {props.pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
          <div className="text-sm text-muted-foreground">
            Page {props.pagination.page} of {props.pagination.totalPages} | {props.pagination.totalCount} total
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => props.onPageChange && props.onPageChange(Math.max(1, (props.page || 1) - 1))} disabled={props.pagination.page === 1}>Previous</button>
            <span className="mx-2">{props.pagination.page}</span>
            <button className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => props.onPageChange && props.onPageChange(Math.min(props.pagination.totalPages, (props.page || 1) + 1))} disabled={props.pagination.page === props.pagination.totalPages}>Next</button>
            <select className="ml-2 border rounded px-2 py-1" value={props.pageSize} onChange={e => props.onPageSizeChange && props.onPageSizeChange(Number(e.target.value))}>
              {[10, 20, 50].map((size: number) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
} 