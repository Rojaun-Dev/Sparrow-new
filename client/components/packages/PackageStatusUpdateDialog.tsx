"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useBulkUpdatePackageStatus } from '@/hooks/usePackages';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle } from "lucide-react";

interface PackageInfo {
  id: string;
  trackingNumber: string;
  description?: string;
  weight?: string;
}

interface PackageStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: PackageInfo[];
  onComplete: () => void;
}

export function PackageStatusUpdateDialog({
  open,
  onOpenChange,
  packages,
  onComplete
}: PackageStatusUpdateDialogProps) {
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true); // Default to all selected
  const bulkUpdateStatus = useBulkUpdatePackageStatus();
  const { toast } = useToast();

  // Initialize with all packages selected by default
  useEffect(() => {
    if (packages.length > 0) {
      setSelectedPackageIds(packages.map(pkg => pkg.id));
      setSelectAll(true);
    }
  }, [packages]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedPackageIds(packages.map(pkg => pkg.id));
    } else {
      setSelectedPackageIds([]);
    }
  };

  const handlePackageToggle = (packageId: string, checked: boolean) => {
    if (checked) {
      setSelectedPackageIds(prev => [...prev, packageId]);
    } else {
      setSelectedPackageIds(prev => prev.filter(id => id !== packageId));
      setSelectAll(false);
    }
  };

  const handleMarkAsReady = async () => {
    if (selectedPackageIds.length === 0) {
      toast({
        title: "No packages selected",
        description: "Please select at least one package to update.",
        variant: "destructive"
      });
      return;
    }

    try {
      await bulkUpdateStatus.mutateAsync({
        packageIds: selectedPackageIds,
        status: 'ready_for_pickup',
        sendNotification: true
      });

      toast({
        title: "Packages updated successfully",
        description: `${selectedPackageIds.length} package${selectedPackageIds.length > 1 ? 's' : ''} marked as ready for pickup.`,
      });

      onOpenChange(false);
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error updating packages",
        description: error?.message || "Failed to update package status.",
        variant: "destructive"
      });
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete();
  };

  if (!packages.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Mark Packages as Ready for Pickup?
          </DialogTitle>
          <DialogDescription>
            The invoice has been created successfully. Would you like to mark the included packages as ready for pickup?
            This will notify customers that their packages are ready for collection.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Select All Option */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select all packages ({packages.length})
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Package List */}
          <div className="space-y-2">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="hover:bg-gray-50">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`package-${pkg.id}`}
                      checked={selectedPackageIds.includes(pkg.id)}
                      onCheckedChange={(checked) => handlePackageToggle(pkg.id, !!checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">{pkg.trackingNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          Ready for Pickup
                        </Badge>
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 truncate">{pkg.description}</p>
                      )}
                      {pkg.weight && (
                        <p className="text-xs text-gray-500">Weight: {pkg.weight} lbs</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPackageIds.length > 0 && (
            <div className="text-sm text-blue-600 font-medium">
              {selectedPackageIds.length} of {packages.length} packages selected
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={bulkUpdateStatus.isPending}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleMarkAsReady}
            disabled={bulkUpdateStatus.isPending || selectedPackageIds.length === 0}
            className="flex items-center gap-2"
          >
            {bulkUpdateStatus.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Mark {selectedPackageIds.length > 0 ? `${selectedPackageIds.length} ` : ''}as Ready
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}