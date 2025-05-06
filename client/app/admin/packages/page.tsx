"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Package, 
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

// Mock data for packages
const PACKAGES = [
  {
    id: "PKG-1001",
    internalTrackingId: "INT-78542",
    trackingNumber: "UPS3827465927",
    customerId: "cust-1234",
    customerName: "John Smith",
    status: "received",
    weight: 5.2,
    dimensions: { length: 12, width: 8, height: 6 },
    declaredValue: 150,
    receivedDate: "2023-07-15T14:30:00Z",
    processingDate: null,
    description: "Clothing items from Amazon",
    photos: ["/package-photo-1.jpg"]
  },
  {
    id: "PKG-1002",
    internalTrackingId: "INT-78543",
    trackingNumber: "FEDEX923842983",
    customerId: "cust-1235",
    customerName: "Sarah Johnson",
    status: "processed",
    weight: 12.8,
    dimensions: { length: 24, width: 18, height: 12 },
    declaredValue: 350,
    receivedDate: "2023-07-14T09:45:00Z",
    processingDate: "2023-07-14T11:30:00Z",
    description: "Electronics - Bluetooth speakers",
    photos: ["/package-photo-2.jpg", "/package-photo-3.jpg"]
  },
  {
    id: "PKG-1003",
    internalTrackingId: "INT-78544",
    trackingNumber: "USPS8273648273",
    customerId: "cust-1236",
    customerName: "Michael Brown",
    status: "ready_for_pickup",
    weight: 3.1,
    dimensions: { length: 10, width: 7, height: 4 },
    declaredValue: 85,
    receivedDate: "2023-07-12T16:20:00Z",
    processingDate: "2023-07-12T17:45:00Z",
    description: "Books from Barnes & Noble",
    photos: ["/package-photo-4.jpg"]
  },
  {
    id: "PKG-1004",
    internalTrackingId: "INT-78545",
    trackingNumber: "DHL93847293847",
    customerId: "cust-1237",
    customerName: "Alicia Williams",
    status: "delivered",
    weight: 8.5,
    dimensions: { length: 15, width: 12, height: 10 },
    declaredValue: 210,
    receivedDate: "2023-07-10T11:10:00Z",
    processingDate: "2023-07-10T13:25:00Z",
    description: "Household items",
    photos: ["/package-photo-5.jpg"]
  },
  {
    id: "PKG-1005",
    internalTrackingId: "INT-78546",
    trackingNumber: "AMZL9283742937",
    customerId: "cust-1238",
    customerName: "David Wilson",
    status: "pre_alert",
    weight: null,
    dimensions: null,
    declaredValue: 120,
    receivedDate: null,
    processingDate: null,
    description: "Computer accessories",
    photos: []
  },
]

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
  
  // Filter packages based on search query and active tab
  const filteredPackages = PACKAGES.filter(pkg => {
    const matchesSearch = 
      pkg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.internalTrackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = activeTab === "all" || pkg.status === activeTab
    
    return matchesSearch && matchesStatus
  })

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDimensions = (dimensions: { length: number, width: number, height: number } | null) => {
    if (!dimensions) return "-"
    return `${dimensions.length}″ × ${dimensions.width}″ × ${dimensions.height}″`
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Packages</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/admin/packages/register">
              <Plus className="mr-2 h-4 w-4" />
              Register Package
            </Link>
          </Button>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" className="gap-1">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Package ID
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Weight</TableHead>
                    <TableHead className="hidden lg:table-cell">Dimensions</TableHead>
                    <TableHead className="hidden lg:table-cell">Received Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No packages found. Try adjusting your search or filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPackages.map(pkg => (
                      <TableRow key={pkg.id}>
                        <TableCell>
                          <div className="font-medium">{pkg.id}</div>
                          <div className="text-xs text-muted-foreground">{pkg.internalTrackingId}</div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/admin/customers/${pkg.customerId}`}
                            className="hover:underline"
                          >
                            {pkg.customerName}
                          </Link>
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
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/packages/${pkg.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Package
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/packages/${pkg.id}/photos`}>
                                  <Camera className="mr-2 h-4 w-4" />
                                  Manage Photos
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/invoices/create?packageId=${pkg.id}`}>
                                  <CircleDollarSign className="mr-2 h-4 w-4" />
                                  Create Invoice
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/packages/${pkg.id}/update-status`}>
                                  <Truck className="mr-2 h-4 w-4" />
                                  Update Status
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => openDeleteDialog(pkg.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Package
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePackage}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 