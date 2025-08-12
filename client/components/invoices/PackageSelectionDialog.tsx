'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useUnbilledPackagesByUser } from '@/hooks/usePackages';
import { Package } from 'lucide-react';

interface PackageSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  companyId?: string;
  onPackagesSelected: (packages: any[]) => void;
  preSelectedPackageIds?: string[];
}

export function PackageSelectionDialog({
  open,
  onOpenChange,
  customerId,
  companyId,
  onPackagesSelected,
  preSelectedPackageIds = []
}: PackageSelectionDialogProps) {
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: unbilledPackages = [], isLoading } = useUnbilledPackagesByUser(
    customerId || '',
    companyId
  );

  // Initialize with preselected packages when modal opens, clear when closes
  useEffect(() => {
    if (open) {
      // When modal opens, always set to preselected packages (or empty if none)
      setSelectedPackageIds(preSelectedPackageIds);
    } else {
      // When modal closes, clear selections (except when handleConfirm already cleared them)
      setSelectedPackageIds([]);
    }
  }, [open, preSelectedPackageIds]);

  // Filter packages based on search term
  const filteredPackages = unbilledPackages.filter(pkg =>
    pkg.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePackageToggle = (packageId: string) => {
    console.log('Toggling package:', packageId);
    setSelectedPackageIds(prev => {
      const newIds = prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId];
      console.log('New selectedPackageIds:', newIds);
      return newIds;
    });
  };

  const handleSelectAll = () => {
    if (selectedPackageIds.length === filteredPackages.length) {
      setSelectedPackageIds([]);
    } else {
      setSelectedPackageIds(filteredPackages.map(pkg => pkg.id));
    }
  };

  const handleConfirm = () => {
    console.log('handleConfirm called');
    console.log('selectedPackageIds:', selectedPackageIds);
    console.log('unbilledPackages:', unbilledPackages);
    
    const selectedPackages = unbilledPackages.filter(pkg =>
      selectedPackageIds.includes(pkg.id)
    );
    
    console.log('selectedPackages:', selectedPackages);
    
    onPackagesSelected(selectedPackages);
    setSelectedPackageIds([]);
    // Let the parent handle closing the dialog to prevent state conflicts
  };

  const handleCancel = () => {
    setSelectedPackageIds([]);
    onOpenChange(false);
  };

  if (!customerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Packages to Add
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search packages by tracking number or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredPackages.length === 0}
            >
              {selectedPackageIds.length === filteredPackages.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Packages Table */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">Loading packages...</div>
            ) : filteredPackages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {unbilledPackages.length === 0
                  ? 'No unbilled packages found for this customer'
                  : 'No packages match your search criteria'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Declared Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPackageIds.includes(pkg.id)}
                          onCheckedChange={() => handlePackageToggle(pkg.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{pkg.trackingNumber}</TableCell>
                      <TableCell>{pkg.description || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pkg.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          pkg.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          pkg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pkg.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>{pkg.weight ? `${pkg.weight} lbs` : '-'}</TableCell>
                      <TableCell>{pkg.declaredValue ? `$${pkg.declaredValue}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {selectedPackageIds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedPackageIds.length} package{selectedPackageIds.length === 1 ? '' : 's'} selected
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              console.log('Button clicked!');
              console.log('Button disabled?', selectedPackageIds.length === 0);
              console.log('selectedPackageIds length:', selectedPackageIds.length);
              handleConfirm();
            }}
            disabled={selectedPackageIds.length === 0}
          >
            Add {selectedPackageIds.length} Package{selectedPackageIds.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}