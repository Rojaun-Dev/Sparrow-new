"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Building2, 
  Users, 
  Package, 
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardCheck,
  AlertTriangle,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Search,
  UserPlus,
  ArrowRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { TableSkeleton } from "@/components/ui/loading-skeletons"
import { Input } from "@/components/ui/input"
import { useCompany } from "@/hooks/useCompanies"
import { useCompanyStatistics } from "@/hooks/useCompanyStatistics"
import { useCompanyUsers } from "@/hooks/useCompanyUsers"
import { useCompanyPackages } from "@/hooks/useCompanyPackages"
import { formatDate } from "@/lib/utils"

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Package {
  id: string;
  trackingNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function CompanyDetailsPage({ params }: { params: { id: string } }) {
  const { data: company, isLoading: companyLoading } = useCompany(params.id);
  const { data: statistics, isLoading: statsLoading } = useCompanyStatistics(params.id);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Users table state
  const [usersSearch, setUsersSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const { data: adminUsers, isLoading: usersLoading } = useCompanyUsers(params.id, {
    role: ["super_admin", "admin_l1", "admin_l2"],
    page: usersPage,
    limit: 10,
    search: usersSearch,
  });
  
  // Packages table state
  const [packagesSearch, setPackagesSearch] = useState("");
  const [packagesPage, setPackagesPage] = useState(1);
  const { data: packages, isLoading: packagesLoading } = useCompanyPackages(params.id, {
    page: packagesPage,
    limit: 10,
    search: packagesSearch,
  });

  if (companyLoading || statsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Company Not Found</h2>
        <p className="text-muted-foreground">The company you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/superadmin/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/superadmin/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            <p className="text-muted-foreground">{company.subdomain}.sparrowx.com</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Users Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span>{statistics?.activeUsers || 0} active users</span>
                </p>
              </CardContent>
            </Card>

            {/* Total Packages Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.totalPackages || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span>All time packages</span>
                </p>
              </CardContent>
            </Card>

            {/* Active Packages Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.activePackages || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowDownRight className="h-4 w-4 text-amber-500 mr-1" />
                  <span>In processing</span>
                </p>
              </CardContent>
            </Card>

            {/* Pending Pre-alerts Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Pre-alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.pendingPreAlerts || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span>Awaiting packages</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>General information and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {companyLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="h-4 w-4 mt-1" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {company.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{company.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {company.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{company.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {company.website && (
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Website</p>
                        <p className="text-sm text-muted-foreground">
                          <Link 
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                            target="_blank" 
                            className="flex items-center hover:underline"
                          >
                            {company.website}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {company.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">{company.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search users..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-[300px]"
              />
            </div>
            <Button asChild>
              <Link href={`/superadmin/users/admins?company=${company.id}`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Admin
              </Link>
            </Button>
          </div>

          {usersLoading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : adminUsers?.data ? (
            <ResponsiveTable
              data={adminUsers.data}
              columns={[
                {
                  header: "Name",
                  accessorKey: "firstName",
                  cell: (row: UserData) => (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{row.firstName} {row.lastName}</span>
                        <span className="text-sm text-muted-foreground">{row.email}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Role",
                  accessorKey: "role",
                  cell: (row: UserData) => (
                    <Badge variant={row.role === 'super_admin' ? 'default' : 'secondary'}>
                      {row.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ),
                },
                {
                  header: "Status",
                  accessorKey: "isActive",
                  cell: (row: UserData) => (
                    <Badge variant={row.isActive ? 'success' : 'destructive'}>
                      {row.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  ),
                },
                {
                  header: "Created",
                  accessorKey: "createdAt",
                  cell: (row: UserData) => formatDate(row.createdAt),
                },
                {
                  header: "Actions",
                  accessorKey: "id",
                  cell: (row: UserData) => (
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/superadmin/users/${row.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ),
                },
              ]}
              pagination={{
                currentPage: usersPage,
                totalPages: adminUsers.pagination.totalPages,
                onPageChange: setUsersPage,
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">No Users Found</h2>
              <p className="text-muted-foreground">This company doesn't have any admin users yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search packages..."
                value={packagesSearch}
                onChange={(e) => setPackagesSearch(e.target.value)}
                className="w-[300px]"
              />
            </div>
          </div>

          {packagesLoading ? (
            <TableSkeleton columns={6} rows={5} />
          ) : packages?.data ? (
            <ResponsiveTable
              data={packages.data}
              columns={[
                {
                  header: "Tracking Number",
                  accessorKey: "trackingNumber",
                  cell: (row: Package) => (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{row.trackingNumber}</span>
                        <span className="text-sm text-muted-foreground">{row.user?.name || 'N/A'}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  accessorKey: "status",
                  cell: (row: Package) => (
                    <Badge variant={row.status === 'delivered' ? 'success' : 'secondary'}>
                      {row.status.toUpperCase()}
                    </Badge>
                  ),
                },
                {
                  header: "Customer",
                  accessorKey: "id",
                  cell: (row: Package) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{row.user?.name || 'N/A'}</span>
                      <span className="text-sm text-muted-foreground">{row.user?.email || 'N/A'}</span>
                    </div>
                  ),
                },
                {
                  header: "Created",
                  accessorKey: "createdAt",
                  cell: (row: Package) => formatDate(row.createdAt),
                },
                {
                  header: "Updated",
                  accessorKey: "updatedAt",
                  cell: (row: Package) => formatDate(row.updatedAt),
                },
                {
                  header: "Actions",
                  accessorKey: "id",
                  cell: (row: Package) => (
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/superadmin/packages/${row.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ),
                },
              ]}
              pagination={{
                currentPage: packagesPage,
                totalPages: packages.pagination.totalPages,
                onPageChange: setPackagesPage,
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Package className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">No Packages Found</h2>
              <p className="text-muted-foreground">This company doesn't have any packages yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 