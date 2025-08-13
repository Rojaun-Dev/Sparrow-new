'use client';

import Link from "next/link"
import { 
  Calendar, 
  Eye, 
  Filter, 
  Package, 
  PlusCircle, 
  Search, 
  X,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useState } from "react"

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
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useUserPreAlerts, useCancelPreAlert } from "@/hooks"
import { PreAlert, PreAlertFilterParams } from "@/lib/api/types"
import { useToast } from "@/components/ui/use-toast"

export default function PreAlertsPage() {
  const { toast } = useToast();
  
  // Filter state
  const [filters, setFilters] = useState<PreAlertFilterParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Form inputs state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [creationDate, setCreationDate] = useState('');

  // Fetch pre-alerts with current filters
  const { 
    data: preAlertsData, 
    isLoading, 
    error, 
    refetch 
  } = useUserPreAlerts(filters);

  // Cancel pre-alert mutation
  const cancelPreAlert = useCancelPreAlert();

  // Apply filters when the apply button is clicked
  const applyFilters = () => {
    const newFilters: PreAlertFilterParams = {
      ...filters,
      page: 1, // Reset to first page when applying new filters
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter as any || undefined : undefined,
      dateFrom: creationDate || undefined,
      // Even though we only have one date field, setting both helps with backend filtering
      dateTo: creationDate ? new Date(new Date(creationDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
    };
    
    setFilters(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCourierFilter('');
    setCreationDate('');
    
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Handle cancelling a pre-alert
  const handleCancelPreAlert = async (id: string) => {
    try {
      await cancelPreAlert.mutateAsync(id);
      toast({
        title: "Pre-alert cancelled",
        description: "Your pre-alert has been successfully cancelled and will no longer be processed.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error cancelling pre-alert",
        description: "There was a problem cancelling your pre-alert. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500"
      case "matched":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Format status label
  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pre-Alerts</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find specific pre-alerts by tracking number, status, or date range.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tracking#..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Input 
                type="date" 
                placeholder="Creation date"
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
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
            Failed to load pre-alerts. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Pre-Alert List</CardTitle>
            <CardDescription>
              {isLoading 
                ? 'Loading pre-alerts...'
                : `Showing ${preAlertsData?.data?.length || 0} pre-alerts`
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !preAlertsData?.data || preAlertsData.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pre-alerts found. Try adjusting your filters or create a new pre-alert.
            </div>
          ) : (
            <ResponsiveTable
              data={preAlertsData.data}
              keyExtractor={(preAlert) => preAlert.id}
              loading={isLoading}
              emptyMessage="No pre-alerts found. Try adjusting your filters or create a new pre-alert."
              columns={[
                {
                  header: "Tracking #",
                  accessorKey: "trackingNumber",
                  className: "w-[180px] font-medium",
                  cardLabel: "Tracking Number"
                },
                {
                  header: "Courier",
                  accessorKey: "courier"
                },
                {
                  header: "Description",
                  accessorKey: "description"
                },
                {
                  header: "Est. Weight",
                  accessorKey: "weight",
                  hiddenOnMobile: true,
                  cardLabel: "Weight",
                  cell: (preAlert) => preAlert.weight ? `${preAlert.weight} lbs` : 'N/A'
                },
                {
                  header: "Est. Arrival",
                  accessorKey: "estimatedArrival",
                  hiddenOnMobile: true,
                  cardLabel: "Arrival",
                  cell: (preAlert) => preAlert.estimatedArrival ? formatDate(preAlert.estimatedArrival) : 'N/A'
                },
                {
                  header: "Status",
                  accessorKey: "status",
                  cell: (preAlert) => (
                    <Badge className={getStatusBadgeColor(preAlert.status)}>
                      {formatStatusLabel(preAlert.status)}
                    </Badge>
                  )
                }
              ]}
              actions={[
                {
                  label: "View Details",
                  href: (preAlert) => `/customer/prealerts/${preAlert.id}`,
                  icon: Eye
                },
                {
                  label: cancelPreAlert.isPending ? 'Cancelling...' : 'Cancel Pre-Alert',
                  onClick: (preAlert) => handleCancelPreAlert(preAlert.id),
                  icon: X,
                  variant: "destructive",
                  disabled: () => cancelPreAlert.isPending,
                  hidden: (preAlert) => preAlert.status !== "pending"
                },
                {
                  label: "View Package",
                  href: (preAlert) => `/customer/packages/${preAlert.packageId}`,
                  icon: Package,
                  hidden: (preAlert) => !(preAlert.status === "matched" && preAlert.packageId)
                }
              ]}
            />
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {preAlertsData?.pagination && `Page ${preAlertsData.pagination.page} of ${preAlertsData.pagination.totalPages}`}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!preAlertsData?.pagination || preAlertsData.pagination.page <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page ? prev.page - 1 : 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!preAlertsData?.pagination || preAlertsData.pagination.page >= preAlertsData.pagination.totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page ? prev.page + 1 : 2 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Pre-Alerts</CardTitle>
          <CardDescription>
            What are pre-alerts and why should you use them?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pre-alerts are notifications you send us to let us know that a package is on its way to our warehouse.
            By creating pre-alerts, you help us process your packages faster when they arrive.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <h3 className="text-sm font-medium">Faster Processing</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Pre-alerted packages are identified and processed more quickly upon arrival.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <h3 className="text-sm font-medium">Better Tracking</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Keep track of all your incoming packages in one place.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <h3 className="text-sm font-medium">Special Handling</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Inform us about fragile items or special handling requirements.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link href="/customer/prealerts/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Pre-Alert
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 