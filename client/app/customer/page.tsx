'use client';

import { CreditCard, FileText, Package, PlusCircle, RefreshCw, Truck, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useUserStatistics, useUserPackages, useCreatePreAlert } from "@/hooks";
import { PreAlert, Package as PackageType } from "@/lib/api/types";
import { useToast } from "@/components/ui/use-toast";

export default function CustomerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state for pre-alert
  const [preAlertForm, setPreAlertForm] = useState({
    trackingNumber: '',
    courier: '',
    description: '',
    weight: 0,
  });

  // Fetch user statistics
  const { 
    data: statistics, 
    isLoading: statsLoading, 
    error: statsError 
  } = useUserStatistics();

  // Fetch recent packages
  const { 
    data: packagesData, 
    isLoading: packagesLoading,
    error: packagesError
  } = useUserPackages({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' });

  // Create pre-alert mutation
  const createPreAlert = useCreatePreAlert();

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setPreAlertForm(prev => ({
      ...prev,
      [id]: id === 'weight' ? parseFloat(value) || 0 : value
    }));
  };

  // Handle pre-alert submission
  const handlePreAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!preAlertForm.trackingNumber || !preAlertForm.courier || !preAlertForm.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createPreAlert.mutateAsync({
        trackingNumber: preAlertForm.trackingNumber,
        courier: preAlertForm.courier,
        description: preAlertForm.description,
        weight: preAlertForm.weight > 0 ? preAlertForm.weight : undefined,
      });
      
      // Show success message
      toast({
        title: "Pre-alert created",
        description: "Your pre-alert has been successfully created.",
      });
      
      // Clear form on success
      setPreAlertForm({
        trackingNumber: '',
        courier: '',
        description: '',
        weight: 0,
      });
      
      // Navigate to pre-alerts page
      router.push('/customer/prealerts');
    } catch (error) {
      console.error('Failed to create pre-alert:', error);
      
      toast({
        title: "Error",
        description: "Failed to create pre-alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to count packages by status
  const countPackagesByStatus = (status: string) => {
    if (!statistics?.packageCounts) return 0;
    return statistics.packageCounts[status] || 0;
  };

  // Function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Function to determine status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-amber-500';
      case 'ready_for_pickup':
        return 'bg-green-500';
      case 'in_transit':
      case 'received':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-green-700';
      default:
        return 'bg-gray-500';
    }
  };

  // Format status label for display
  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard statistics. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statistics?.packageCounts?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics?.packageCounts?.monthlyChange > 0 
                    ? `+${statistics.packageCounts.monthlyChange} from last month` 
                    : 'No change from last month'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {countPackagesByStatus('in_transit')}
                </div>
                <p className="text-xs text-muted-foreground">Packages in transit</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {countPackagesByStatus('ready_for_pickup')}
                </div>
                <p className="text-xs text-muted-foreground">Ready for collection</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statistics?.outstandingBalance 
                    ? formatCurrency(statistics.outstandingBalance) 
                    : '$0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics?.outstandingInvoices || 0} outstanding invoices
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Packages</CardTitle>
            <CardDescription>
              Your most recent packages and their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {packagesError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load packages. Please try again later.
                </AlertDescription>
              </Alert>
            )}
            
            {packagesLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : packagesData?.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No packages found. Create a pre-alert to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagesData?.data.map((pkg: PackageType) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.internalTrackingId}</TableCell>
                      <TableCell>{pkg.description}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(pkg.status)}>
                          {formatStatusLabel(pkg.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(pkg.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/customer/packages">View All Packages</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Pre-Alert</CardTitle>
            <CardDescription>
              Register an incoming package to get a faster processing time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePreAlertSubmit} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="trackingNumber" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Tracking Number
                  </label>
                  <input
                    id="trackingNumber"
                    value={preAlertForm.trackingNumber}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter tracking number"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="courier" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Courier
                  </label>
                  <select
                    id="courier"
                    value={preAlertForm.courier}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select courier</option>
                    <option value="usps">USPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="ups">UPS</option>
                    <option value="dhl">DHL</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Description
                </label>
                <input
                  id="description"
                  value={preAlertForm.description}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Package contents"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="weight" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Estimated Weight (lbs)
                </label>
                <input
                  id="weight"
                  type="number"
                  value={preAlertForm.weight || ''}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || createPreAlert.isPending}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {isLoading || createPreAlert.isPending ? 'Submitting...' : 'Submit Pre-Alert'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your package activity timeline.</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : statistics?.recentActivity && statistics.recentActivity.length > 0 ? (
              <div className="space-y-8">
                {statistics.recentActivity.map((item: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="mr-4 mt-0.5 flex h-2 w-2 rounded-full bg-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity found.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Outstanding Invoices</CardTitle>
            <CardDescription>Your pending payments.</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : statistics?.pendingInvoices && statistics.pendingInvoices.length > 0 ? (
              <div className="space-y-4">
                {statistics.pendingInvoices.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">Due: {formatDate(item.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{formatCurrency(item.totalAmount)}</p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/customer/invoices/${item.id}`}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No outstanding invoices found.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/customer/invoices">View All Invoices</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 