'use client';

import Link from "next/link"
import { 
  ChevronDown, 
  Download, 
  Filter, 
  Package, 
  Search, 
  X,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useUserPackagesWithPagination } from "@/hooks"
import { Package as PackageType, PackageFilterParams } from "@/lib/api/types"

export default function PackagesPage() {
  // Filter state
  const [filters, setFilters] = useState<PackageFilterParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Form inputs state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Debug: Log current filters whenever they change
  useEffect(() => {
    console.log('Current package filters:', filters);
  }, [filters]);

  // Fetch packages with current filters
  const { 
    data: packagesData, 
    isLoading, 
    error, 
    refetch
  } = useUserPackagesWithPagination(filters);

  // Apply filters when the apply button is clicked
  const applyFilters = () => {
    const newFilters: PackageFilterParams = {
      ...filters,
      page: 1, // Reset to first page when applying new filters
      search: searchTerm || undefined,
      status: statusFilter && statusFilter !== 'all' ? statusFilter as any : undefined,
      dateFrom: fromDate || undefined,
      dateTo: toDate || undefined,
    };
    
    console.log('Applying package filters:', {
      ...newFilters,
      dateFromFormatted: fromDate ? new Date(fromDate).toISOString() : undefined,
      dateToFormatted: toDate ? new Date(toDate).toISOString() : undefined
    });
    setFilters(newFilters);
  };

  // Handle status filter change (immediate filtering like invoices page)
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    
    if (value === 'all') {
      setFilters(prev => ({
        ...prev,
        status: undefined,
        page: 1,
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        status: value as any,
        page: 1,
      }));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    
    const clearedFilters = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    setFilters(clearedFilters);
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pre_alert":
        return "bg-gray-500"
      case "received":
        return "bg-blue-500"
      case "processed":
        return "bg-amber-500"
      case "ready_for_pickup":
        return "bg-green-500"
      case "in_transit":
        return "bg-blue-600"
      case "delivered":
        return "bg-green-700"
      default:
        return "bg-gray-500"
    }
  }

  // Format status label for display
  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Packages</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find specific packages by tracking number, status, or date range.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search packages..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pre_alert">Pre-Alert</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processed">Processing</SelectItem>
                <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Input 
                type="date" 
                placeholder="From Date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Input 
                type="date" 
                placeholder="To Date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex flex-col xs:flex-row items-center gap-2 w-full">
            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full xs:w-auto">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
            <Button size="sm" onClick={applyFilters} className="w-full xs:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load packages. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Package List</CardTitle>
          <CardDescription>
            {isLoading 
              ? 'Loading packages...'
              : `Showing ${packagesData?.data?.length || 0} packages`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !packagesData?.data || packagesData.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No packages found. Try adjusting your filters or create a pre-alert.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Tracking #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Weight</TableHead>
                    <TableHead className="hidden md:table-cell">Received Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagesData.data.map((pkg: PackageType) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.trackingNumber}</TableCell>
                      <TableCell>{pkg.description}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(pkg.status)}>
                          {formatStatusLabel(pkg.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pkg.weight ? `${pkg.weight} lbs` : 'N/A'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pkg.receivedDate ? formatDate(pkg.receivedDate) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/customer/packages/${pkg.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            {pkg.photos && pkg.photos.length > 0 && (
                              <DropdownMenuItem>View Photos</DropdownMenuItem>
                            )}
                            {pkg.status === "ready_for_pickup" && (
                              <DropdownMenuItem>Schedule Pickup</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {packagesData?.pagination && `Page ${packagesData.pagination.page} of ${packagesData.pagination.totalPages}`}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!packagesData?.pagination || packagesData.pagination.page <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page ? prev.page - 1 : 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!packagesData?.pagination || packagesData.pagination.page >= packagesData.pagination.totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page ? prev.page + 1 : 2 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 