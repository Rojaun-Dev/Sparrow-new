'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useSuperAdminUsers } from '@/hooks/useSuperAdminUsers';
import {
  Users,
  Shield,
  User,
  ArrowUpRight,
  ArrowRight,
  UserPlus,
  UserCog,
} from "lucide-react";

export default function UsersPage() {
  const { getSystemStatistics, loading } = useSuperAdminUsers();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getSystemStatistics();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    fetchStats();
  }, [getSystemStatistics]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage admin users and customers across all companies in the platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
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

        {/* Admin Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.usersByRole?.find((r: any) => r.role === 'admin_l1' || r.role === 'admin_l2')?.count || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              <span className="flex items-center">
                Platform administrators
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Customer Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.usersByRole?.find((r: any) => r.role === 'customer')?.count || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              <span className="flex items-center">
                End users of the platform
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
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              <span className="flex items-center">
                {stats?.activePercentage || 0}% of total users
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Admin Users Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>Manage platform administrators across all companies</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading &&(
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </>
            )  
            }
          </CardContent>
          <CardFooter>
            <Link href="/superadmin/users/admins" className="w-full">
              <Button variant="default" className="w-full gap-2" disabled={loading}>
                <span>Manage Admins</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Customer Users Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Customer Users</CardTitle>
            <CardDescription>Manage end users of the platform</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </>
            )  
            }
          </CardContent>
          <CardFooter>
            <Link href="/superadmin/users/customers" className="w-full">
              <Button variant="default" className="w-full gap-2" disabled={loading}>
                <span>Manage Customers</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly user growth for the past year</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="grid grid-cols-12 gap-2 h-[200px]">
                  {Array(12).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col items-center justify-end gap-2">
                      <Skeleton className="h-full w-full" style={{ height: `${Math.random() * 100}%` }} />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            ) : stats?.usersByMonth ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>User growth visualization will be displayed here</p>
                  <p className="text-sm mt-2">Data available for implementation</p>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>No user growth data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 