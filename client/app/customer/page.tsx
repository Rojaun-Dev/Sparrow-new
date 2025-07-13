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
import { useUserStatistics, useUserPackages, useCreatePreAlertWithDocuments } from "@/hooks";
import { PreAlert, Package as PackageType } from "@/lib/api/types";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { ShippingInfoCard } from "@/components/customer/ShippingInfoCard";

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
  
  // State for document files
  const [documents, setDocuments] = useState<File[]>([]);

  // Fetch user statistics
  const { 
    data: statistics, 
    isLoading: statsLoading, 
    error: statsError 
  } = useUserStatistics();

  console.log('Statistics:', statistics); // For debugging

  // Fetch recent packages
  const { 
    data: packagesData, 
    isLoading: packagesLoading,
    error: packagesError
  } = useUserPackages({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' });

  // Create pre-alert with documents mutation
  const createPreAlert = useCreatePreAlertWithDocuments();

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setPreAlertForm(prev => ({
      ...prev,
      [id]: id === 'weight' ? parseFloat(value) || 0 : value
    }));
  };

  // Handle form submission
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
        preAlert: {
          trackingNumber: preAlertForm.trackingNumber,
          courier: preAlertForm.courier,
          description: preAlertForm.description,
          weight: preAlertForm.weight > 0 ? preAlertForm.weight : undefined,
        },
        files: documents
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
      
      // Clear documents
      setDocuments([]);
      
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

  // Helper to get package count by status
  const getPackageCountByStatus = (status: string) => {
    if (!statistics?.packagesByStatus) return 0;
    return parseInt(statistics.packagesByStatus[status] || '0', 10);
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
      case 'pre_alert':
        return 'bg-amber-500';
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
            {statsError.message || 'Failed to load dashboard statistics. Please try again later.'}
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
                  {statistics?.totalPackages || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All your packages
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pre-Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
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
                  {statistics?.packagesByStatus?.pre_alert || 0}
                </div>
                <p className="text-xs text-muted-foreground">Registered packages</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
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
                  {statistics?.packagesByStatus?.delivered || 0}
                </div>
                <p className="text-xs text-muted-foreground">Completed deliveries</p>
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
                  {statistics?.outstandingInvoices 
                    ? formatCurrency(statistics.outstandingInvoices.amount) 
                    : '$0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics?.outstandingInvoices?.count || 0} unpaid invoices
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shipping Information Card */}
      <ShippingInfoCard />

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
            ) : packagesData?.length === 0 ? (
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
                  {packagesData?.map((pkg: PackageType) => (
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
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Invoice or Receipt (optional)
                </label>
                <FileUpload
                  onFilesChange={setDocuments}
                  value={documents}
                  maxFiles={3}
                  variant="compact"
                  disabled={isLoading}
                  uploading={isLoading}
                  label="Upload documents"
                  description="Drag & drop or click to upload (PDF, JPG, PNG)"
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
            <CardTitle>Monthly Package Trend</CardTitle>
            <CardDescription>Your package deliveries by month.</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : statistics?.monthlyTrend && statistics.monthlyTrend.length > 0 ? (
              <div className="space-y-8">
                {statistics.monthlyTrend.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.month}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-muted overflow-hidden rounded-full mr-2">
                        <div 
                          className="h-full bg-primary" 
                          style={{ 
                            width: `${Math.min(100, parseInt(item.count) * 20)}%` 
                          }}
                        />
                      </div>
                      <p className="text-sm font-medium">{item.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No monthly data available.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Your recent transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : statistics?.recentPayments && statistics.recentPayments.length > 0 ? (
              <div className="space-y-4">
                {statistics.recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-md border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{payment.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">Date: {formatDate(payment.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{formatCurrency(payment.amount)}</p>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Paid</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent payments found.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/customer/payments">View All Payments</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 