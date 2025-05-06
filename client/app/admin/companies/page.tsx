"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Eye, Trash } from "lucide-react"
import { ResponsiveTable } from "@/components/ui/responsive-table"

// Import the useFeedback hook and ConfirmationDialog component
import { useFeedback } from "@/components/ui/toast-provider"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

// Mock data for companies
const companies = [
  {
    id: "1",
    name: "Acme Shipping",
    subdomain: "acme",
    status: "active",
    users: 24,
    packages: 128,
    createdAt: "2023-05-12",
  },
  {
    id: "2",
    name: "Global Logistics",
    subdomain: "global",
    status: "active",
    users: 16,
    packages: 85,
    createdAt: "2023-06-18",
  },
  {
    id: "3",
    name: "FastTrack Delivery",
    subdomain: "fasttrack",
    status: "active",
    users: 12,
    packages: 64,
    createdAt: "2023-07-24",
  },
  {
    id: "4",
    name: "Island Express",
    subdomain: "island",
    status: "inactive",
    users: 8,
    packages: 42,
    createdAt: "2023-08-30",
  },
  {
    id: "5",
    name: "Swift Carriers",
    subdomain: "swift",
    status: "pending",
    users: 0,
    packages: 0,
    createdAt: "2023-09-15",
  },
]

// Add sorting state
type SortColumn = keyof (typeof companies)[0] | null
type SortDirection = "asc" | "desc"
type SortState = { column: SortColumn; direction: SortDirection }

// Add the useFeedback hook inside the component
export default function CompaniesPage() {
  const [currentSort, setCurrentSort] = useState<SortState>({ column: null, direction: "asc" })
  const [searchQuery, setSearchQuery] = useState("")
  const { showFeedback } = useFeedback()

  // Sort companies based on current sort state
  const sortedCompanies = [...companies]
    .filter(
      (company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.subdomain.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (!currentSort.column) return 0

      const aValue = a[currentSort.column]
      const bValue = b[currentSort.column]

      if (aValue < bValue) return currentSort.direction === "asc" ? -1 : 1
      if (aValue > bValue) return currentSort.direction === "asc" ? 1 : -1
      return 0
    })

  // Sortable table header component
  function SortableTableHead({
    column,
    title,
  }: {
    column: SortColumn
    title: string
  }) {
    const isActive = currentSort.column === column

    const toggleSort = () => {
      if (isActive) {
        // Toggle direction if already sorting by this column
        setCurrentSort({
          column,
          direction: currentSort.direction === "asc" ? "desc" : "asc",
        })
      } else {
        // Set new sort column with default ascending direction
        setCurrentSort({
          column,
          direction: "asc",
        })
      }
    }

    return (
      <div className="flex items-center gap-1 cursor-pointer" onClick={toggleSort}>
        {title}
        {isActive ? (
          currentSort.direction === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    )
  }

  // Get status badge
  function getStatusBadge(status: string) {
    return (
      <Badge variant={status === "active" ? "success" : status === "inactive" ? "destructive" : "outline"}>
        {status}
      </Badge>
    )
  }

  // Function to handle company deletion
  const handleDeleteCompany = async (company: (typeof companies)[0]) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, this would call an API to delete the company
      console.log(`Deleting company ${company.id}`)

      // Show success feedback
      showFeedback(`Company "${company.name}" has been deleted successfully.`, "success")
    } catch (error) {
      console.error("Error deleting company:", error)
      showFeedback("Failed to delete company. Please try again.", "error")
    }
  }

  // Update the ActionsDropdown component to use ConfirmationDialog
  function ActionsDropdown({ company }: { company: (typeof companies)[0] }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/companies/${company.id}`} className="flex w-full items-center">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <ConfirmationDialog
              title="Delete Company"
              description={`Are you sure you want to delete "${company.name}"? This action cannot be undone and will permanently delete all associated data.`}
              confirmText="Delete"
              variant="destructive"
              onConfirm={() => handleDeleteCompany(company)}
              trigger={
                <button className="flex w-full items-center text-red-600 focus:text-red-600">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Company
                </button>
              }
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Table columns
  const columns = [
    {
      header: <SortableTableHead column="name" title="Name" />,
      accessorKey: "name" as const,
      cell: (company: (typeof companies)[0]) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{company.name}</span>
        </div>
      ),
    },
    {
      header: <SortableTableHead column="subdomain" title="Subdomain" />,
      accessorKey: "subdomain" as const,
    },
    {
      header: <SortableTableHead column="status" title="Status" />,
      accessorKey: "status" as const,
      cell: (company: (typeof companies)[0]) => getStatusBadge(company.status),
    },
    {
      header: <SortableTableHead column="users" title="Users" />,
      accessorKey: "users" as const,
    },
    {
      header: <SortableTableHead column="packages" title="Packages" />,
      accessorKey: "packages" as const,
    },
    {
      header: <SortableTableHead column="createdAt" title="Created" />,
      accessorKey: "createdAt" as const,
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (company: (typeof companies)[0]) => <ActionsDropdown company={company} />,
      className: "text-right",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Companies</h1>
          <p className="text-muted-foreground">Manage all companies registered on the SparrowX platform.</p>
        </div>
        <Button asChild className="mt-2 sm:mt-0">
          <Link href="/admin/companies/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Company
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>A list of all companies registered on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search companies..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              Filter
            </Button>
          </div>

          <ResponsiveTable
            data={sortedCompanies}
            columns={columns}
            onRowClick={(company) => (window.location.href = `/admin/companies/${company.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
