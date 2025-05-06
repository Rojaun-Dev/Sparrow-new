import Link from "next/link"
import { Calendar, ChevronDown, Eye, Filter, Package, PlusCircle, Search, X } from "lucide-react"

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

export default function PreAlertsPage() {
  // Example pre-alert data - in a real app, this would come from an API
  const preAlerts = [
    {
      id: "prea-001",
      trackingNumber: "1Z999AA10123456784",
      courier: "UPS",
      description: "T-shirts (3)",
      status: "pending",
      statusLabel: "Pending",
      estimatedWeight: "1.5 lbs",
      estimatedArrival: "Jun 10, 2023",
      createdAt: "May 25, 2023",
    },
    {
      id: "prea-002",
      trackingNumber: "390489283204893249",
      courier: "USPS",
      description: "Books from Amazon",
      status: "matched",
      statusLabel: "Matched",
      estimatedWeight: "4.2 lbs",
      estimatedArrival: "Jun 5, 2023",
      createdAt: "May 24, 2023",
    },
    {
      id: "prea-003",
      trackingNumber: "7777271623901",
      courier: "FedEx",
      description: "iPhone Accessories",
      status: "pending",
      statusLabel: "Pending",
      estimatedWeight: "0.8 lbs",
      estimatedArrival: "Jun 15, 2023",
      createdAt: "May 28, 2023",
    },
    {
      id: "prea-004",
      trackingNumber: "JJD0099881276321",
      courier: "DHL",
      description: "Laptop Parts",
      status: "cancelled",
      statusLabel: "Cancelled",
      estimatedWeight: "3.0 lbs",
      estimatedArrival: "Jun 8, 2023",
      createdAt: "May 20, 2023",
    },
  ]

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pre-Alerts</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/customer/prealerts/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Pre-Alert
            </Link>
          </Button>
        </div>
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
              />
            </div>
            <Select>
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
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Courier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Couriers</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="dhl">DHL</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Input type="date" placeholder="Creation date" />
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Pre-Alert List</CardTitle>
            <CardDescription>
              Showing {preAlerts.length} pre-alerts
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              This Month
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Tracking #</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden md:table-cell">Est. Weight</TableHead>
                  <TableHead className="hidden md:table-cell">Est. Arrival</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preAlerts.map((preAlert) => (
                  <TableRow key={preAlert.id}>
                    <TableCell className="font-medium">{preAlert.trackingNumber}</TableCell>
                    <TableCell>{preAlert.courier}</TableCell>
                    <TableCell>{preAlert.description}</TableCell>
                    <TableCell className="hidden md:table-cell">{preAlert.estimatedWeight}</TableCell>
                    <TableCell className="hidden md:table-cell">{preAlert.estimatedArrival}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(preAlert.status)}>
                        {preAlert.statusLabel}
                      </Badge>
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
                            <Link href={`/customer/prealerts/${preAlert.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> 
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {preAlert.status === "pending" && (
                            <DropdownMenuItem>
                              <X className="mr-2 h-4 w-4" />
                              Cancel Pre-Alert
                            </DropdownMenuItem>
                          )}
                          {preAlert.status === "matched" && (
                            <DropdownMenuItem asChild>
                              <Link href="/customer/packages">
                                <Package className="mr-2 h-4 w-4" />
                                View Package
                              </Link>
                            </DropdownMenuItem>
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
              Showing <strong>{preAlerts.length}</strong> of <strong>{preAlerts.length}</strong> pre-alerts
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