import Link from "next/link"
import { 
  ChevronDown, 
  Download, 
  Filter, 
  Package, 
  Search, 
  X 
} from "lucide-react"

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

export default function PackagesPage() {
  // Example package data - in a real app, this would come from an API
  const packages = [
    {
      id: "pkg-001",
      trackingNumber: "SP-1234",
      internalTrackingId: "INT-1234",
      description: "Nike Shoes",
      status: "processing",
      statusLabel: "Processing",
      weight: "2.5 lbs",
      receivedDate: "May 20, 2023",
      photos: ["photo1.jpg", "photo2.jpg"],
    },
    {
      id: "pkg-002",
      trackingNumber: "SP-1235",
      internalTrackingId: "INT-1235",
      description: "Phone Case",
      status: "ready_for_pickup",
      statusLabel: "Ready for Pickup",
      weight: "0.5 lbs",
      receivedDate: "May 18, 2023",
      photos: ["photo3.jpg"],
    },
    {
      id: "pkg-003",
      trackingNumber: "SP-1236",
      internalTrackingId: "INT-1236",
      description: "Electronics",
      status: "in_transit",
      statusLabel: "In Transit",
      weight: "3.2 lbs",
      receivedDate: "May 15, 2023",
      photos: [],
    },
    {
      id: "pkg-004",
      trackingNumber: "SP-1237",
      internalTrackingId: "INT-1237",
      description: "Books",
      status: "delivered",
      statusLabel: "Delivered",
      weight: "5.1 lbs",
      receivedDate: "May 10, 2023",
      photos: ["photo4.jpg", "photo5.jpg"],
    },
    {
      id: "pkg-005",
      trackingNumber: "SP-1238",
      internalTrackingId: "INT-1238",
      description: "Clothing",
      status: "received",
      statusLabel: "Received",
      weight: "1.8 lbs",
      receivedDate: "May 22, 2023",
      photos: ["photo6.jpg"],
    },
  ]

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pre_alert":
        return "bg-gray-500"
      case "received":
        return "bg-blue-500"
      case "processing":
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Packages</h1>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/customer/prealerts/new">
              <Package className="mr-2 h-4 w-4" />
              Create Pre-Alert
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
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
              />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pre_alert">Pre-Alert</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Input type="date" placeholder="From Date" />
            </div>
            <div>
              <Input type="date" placeholder="To Date" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
            <Button size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Package List</CardTitle>
          <CardDescription>Showing {packages.length} packages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.trackingNumber}</TableCell>
                    <TableCell>{pkg.description}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(pkg.status)}>
                        {pkg.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{pkg.weight}</TableCell>
                    <TableCell className="hidden md:table-cell">{pkg.receivedDate}</TableCell>
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
                          {pkg.photos.length > 0 && (
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
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Showing <strong>5</strong> of <strong>5</strong> packages
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 