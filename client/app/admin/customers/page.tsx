"use client"

import { useState } from "react"
import Link from "next/link"
import { useCompanyUsers, useDeleteCompanyUser } from "@/hooks/useCompanyUsers"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { apiClient } from '@/lib/api/apiClient'
import { useQueryClient } from '@tanstack/react-query'
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
  Trash2,
  PowerOff
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
import { usersService } from '@/lib/api/customerService'
import { useCustomerStatisticsForAdmin } from '@/hooks/useProfile'

function CustomerRow({ customer, companyId, openActionDialog, openHardDeleteDialog, formatDate }: any) {
  const { data: stats, isLoading: statsLoading } = useCustomerStatisticsForAdmin(customer.id, companyId);
  return (
    <TableRow key={customer.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {`${customer.firstName[0]}${customer.lastName[0]}`}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{`${customer.firstName} ${customer.lastName}`}</div>
            <div className="text-xs text-muted-foreground">{customer.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={customer.isActive ? "default" : "secondary"}>
          {customer.isActive ? "active" : "inactive"}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {statsLoading ? <span className="animate-spin inline-block w-4 h-4 border-b-2 border-primary rounded-full" /> : stats?.totalPackages ?? '-'}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {statsLoading ? <span className="animate-spin inline-block w-4 h-4 border-b-2 border-primary rounded-full" /> : stats?.outstandingInvoices?.count ?? '-'}
      </TableCell>
      <TableCell className="hidden lg:table-cell">{formatDate(customer.createdAt)}</TableCell>
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
                <FileText className="mr-2 h-4 w-4" />
                View/Manage
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/invoices/create?customerId=${customer.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {customer.isActive ? (
              <DropdownMenuItem
                className="text-destructive hover:text-destructive/90"
                onClick={() => openActionDialog(customer.id, 'deactivate')}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate Account
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-green-600"
                onClick={() => openActionDialog(customer.id, 'reactivate')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Reactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => openHardDeleteDialog(customer.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function CustomersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate' | null>(null)
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false)
  const [customerToHardDelete, setCustomerToHardDelete] = useState<string | null>(null)

  // Fetch customers using the hook
  const { data: customersResponse, isLoading, error } = useCompanyUsers(user?.companyId || '', {
    role: 'customer',
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
  })

  const customers = customersResponse?.data || []
  const totalPages = customersResponse?.pagination.totalPages || 0

  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const openActionDialog = (customerId: string, type: 'deactivate' | 'reactivate') => {
    setCustomerToDelete(customerId)
    setActionType(type)
    setIsDeleteDialogOpen(true)
  }

  const handleActionCustomer = async () => {
    if (!customerToDelete || !actionType) return
    try {
      if (actionType === 'deactivate') {
        await apiClient.delete(`/admin/users/${customerToDelete}`)
        toast.success('Customer deactivated successfully')
      } else if (actionType === 'reactivate') {
        await apiClient.post(`/admin/users/${customerToDelete}/reactivate`)
        toast.success('Customer reactivated successfully')
      }
      queryClient.invalidateQueries({ queryKey: ['company-users', 'list', user?.companyId] })
      setIsDeleteDialogOpen(false)
      setCustomerToDelete(null)
      setActionType(null)
    } catch (error) {
      toast.error('Failed to update customer status')
      console.error('Error updating customer status:', error)
    }
  }

  const deleteCompanyUserMutation = useDeleteCompanyUser()

  const openHardDeleteDialog = (customerId: string) => {
    setCustomerToHardDelete(customerId)
    setIsHardDeleteDialogOpen(true)
  }

  const handleHardDeleteCustomer = async () => {
    if (!customerToHardDelete) return
    deleteCompanyUserMutation.mutate(
      { userId: customerToHardDelete, companyId: user?.companyId },
      {
        onSuccess: () => {
          toast.success('Customer deleted successfully')
          setIsHardDeleteDialogOpen(false)
          setCustomerToHardDelete(null)
        },
        onError: (error) => {
          toast.error('Failed to delete customer')
          console.error('Error deleting customer:', error)
        }
      }
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Customers</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No customers found. Try adjusting your search or filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map(customer => (
                    <CustomerRow
                      key={customer.id}
                      customer={customer}
                      companyId={user?.companyId || ''}
                      openActionDialog={openActionDialog}
                      openHardDeleteDialog={openHardDeleteDialog}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-2">
              <div>
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  className="border rounded px-2 py-1"
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'deactivate' ? 'Deactivate Customer' : 'Reactivate Customer'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'deactivate'
                ? 'Are you sure you want to deactivate this customer? They will no longer be able to access their account.'
                : 'Are you sure you want to reactivate this customer? They will regain access to their account.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'deactivate' ? 'destructive' : 'default'}
              onClick={handleActionCustomer}
            >
              {actionType === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Hard Delete Confirmation Dialog */}
      <Dialog open={isHardDeleteDialogOpen} onOpenChange={setIsHardDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to <span className="text-destructive font-bold">permanently delete</span> this customer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleHardDeleteCustomer} disabled={deleteCompanyUserMutation.isPending}>
              {deleteCompanyUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 