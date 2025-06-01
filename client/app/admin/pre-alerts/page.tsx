"use client";

import { useState } from "react";
import { usePreAlerts } from "@/hooks/usePreAlerts";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Eye, Link } from "lucide-react";
import { useExportCsv } from "@/hooks/useExportCsv";
import { preAlertService } from "@/lib/api/preAlertService";
import { useUsers } from '@/hooks/useUsers';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { usePackages, useMatchPreAlertToPackage } from '@/hooks/usePackages';
import type { PreAlert, Package } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from "next/navigation";

export default function PreAlertsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  // Placeholder for filters
  const [filters, setFilters] = useState({});

  // Modal state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedPreAlert, setSelectedPreAlert] = useState<PreAlert | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageSearch, setPackageSearch] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const { toast } = useToast();

  // Fetch all users for the company
  const { data: usersData, isLoading: usersLoading } = useUsers();
  // Build a map of userId to user object
  const userMap = (usersData && Array.isArray(usersData)) ? Object.fromEntries(usersData.map((u: any) => [u.id, u])) : {};

  const { data, isLoading, error } = usePreAlerts({ page, limit: pageSize, search: searchQuery, ...filters });
  const { exportCsv } = useExportCsv();

  // Packages for modal
  const { data: packagesData, isLoading: packagesLoading } = usePackages({ search: packageSearch });
  const matchMutation = useMatchPreAlertToPackage();

  const handleExport = async () => {
    await exportCsv(async () => preAlertService.exportPreAlertsCsv({ ...filters, search: searchQuery }), undefined, "pre-alerts.csv");
  };

  const openMatchModal = (preAlert: PreAlert) => {
    setSelectedPreAlert(preAlert);
    setShowMatchModal(true);
    setSelectedPackage(null);
    setPackageSearch("");
    setSendNotification(true);
  };

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setSelectedPreAlert(null);
    setSelectedPackage(null);
    setPackageSearch("");
    setSendNotification(true);
  };

  const handleMatch = () => {
    if (!selectedPreAlert || !selectedPackage) return;
    matchMutation.mutate(
      {
        packageId: selectedPackage.id,
        preAlertId: selectedPreAlert.id,
        sendNotification,
      },
      {
        onSuccess: () => {
          toast({ title: "Matched!", description: "Pre-alert matched to package successfully." });
          closeMatchModal();
        },
        onError: (err) => {
          toast({ title: "Error", description: err?.message || "Failed to match pre-alert." });
        },
      }
    );
  };

  // Handler to navigate to pre-alert detail page
  const handleViewPreAlert = (id: string) => {
    router.push(`/admin/pre-alerts/${id}`);
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">All Pre-Alerts</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Pre-Alerts</CardTitle>
            <CardDescription>View and manage all pre-alerts for your company</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search filter */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative w-full sm:w-auto flex items-center gap-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pre-alerts..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-pointer text-muted-foreground">
                      <Info className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>Search only works for tracking numbers at this time.</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">Failed to load pre-alerts</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Estimated Arrival</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(data?.data) && data.data.length > 0 ? data.data.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.trackingNumber}</TableCell>
                      <TableCell>{userMap[alert.userId] ? `${userMap[alert.userId].firstName} ${userMap[alert.userId].lastName}` : alert.userId}</TableCell>
                      <TableCell>{alert.courier}</TableCell>
                      <TableCell>
                        <Badge variant={
                          alert.status === 'pending' ? 'secondary'
                          : alert.status === 'matched' ? 'success'
                          : alert.status === 'cancelled' ? 'destructive'
                          : 'outline'
                        }>
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.estimatedArrival ? new Date(alert.estimatedArrival).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-1.5 hover:bg-blue-50 transition-colors border-blue-200"
                            onClick={() => handleViewPreAlert(alert.id)}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">View</span>
                          </Button>
                          {alert.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex items-center gap-1.5 hover:bg-green-50 transition-colors border-green-200"
                              onClick={() => openMatchModal(alert)}
                            >
                              <Link className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Match</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pre-alerts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
      {/* Match Modal */}
      <Dialog open={showMatchModal} onOpenChange={v => { if (!v) closeMatchModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Pre-Alert to Package</DialogTitle>
          </DialogHeader>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mb-2 cursor-help text-blue-700 underline text-xs w-fit">
                  How does this work?
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div>
                  <b>How to use:</b><br />
                  1. Select a pre-alert from the table and click <b>Match</b>.<br />
                  2. In this dialog, search and select the correct package.<br />
                  3. (Optional) Check the box to send a notification to the customer.<br />
                  4. Click <b>Confirm Match</b> to complete the process.<br /><br />
                  <b>Tip:</b> Only unmatched pre-alerts and available packages are shown.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="mb-2">
            <div className="mb-2">
              <b>Pre-Alert:</b> {selectedPreAlert?.trackingNumber} ({selectedPreAlert?.courier})
            </div>
            <Input
              placeholder="Search packages..."
              value={packageSearch}
              onChange={e => setPackageSearch(e.target.value)}
              className="mb-2"
            />
            <div className="overflow-x-auto max-h-48 border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagesLoading ? (
                    <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
                  ) : packagesData?.data?.length ? (
                    packagesData.data.map((pkg: Package) => (
                      <TableRow
                        key={pkg.id}
                        className={selectedPackage?.id === pkg.id ? "bg-green-50" : "cursor-pointer"}
                        onClick={() => setSelectedPackage(pkg)}
                      >
                        <TableCell>{pkg.trackingNumber}</TableCell>
                        <TableCell>{pkg.userId}</TableCell>
                        <TableCell>{pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace(/_/g, ' ')}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3}>No packages found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={sendNotification}
                        onCheckedChange={v => setSendNotification(!!v)}
                        id="sendNotification"
                      />
                      <label htmlFor="sendNotification" className="text-sm font-medium">
                        Send notification to customer
                      </label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    If checked, the customer will receive an email or app notification about the package match.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Notification will <b>{sendNotification ? 'be sent' : 'not be sent'}</b> to the customer upon matching.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMatchModal} disabled={matchMutation.isPending}>Cancel</Button>
            <Button onClick={handleMatch} disabled={!selectedPreAlert || !selectedPackage || matchMutation.isPending}>
              {matchMutation.isPending ? "Matching..." : "Confirm Match"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 