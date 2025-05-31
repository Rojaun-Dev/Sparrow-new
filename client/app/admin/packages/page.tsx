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
  Trash2
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
import { usePackages, useUpdatePackageStatus } from '@/hooks/usePackages';
import { useUsers } from '@/hooks/useUsers';
import type { Package, PackageStatus, PaginatedResponse } from '@/lib/api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

// Status maps
const STATUS_LABELS: Record<string, string> = {
  pre_alert: "Pre-Alert",
  received: "Received",
  processed: "Processed",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
  returned: "Returned"
}

const STATUS_VARIANTS: Record<string, string> = {
  pre_alert: "warning",
  received: "default",
  processed: "secondary",
  ready_for_pickup: "success",
  delivered: "success",
  returned: "destructive"
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
  const updateStatusMutation = useUpdatePackageStatus();
  const deleteMutation = useMutation({
    mutationFn: async ({ id, sendNotification }: { id: string; sendNotification?: boolean }) => {
      await packageService.deletePackage(id, undefined, sendNotification);
    },
    onSuccess: () => {
      toast({ title: 'Package deleted', description: 'The package was deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to delete package', variant: 'destructive' });
    },
  });
  
  // Fetch packages from backend
  const {
    data: packagesData,
    isLoading,
    error,
  } = usePackages({
    search: searchQuery,
    status: activeTab === 'all' ? undefined : activeTab as PackageStatus,
    page,
    limit: pageSize,
  });

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

  const openDeleteDialog = (packageId: string) => {
    setPackageToDelete(packageId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeletePackage = () => {
    // In a real app, this would call an API to delete the package
    console.log(`Deleting package ${packageToDelete}`)
    setIsDeleteDialogOpen(false)
    setPackageToDelete(null)
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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Packages</h1>
        <div className="flex items-center gap-2">
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Packages</TabsTrigger>
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
                                <span>{pkg.userId}</span>
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
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/invoices/create?packageId=${pkg.id}`}>
                                      <CircleDollarSign className="mr-2 h-4 w-4" />
                                      Create Invoice
                                    </Link>
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
            <Button variant="destructive" onClick={() => {
              if (packageToDelete) deleteMutation.mutate({ id: packageToDelete, sendNotification: sendNotificationOnDelete });
              setIsDeleteDialogOpen(false);
            }} disabled={deleteMutation.isPending}>
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
    </>
  )
} 