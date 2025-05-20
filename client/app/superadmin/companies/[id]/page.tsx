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
  AlertTriangle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompany } from "@/hooks/useCompanies"
import { useCompanyStatistics } from "@/hooks/useCompanyStatistics"

export default function CompanyDetailsPage({ params }: { params: { id: string } }) {
  const { data: company, isLoading: companyLoading } = useCompany(params.id);
  const { data: statistics, isLoading: statsLoading } = useCompanyStatistics(params.id);
  const [activeTab, setActiveTab] = useState("overview");

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
        <Button asChild>
          <Link href={`/superadmin/users/admins?company=${company.id}`}>
            <Users className="mr-2 h-4 w-4" />
            View Admins
          </Link>
        </Button>
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
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>Overview of user activity and distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Total Users</h3>
                  <p className="text-2xl font-bold">{statistics?.totalUsers || 0}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Active Users</h3>
                  <p className="text-2xl font-bold">{statistics?.activeUsers || 0}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">New Users (30 days)</h3>
                  <p className="text-2xl font-bold">{statistics?.newUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Package Statistics</CardTitle>
              <CardDescription>Overview of package processing and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Total Packages</h3>
                  <p className="text-2xl font-bold">{statistics?.totalPackages || 0}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Active Packages</h3>
                  <p className="text-2xl font-bold">{statistics?.activePackages || 0}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Ready for Pickup</h3>
                  <p className="text-2xl font-bold">{statistics?.readyForPickup || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 