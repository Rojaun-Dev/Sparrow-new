"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Mail, 
  Package, 
  FileText, 
  Pencil, 
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Mock data for customers
const CUSTOMERS = [
  {
    id: "cust-1234",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (876) 555-1234",
    address: "123 Main St, Kingston, Jamaica",
    status: "active",
    totalPackages: 12,
    outstandingInvoices: 1,
    created: "2023-01-15T00:00:00Z"
  },
  {
    id: "cust-1235",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+1 (876) 555-2345",
    address: "456 Oak Ave, Montego Bay, Jamaica",
    status: "active",
    totalPackages: 8,
    outstandingInvoices: 0,
    created: "2023-02-22T00:00:00Z"
  },
  {
    id: "cust-1236",
    name: "Michael Brown",
    email: "mbrown@example.com",
    phone: "+1 (876) 555-3456",
    address: "789 Pine Rd, Spanish Town, Jamaica",
    status: "inactive",
    totalPackages: 4,
    outstandingInvoices: 2,
    created: "2023-03-10T00:00:00Z"
  },
  {
    id: "cust-1237",
    name: "Alicia Williams",
    email: "awilliams@example.com",
    phone: "+1 (876) 555-4567",
    address: "321 Cedar Ln, Portmore, Jamaica",
    status: "active",
    totalPackages: 15,
    outstandingInvoices: 0,
    created: "2023-01-05T00:00:00Z"
  },
  {
    id: "cust-1238",
    name: "David Wilson",
    email: "dwilson@example.com",
    phone: "+1 (876) 555-5678",
    address: "654 Maple Dr, Ocho Rios, Jamaica",
    status: "active",
    totalPackages: 6,
    outstandingInvoices: 1,
    created: "2023-04-18T00:00:00Z"
  },
]

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)

  // Filter customers based on search query and status filter
  const filteredCustomers = CUSTOMERS.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          customer.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === null || customer.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status)
  }

  const openDeleteDialog = (customerId: string) => {
    setCustomerToDelete(customerId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteCustomer = () => {
    // In a real app, this would call an API to delete the customer
    console.log(`Deleting customer ${customerToDelete}`)
    setIsDeleteDialogOpen(false)
    setCustomerToDelete(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/admin/customers/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>View and manage your customer accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Filter
                    {statusFilter && <Badge className="ml-1 px-1">1</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => handleStatusFilterChange(null)}>
                    All Customers
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("active")}>
                    Active Customers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("inactive")}>
                    Inactive Customers
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Packages</TableHead>
                  <TableHead className="hidden md:table-cell">Invoices</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No customers found. Try adjusting your search or filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-muted-foreground">{customer.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{customer.totalPackages}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.outstandingInvoices > 0 ? (
                          <Badge variant="destructive">{customer.outstandingInvoices}</Badge>
                        ) : (
                          "0"
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(customer.created)}</TableCell>
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
                              <Link href={`/admin/customers/${customer.id}`}>
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/customers/${customer.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Customer
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/customers/${customer.id}/packages`}>
                                <Package className="mr-2 h-4 w-4" />
                                View Packages
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/customers/${customer.id}/invoices`}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Invoices
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/invoices/create?customerId=${customer.id}`}>
                                Create Invoice
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`mailto:${customer.email}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => openDeleteDialog(customer.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Customer
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone and will delete all customer data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 