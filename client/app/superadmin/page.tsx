'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  Building2,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package2,
  ScrollText,
  Bell,
} from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"
import { useSuperAdminUsers } from '@/hooks/useSuperAdminUsers';
import { useSuperAdminCompanies } from '@/hooks/useSuperAdminCompanies';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { getSystemStatistics, loading: statsLoading } = useSuperAdminUsers();
  const { fetchCompanies, companies, loading: companiesLoading } = useSuperAdminCompanies();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        const data = await getSystemStatistics();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    // Fetch recent companies
    const loadRecentCompanies = async () => {
      try {
        await fetchCompanies({
          page: 1,
          limit: 4,
          sort: 'createdAt',
          order: 'desc'
        });
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };

    fetchStats();
    loadRecentCompanies();
  }, [getSystemStatistics, fetchCompanies]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the SparrowX Super Admin Dashboard. Monitor and manage your multi-tenant platform.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-2 p-1">
            <TabsTrigger value="overview" className="flex-grow-0 whitespace-nowrap">
              Platform Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-grow-0 whitespace-nowrap">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-grow-0 whitespace-nowrap">
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-grow-0 whitespace-nowrap">
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Companies Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    Platform growing
                  </span>
                </p>
              </CardContent>
            </Card>
            
            {/* Active Users Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    {stats?.activePercentage || 0}% of total users
                  </span>
                </p>
              </CardContent>
            </Card>
            
            {/* New Users Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users (30d)</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.newUsers30Days || 0}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    Growing user base
                  </span>
                </p>
              </CardContent>
            </Card>
            
            {/* Total Users Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    Platform growth
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>Overview of platform activity across all companies</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center border rounded-md border-dashed">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Activity className="h-8 w-8" />
                    <p>Activity chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Companies</CardTitle>
                <CardDescription>Recently added companies to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companiesLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))
                  ) : companies.length > 0 ? (
                    companies.map((company) => (
                      <div key={company.id} className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{company.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Users className="mr-1 h-3 w-3" />
                              {company.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No companies found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="h-[400px]">
          <FeatureInProgress
            title="Analytics Coming Soon"
            description="Detailed analytics will be available in the next version of the platform."
            icon={<TrendingUp className="h-8 w-8" />}
          />
        </TabsContent>
        <TabsContent value="reports" className="h-[400px]">
          <FeatureInProgress
            title="Reports Coming Soon"
            description="Comprehensive reporting features will be available in the next version of the platform."
            icon={<ScrollText className="h-8 w-8" />}
          />
        </TabsContent>
        <TabsContent value="notifications" className="h-[400px]">
          <FeatureInProgress
            title="Notifications Coming Soon"
            description="System-wide notification management will be available in the next version of the platform."
            icon={<Bell className="h-8 w-8" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
