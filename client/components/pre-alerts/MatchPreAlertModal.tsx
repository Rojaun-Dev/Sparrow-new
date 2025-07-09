import React, { useState } from 'react';
import { usePackages, useMatchPreAlertToPackage } from '@/hooks/usePackages';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { PreAlert } from "@/lib/api/types";

interface MatchPreAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preAlert: PreAlert | null;
  onSuccess?: () => void;
}

export function MatchPreAlertModal({
  open,
  onOpenChange,
  preAlert,
  onSuccess
}: MatchPreAlertModalProps) {
  const { toast } = useToast();
  
  // State for the modal
  const [packageSearch, setPackageSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [sendNotification, setSendNotification] = useState(true);
  
  // Fetch packages for matching
  const { data: packagesData, isLoading: packagesLoading } = usePackages({ 
    search: packageSearch
  });
  
  // Match mutation
  const matchMutation = useMatchPreAlertToPackage();
  
  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setPackageSearch("");
      setSelectedPackage(null);
      setSendNotification(true);
    }
  }, [open]);
  
  // Handle match action
  const handleMatch = () => {
    if (!preAlert || !selectedPackage) return;
    
    matchMutation.mutate(
      {
        packageId: selectedPackage.id,
        preAlertId: preAlert.id,
        sendNotification,
      },
      {
        onSuccess: () => {
          toast({ 
            title: "Matched!", 
            description: "Pre-alert matched to package successfully." 
          });
          onOpenChange(false);
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          toast({ 
            title: "Error", 
            description: err?.message || "Failed to match pre-alert." 
          });
        },
      }
    );
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };
  
  // Get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'received': return 'secondary';
      case 'processed': return 'success';
      case 'ready_for_pickup': return 'outline';
      case 'delivered': return 'success';
      case 'returned': return 'destructive';
      default: return 'outline';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                1. Search and select the correct package.<br />
                2. (Optional) Check the box to send a notification to the customer.<br />
                3. Click <b>Confirm Match</b> to complete the process.<br /><br />
                <b>Tip:</b> Only unmatched pre-alerts and available packages are shown.
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="mb-2">
          <b>Pre-Alert:</b> {preAlert?.trackingNumber} ({preAlert?.courier})
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packagesLoading ? (
                <TableRow><TableCell colSpan={2}>Loading...</TableCell></TableRow>
              ) : packagesData?.data?.length ? (
                packagesData.data.map((pkg: any) => (
                  <TableRow
                    key={pkg.id}
                    className={selectedPackage?.id === pkg.id ? "bg-green-50" : "cursor-pointer"}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <TableCell>{pkg.trackingNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(pkg.status)}>
                        {formatStatus(pkg.status)}
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
        <div className="flex items-center gap-2 mt-4">
          <Checkbox
            checked={sendNotification}
            onCheckedChange={v => setSendNotification(!!v)}
            id="sendNotification"
          />
          <label htmlFor="sendNotification" className="text-sm font-medium">
            Send notification to customer
          </label>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Notification will <b>{sendNotification ? 'be sent' : 'not be sent'}</b> to the customer upon matching.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={matchMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleMatch} disabled={!selectedPackage || matchMutation.isPending}>
            {matchMutation.isPending ? "Matching..." : "Confirm Match"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 