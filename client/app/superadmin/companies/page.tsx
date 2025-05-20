"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Building2, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Users, Package } from "lucide-react"

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
import { useSuperAdminCompanies } from "@/hooks/useSuperAdminCompanies"
import { useFeedback } from "@/components/ui/toast-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyData } from "@/lib/api/companyService"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define the sort state type
type SortState = {
  column: string | null;
  direction: "asc" | "desc";
}

export default function CompaniesPage() {
  const { 
    companies, 
    pagination, 
    loading, 
    error, 
    fetchCompanies, 
    deleteCompany 
  } = useSuperAdminCompanies();
  
  const { showFeedback } = useFeedback();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSort, setCurrentSort] = useState<SortState>({ column: null, direction: "asc" });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyData | null>(null);

  // Fetch companies on component mount and when search/sort changes
  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      sort: currentSort.column || undefined,
      order: currentSort.direction,
      search: searchQuery || undefined,
    };
    
    fetchCompanies(params);
  }, [fetchCompanies, pagination.page, pagination.limit, currentSort, searchQuery]);

  // Handle sort change
  const handleSort = (column: string) => {
    setCurrentSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Sortable table head component
  const SortableTableHead = ({ column, title }: { column: string; title: string }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="flex items-center gap-1"
    >
      {title}
      {currentSort.column === column && (
        currentSort.direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
      )}
    </Button>
  );

  // Get status badge
  function getStatusBadge(status: string) {
    return (
      <Badge variant={status === "active" ? "success" : status === "inactive" ? "destructive" : "outline"}>
        {status}
      </Badge>
    );
  }

  // Function to handle company deletion
  const handleDeleteCompany = async (company: CompanyData) => {
    try {
      await deleteCompany(company.id);
      showFeedback(`Company "${company.name}" has been deleted successfully.`, "success");
    } catch (error) {
      console.error("Error deleting company:", error);
      showFeedback("Failed to delete company. Please try again.", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  // Actions dropdown component
  const ActionsDropdown = ({ company }: { company: CompanyData }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/superadmin/companies/${company.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            setCompanyToDelete(company);
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete Company
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Table columns
  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof CompanyData,
      cell: (company: CompanyData) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{company.name}</span>
        </div>
      ),
    },
    {
      header: "Subdomain",
      accessorKey: "subdomain" as keyof CompanyData,
    },
    {
      header: "Email",
      accessorKey: "email" as keyof CompanyData,
    },
    {
      header: "Users",
      accessorKey: "userCount" as keyof CompanyData,
      cell: (company: CompanyData) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{company.userCount}</span>
        </div>
      ),
    },
    {
      header: "Packages",
      accessorKey: "packageCount" as keyof CompanyData,
      cell: (company: CompanyData) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{company.packageCount}</span>
        </div>
      ),
    },
    {
      header: "Created",
      accessorKey: "createdAt" as keyof CompanyData,
      cell: (company: CompanyData) => new Date(company.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof CompanyData,
      cell: (company: CompanyData) => <ActionsDropdown company={company} />,
      className: "text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Companies</h1>
          <p className="text-muted-foreground">Manage all companies registered on the platform.</p>
        </div>
        <Button asChild className="mt-2 sm:mt-0">
          <Link href="/superadmin/companies/create">
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
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ResponsiveTable
              data={companies}
              columns={columns}
              onRowClick={(company) => (window.location.href = `/superadmin/companies/${company.id}`)}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {companyToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCompanyToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (companyToDelete) {
                  handleDeleteCompany(companyToDelete);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
