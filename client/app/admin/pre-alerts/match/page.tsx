"use client";
import { useState } from "react";
import { usePreAlerts } from "@/hooks/usePreAlerts";
import { usePackages } from "@/hooks/usePackages";
import { useMatchPreAlertToPackage } from "@/hooks/usePackages";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { PreAlert, Package } from "@/lib/api/types";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function MatchPreAlertsPage() {
  const [selectedPreAlert, setSelectedPreAlert] = useState<PreAlert | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [preAlertSearch, setPreAlertSearch] = useState("");
  const [packageSearch, setPackageSearch] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  // Fetch unmatched pre-alerts
  const { data: preAlertsData, isLoading: preAlertsLoading } = usePreAlerts({ status: "pending", search: preAlertSearch });
  // Fetch all packages (could be filtered to customer packages if needed)
  const { data: packagesData, isLoading: packagesLoading } = usePackages({ search: packageSearch });

  const matchMutation = useMatchPreAlertToPackage();

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
          setSelectedPreAlert(null);
          setSelectedPackage(null);
          setShowDialog(false);
        },
        onError: (err) => {
          toast({ title: "Error", description: err?.message || "Failed to match pre-alert." });
        },
      }
    );
  };

  return (
    <div className="py-8 ">
      <h1 className="text-3xl font-bold mb-6">Match Pre-Alerts to Packages</h1>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mb-4 cursor-help text-blue-700 underline text-xs w-fit">
              How does this work?
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div>
              <b>How to use:</b><br />
              1. Select a pre-alert from the left and a package from the right.<br />
              2. (Optional) Check the box to send a notification to the customer.<br />
              3. Click <b>Match Selected Pre-Alert to Package</b>.<br /><br />
              <b>Tip:</b> Only unmatched pre-alerts and available packages are shown.
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pre-Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Unmatched Pre-Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search pre-alerts..."
              value={preAlertSearch}
              onChange={e => setPreAlertSearch(e.target.value)}
              className="mb-2"
            />
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preAlertsLoading ? (
                    <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
                  ) : preAlertsData?.data?.length ? (
                    preAlertsData.data.map((alert: PreAlert) => (
                      <TableRow
                        key={alert.id}
                        className={selectedPreAlert?.id === alert.id ? "bg-blue-50" : "cursor-pointer"}
                        onClick={() => setSelectedPreAlert(alert)}
                      >
                        <TableCell>{alert.trackingNumber}</TableCell>
                        <TableCell>{alert.userId}</TableCell>
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
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3}>No unmatched pre-alerts found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        {/* Packages List */}
        <Card>
          <CardHeader>
            <CardTitle>Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search packages..."
              value={packageSearch}
              onChange={e => setPackageSearch(e.target.value)}
              className="mb-2"
            />
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagesLoading ? (
                    <TableRow><TableCell colSpan={2}>Loading...</TableCell></TableRow>
                  ) : packagesData?.data?.length ? (
                    packagesData.data.map((pkg: Package) => (
                      <TableRow
                        key={pkg.id}
                        className={selectedPackage?.id === pkg.id ? "bg-green-50" : "cursor-pointer"}
                        onClick={() => setSelectedPackage(pkg)}
                      >
                        <TableCell>{pkg.trackingNumber}</TableCell>
                        <TableCell>
                          <Badge variant={
                            pkg.status === 'received' ? 'secondary'
                            : pkg.status === 'processed' ? 'success'
                            : pkg.status === 'ready_for_pickup' ? 'outline'
                            : pkg.status === 'delivered' ? 'success'
                            : pkg.status === 'returned' ? 'destructive'
                            : 'outline'
                          }>
                            {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={2}>No packages found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Match Action */}
      <div className="mt-8 flex flex-col items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-4 cursor-help">
                <Checkbox
                  checked={sendNotification}
                  onCheckedChange={v => setSendNotification(!!v)}
                  id="sendNotification"
                />
                <label htmlFor="sendNotification" className="text-sm">Send notification to customer</label>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              If checked, the customer will receive an email or app notification about the package match.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="mt-2 text-xs text-muted-foreground">
          Notification will <b>{sendNotification ? 'be sent' : 'not be sent'}</b> to the customer upon matching.
        </div>
        <Button
          className="mt-4"
          disabled={!selectedPreAlert || !selectedPackage || matchMutation.isPending}
          onClick={() => setShowDialog(true)}
        >
          Match Selected Pre-Alert to Package
        </Button>
      </div>
      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Match</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            Are you sure you want to match pre-alert <b>{selectedPreAlert?.trackingNumber}</b> to package <b>{selectedPackage?.trackingNumber}</b>?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={matchMutation.isPending}>Cancel</Button>
            <Button onClick={handleMatch} disabled={matchMutation.isPending}>
              {matchMutation.isPending ? "Matching..." : "Confirm Match"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 