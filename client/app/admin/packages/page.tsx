"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal, 
  CircleDollarSign, 
  Truck, 
  ArrowUpDown,
  Eye,
  Pencil,
  Camera,
  Trash2,
  Loader2,
  UserPlus
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent,
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { useExportCsv } from '@/hooks/useExportCsv';
import { packageService } from '@/lib/api/packageService';
import { useAuth } from '@/hooks/useAuth';
import { usePackages, useUpdatePackageStatus, useAssignUserToPackage } from '@/hooks/usePackages';
import { useUsers } from '@/hooks/useUsers';
import type { Package, PackageStatus, PaginatedResponse } from '@/lib/api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useGenerateInvoice, useInvoiceByPackageId } from '@/hooks/useInvoices';
import { useRouter } from 'next/navigation';
import { apiClient } from "@/lib/api/apiClient";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { ImportStatusAlert, ImportStatusProps } from "@/components/admin/ImportStatusAlert";
import { AssignUserModal } from "@/components/packages/AssignUserModal";

// Status maps
const STATUS_LABELS: Record<string, string> = {
  pre_alert: "Pre-Alert",
  in_transit: "In Transit",
  received: "Received",
  processed: "Processed",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
  returned: "Returned"
}

const STATUS_VARIANTS: Record<string, string> = {
  pre_alert: "warning",
  in_transit: "default",
  received: "default",
  processed: "secondary",
  ready_for_pickup: "success",
  delivered: "success",
  returned: "destructive"
}

function QuickInvoiceDialog({ open, onOpenChange, packageId, userId }: { open: boolean, onOpenChange: (open: boolean) => void, packageId: string | null, userId: string | null }) {
  const { data: relatedInvoice, isLoading: isLoadingRelatedInvoice } = useInvoiceByPackageId(packageId || '');
  const generateInvoice = useGenerateInvoice();
  const router = useRouter();
  if (!packageId || !userId) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Invoice for this Package?</DialogTitle>
        </DialogHeader>
        <div>
          {isLoadingRelatedInvoice ? (
            <p>Checking for existing invoice...</p>
          ) : relatedInvoice ? (
            <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
              This package already has an invoice. You cannot generate another invoice for it.
            </div>
          ) : (
            <p>This will generate an invoice for this package and redirect you to the invoice detail page.</p>
          )}
          {generateInvoice.isError && (
            <div className="text-red-600 mt-2 text-sm">
              {generateInvoice.error instanceof Error ? generateInvoice.error.message : 'Failed to generate invoice.'}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              generateInvoice.mutate(
                { userId, packageIds: [packageId] },
                {
                  onSuccess: (invoice: any) => {
                    onOpenChange(false);
                    if (invoice && invoice.id) {
                      router.push(`/admin/invoices/${invoice.id}`);
                    }
                  },
                }
              );
            }}
            disabled={generateInvoice.isPending || !!relatedInvoice || isLoadingRelatedInvoice}
          >
            {generateInvoice.isPending ? 'Generating...' : 'Confirm'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generateInvoice.isPending}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PackagesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { exportCsv, loading: exportLoading } = useExportCsv();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const updateStatusMutation = useUpdatePackageStatus();
  const deleteMutation = useMutation({
    mutationFn: async ({ id, sendNotification }: { id: string; sendNotification?: boolean }) => {
      console.log('Inside deleteMutation.mutationFn:', { id, sendNotification });
      try {
        const result = await packageService.deletePackage(id, undefined, sendNotification);
        console.log('Delete package result:', result);
        return result;
      } catch (error) {
        console.error('Error in deletePackage:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Delete mutation succeeded');
      toast({ title: 'Package deleted', description: 'The package was deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
    onError: (err: any) => {
      console.error('Delete mutation error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to delete package', variant: 'destructive' });
    },
  });
  
  // Fetch packages from backend
  const {
    data: packagesData,
    isLoading,
    error,
    refetch
  } = usePackages({
    search: searchQuery,
    status: activeTab === 'all' ? undefined : activeTab as PackageStatus,
    page,
    limit: pageSize,
  });

  // Check if navigating from import page and refresh data
  useEffect(() => {
    // Force refresh data when the page is loaded
    refetch();
    
    // Set up a listener for focus events to refresh data
    const handleFocus = () => {
      console.log('Window focused, refreshing packages data');
      refetch();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch]);

  // Fetch all users for the company
  const { data: usersData, isLoading: usersLoading } = useUsers();
  // Build a map of userId to user object
  const userMap = (usersData && Array.isArray(usersData)) ? Object.fromEntries(usersData.map((u: any) => [u.id, u])) : {};

  const packagesDataTyped = packagesData as PaginatedResponse<Package> | undefined;
  const packages: Package[] = Array.isArray(packagesDataTyped?.data) ? packagesDataTyped.data : [];
  const pagination = packagesDataTyped?.pagination;

  // State for send notification checkboxes
  const [sendNotificationOnDelete, setSendNotificationOnDelete] = useState(true);
  const [sendNotificationOnReady, setSendNotificationOnReady] = useState(true);
  const [markReadyDialogOpen, setMarkReadyDialogOpen] = useState(false);
  const [packageToMarkReady, setPackageToMarkReady] = useState<string | null>(null);
  const [quickInvoicePackageId, setQuickInvoicePackageId] = useState<string | null>(null);
  const [quickInvoiceUserId, setQuickInvoiceUserId] = useState<string | null>(null);
  const [showQuickInvoiceDialog, setShowQuickInvoiceDialog] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatusProps>({ status: 'none' });
  const { company } = useCompanySettings();
  const [magayaSettings, setMagayaSettings] = useState({
    enabled: false,
    autoImportEnabled: false,
    dateRangePreference: 'this_week',
    networkId: '',
  });
  
  // State for assign user modal
  const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  
  // Handle opening the assign user modal
  const handleAssignUser = (packageId: string) => {
    setSelectedPackageId(packageId);
    setAssignUserModalOpen(true);
  };

  // Handle successful user assignment
  const handleAssignSuccess = () => {
    toast({
      title: "Success",
      description: "Customer assigned to package successfully",
    });
    // Refresh packages data
    refetch();
  };
  
  // Fetch Magaya integration settings on component mount
  useEffect(() => {
    const fetchMagayaSettings = async () => {
      try {
        const response = await apiClient.get<{
          magayaIntegration?: {
            enabled?: boolean;
            username?: string;
            password?: string;
            dateRangePreference?: string;
            autoImportEnabled?: boolean;
            networkId?: string;
          }
        }>('/company-settings/integration');
        
        setMagayaSettings({
          enabled: !!response?.magayaIntegration?.enabled,
          autoImportEnabled: !!response?.magayaIntegration?.autoImportEnabled,
          dateRangePreference: response?.magayaIntegration?.dateRangePreference || 'this_week',
          networkId: response?.magayaIntegration?.networkId || '',
        });
      } catch (error) {
        console.error("Failed to fetch Magaya integration settings:", error);
      }
    };
    
    fetchMagayaSettings();
  }, []);

  const openDeleteDialog = (packageId: string) => {
    setPackageToDelete(packageId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeletePackage = () => {
    console.log('Delete package handler called', { packageToDelete, sendNotificationOnDelete });
    
    // Don't close dialog or clear state until after the mutation completes
    if (packageToDelete) {
      console.log('Calling deleteMutation.mutate with:', { id: packageToDelete, sendNotification: sendNotificationOnDelete });
      
      // Direct call to the packageService instead of using mutation
      packageService.deletePackage(packageToDelete, undefined, sendNotificationOnDelete)
        .then(() => {
          console.log('Package deleted successfully');
          toast({ title: 'Package deleted', description: 'The package was deleted successfully.' });
          queryClient.invalidateQueries({ queryKey: ['packages'] });
        })
        .catch(error => {
          console.error('Error deleting package:', error);
          toast({ 
            title: 'Error', 
            description: error.message || 'Failed to delete package', 
            variant: 'destructive' 
          });
        })
        .finally(() => {
          setIsDeleteDialogOpen(false);
          setPackageToDelete(null);
        });
    } else {
      setIsDeleteDialogOpen(false);
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDimensions = (dimensions: { length?: number, width?: number, height?: number } | null | undefined) => {
    if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) return "-"
    return `${dimensions.length}″ × ${dimensions.width}″ × ${dimensions.height}″`
  }

  // Export handler
  const handleExport = async () => {
    await exportCsv(
      (params) => packageService.exportPackagesCsv(params, user?.companyId),
      {
        search: searchQuery,
        status: activeTab === 'all' ? undefined : activeTab,
        page,
        limit: pageSize,
      },
      'packages.csv'
    );
  };

  // Add handleAutoImport function
  const handleAutoImport = async () => {
    // Check if Network ID is configured
    if (!magayaSettings.networkId) {
      toast({ title: 'Network ID Required', description: 'Network ID is required for Magaya auto-import. Please configure it in Settings.', variant: 'destructive' });
      return;
    }
    
    try {
      setIsAutoImporting(true);
      setImportStatus({ status: 'pending', progress: 0 });
      const companyId = user?.companyId;
      const response = await apiClient.post(`/companies/${companyId}/auto-import/magaya`, {
        dateRange: magayaSettings.dateRangePreference
      });
      
      toast({ title: 'Auto Import Started', description: 'Connecting to Magaya and downloading data...' });
      
      // Poll for status updates
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes (2s intervals)
      
      const pollStatus = setInterval(async () => {
        attempts++;
        try {
          // Use the general status endpoint that's already set up in the backend
          interface ImportStatusResponse {
            id?: string;
            status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'none' | 'unknown';
            error?: string;
            progress?: number;
            startTime?: Date;
            endTime?: Date;
            result?: {
              successCount: number;
              failedCount?: number;
              skippedCount?: number;
              totalRecords?: number;
            };
          }
          
          const companyId = user?.companyId;
          const statusResponse = await apiClient.get<ImportStatusResponse>(`/companies/${companyId}/auto-import/status/latest`);
          
          // Update status state
          if (statusResponse) {
            setImportStatus({
              status: statusResponse.status,
              progress: statusResponse.progress || 0,
              error: statusResponse.error,
              result: statusResponse.result
            });
          }
          
          if (statusResponse && statusResponse.status === 'completed') {
            clearInterval(pollStatus);
            setIsAutoImporting(false);
            
            // Display import results
            if (statusResponse.result) {
              // Create a more detailed success message including added and skipped packages
              const addedCount = statusResponse.result.successCount || 0;
              const skippedCount = statusResponse.result.skippedCount || 0;
              
              let successMessage = `Import complete: ${addedCount} packages imported`;
              if (skippedCount > 0) {
                successMessage += `, ${skippedCount} packages skipped (already exist)`;
              }
              
              toast({ title: 'Import Complete', description: successMessage });
              
              // Refresh packages data
              refetch();
            }
          } else if (statusResponse && statusResponse.status === 'failed') {
            clearInterval(pollStatus);
            setIsAutoImporting(false);
            toast({ 
              title: 'Import Failed', 
              description: statusResponse.error || 'Unknown error', 
              variant: 'destructive' 
            });
          }
        } catch (error) {
          console.error("Failed to check import status", error);
        }
        
        // Stop polling after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(pollStatus);
          setIsAutoImporting(false);
          setImportStatus({ status: 'failed', error: 'Import process timed out' });
          toast({ 
            title: 'Import Timed Out', 
            description: 'Import process timed out. Check audit logs for details.',
            variant: 'destructive'
          });
        }
      }, 2000);
      
    } catch (error) {
      console.error("Failed to start auto import:", error);
      toast({ 
        title: 'Import Failed', 
        description: 'Failed to start auto import process',
        variant: 'destructive'
      });
      setIsAutoImporting(false);
      setImportStatus({ status: 'failed', error: 'Failed to start auto import' });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Packages</h1>
        <div className="flex items-center gap-2">
          {magayaSettings.enabled && magayaSettings.autoImportEnabled && (
            <Button 
              variant="outline"
              onClick={handleAutoImport}
              disabled={isAutoImporting}
              className="gap-1"
            >
              {isAutoImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import from Magaya
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {magayaSettings.enabled && magayaSettings.autoImportEnabled && isAutoImporting && (
        <ImportStatusAlert 
          status={importStatus.status}
          progress={importStatus.progress}
          error={importStatus.error}
          result={importStatus.result}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Packages</TabsTrigger>
            <TabsTrigger value="in_transit">In Transit</TabsTrigger>
            <TabsTrigger value="pre_alert">Pre-Alert</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
            <TabsTrigger value="ready_for_pickup">Ready for Pickup</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="returned">Returned</TabsTrigger>
          </TabsList>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Package Management</CardTitle>
            <CardDescription>Manage packages and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  className="pl-8 w-full sm:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1); // Reset to first page on search
                  }}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button asChild>
            <Link href="/admin/packages/register">
              <Plus className="mr-2 h-4 w-4" />
              Register Package
            </Link>
          </Button>
                <Button variant="outline" className="gap-1" onClick={handleExport} disabled={exportLoading}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              {isLoading || usersLoading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-600">Failed to load packages</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Package ID
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Weight</TableHead>
                      <TableHead className="hidden lg:table-cell">Dimensions</TableHead>
                      <TableHead className="hidden lg:table-cell">Received Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No packages found. Try adjusting your search or filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      packages.map((pkg) => {
                        const user = userMap[pkg.userId];
                        const customerName = user ? `${user.firstName} ${user.lastName}` : pkg.userId;
                        return (
                          <TableRow key={pkg.id}>
                            <TableCell>
                              <div className="font-medium">{pkg.description || pkg.trackingNumber || pkg.id}</div>
                              <div className="text-xs text-muted-foreground">{pkg.internalTrackingId}</div>
                            </TableCell>
                            <TableCell>
                              {user ? (
                                <Link href={`/admin/customers/${pkg.userId}`} className="hover:underline">
                                  {customerName}
                                  {user.email ? <span className="text-xs text-muted-foreground ml-1">({user.email})</span> : null}
                                </Link>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAssignUser(pkg.id)}
                                  className="flex items-center gap-1"
                                >
                                  <UserPlus className="h-4 w-4" />
                                  Assign Customer
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_VARIANTS[pkg.status] as any}>
                                {STATUS_LABELS[pkg.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {pkg.weight ? `${pkg.weight} lbs` : "-"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {formatDimensions(pkg.dimensions)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {formatDate(pkg.receivedDate)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/packages/${pkg.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setQuickInvoicePackageId(pkg.id);
                                      setQuickInvoiceUserId(pkg.userId);
                                      setShowQuickInvoiceDialog(true);
                                    }}
                                  >
                                    <CircleDollarSign className="mr-2 h-4 w-4" />
                                    Quick Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (pkg.status !== 'ready_for_pickup' && pkg.status !== 'delivered' && pkg.status !== 'returned') {
                                        setPackageToMarkReady(pkg.id);
                                        setSendNotificationOnReady(true);
                                        setMarkReadyDialogOpen(true);
                                      }
                                    }}
                                    disabled={updateStatusMutation.isPending || pkg.status === 'ready_for_pickup' || pkg.status === 'delivered' || pkg.status === 'returned'}
                                  >
                                    <Truck className="mr-2 h-4 w-4" />
                                    Mark as Ready
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => openDeleteDialog(pkg.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Package
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination Controls */}
            {pagination && typeof pagination.page === 'number' && typeof pagination.totalPages === 'number' && (
              <div className="flex items-center justify-between mt-4">
                <div>
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
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
          </CardContent>
        </Card>
      </Tabs>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this package? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="send-notification-delete"
              checked={sendNotificationOnDelete}
              onChange={e => setSendNotificationOnDelete(e.target.checked)}
            />
            <label htmlFor="send-notification-delete" className="text-sm">Send notification</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePackage} 
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={markReadyDialogOpen} onOpenChange={setMarkReadyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Ready</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this package as ready for pickup?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="send-notification-ready"
              checked={sendNotificationOnReady}
              onChange={e => setSendNotificationOnReady(e.target.checked)}
            />
            <label htmlFor="send-notification-ready" className="text-sm">Send notification</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkReadyDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => {
              if (packageToMarkReady) updateStatusMutation.mutate({ id: packageToMarkReady, status: 'ready_for_pickup', sendNotification: sendNotificationOnReady });
              setMarkReadyDialogOpen(false);
            }} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'Marking...' : 'Mark as Ready'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickInvoiceDialog
        open={showQuickInvoiceDialog}
        onOpenChange={setShowQuickInvoiceDialog}
        packageId={quickInvoicePackageId}
        userId={quickInvoiceUserId}
      />
      
      <AssignUserModal
        open={assignUserModalOpen}
        onOpenChange={setAssignUserModalOpen}
        packageId={selectedPackageId}
        onSuccess={handleAssignSuccess}
      />
    </>
  )
} 