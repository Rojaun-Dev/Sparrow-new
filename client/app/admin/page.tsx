"use client"



import { useEffect } from 'react';

import { useAdminStatistics } from '@/hooks/useAdminStatistics';

import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import { Separator } from "@/components/ui/separator"

import { 

  BarChart3, 

  Package, 

  ShoppingBag, 

  Users, 

  DollarSign, 

  ClipboardCheck, 

  AlertTriangle,

  TrendingUp,

  TrendingDown,

  Truck,

  ChevronRight,

  FileText,

  CreditCard,

  Repeat

} from "lucide-react"

import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

import { 

  BarChart as RechartBarChart, 

  Bar, 

  LineChart as RechartLineChart, 

  Line, 

  XAxis, 

  YAxis, 

  CartesianGrid, 

  Tooltip, 

  ResponsiveContainer,

  Legend

} from "recharts"

import { Skeleton } from "@/components/ui/skeleton"

import { 

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select"



export default function AdminDashboard() {

  const { statistics, loading, fetchStatistics, selectedCurrency, setSelectedCurrency } = useAdminStatistics();

  const { user } = useAuth();

  const isAdminL2 = user?.role === 'admin_l2';



  // Debug user role status

  console.log('[AdminDashboard] User role:', user?.role, 'isAdminL2:', isAdminL2);



  useEffect(() => {

    fetchStatistics();

  }, [fetchStatistics]);


  // Chart colors

  const chartConfig = {

    revenue: { color: "#3b82f6" },

    preAlerts: { color: "#eab308" },

    received: { color: "#3b82f6" },

    processed: { color: "#10b981" },

    ready: { color: "#a855f7" },

    delivered: { color: "#24b47e" },

    returned: { color: "#f97316" },

  }



  // Handle currency selection change

  const handleCurrencyChange = (value: string) => {

    if (value === 'USD' || value === 'JMD') {

      setSelectedCurrency(value);

    }

  };



  // Format currency values

  const formatCurrency = (amount: number) => {

    if (selectedCurrency === 'USD') {

      return `$${amount.toFixed(2)}`;

    } else {

      return `J$${amount.toFixed(2)}`;

    }

  };



  if (loading) {

    return (

      <div className="space-y-4">

        <div className="flex items-center justify-between mb-6">

          <Skeleton className="h-8 w-48" />

          <div className="flex items-center gap-2">

            <Skeleton className="h-8 w-24" />

            <Skeleton className="h-8 w-24" />

            <Skeleton className="h-8 w-24" />

          </div>

        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {Array(4).fill(0).map((_, i) => (

            <Card key={i}>

              <CardHeader className="flex flex-row items-center justify-between pb-2">

                <Skeleton className="h-4 w-32" />

                <Skeleton className="h-4 w-4" />

              </CardHeader>

              <CardContent>

                <Skeleton className="h-8 w-16" />

                <Skeleton className="h-4 w-32 mt-2" />

              </CardContent>

            </Card>

          ))}

        </div>

        {/* Chart skeletons */}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">

          {isAdminL2 && (

            <Card className="lg:col-span-4">

              <CardHeader>

                <Skeleton className="h-6 w-40 mb-2" />

                <Skeleton className="h-4 w-32" />

              </CardHeader>

              <CardContent>

                <Skeleton className="w-full aspect-[2/1]" />

              </CardContent>

            </Card>

          )}

          <Card className={isAdminL2 ? "lg:col-span-3" : "lg:col-span-7"}>

            <CardHeader>

              <Skeleton className="h-6 w-40 mb-2" />

              <Skeleton className="h-4 w-32" />

            </CardHeader>

            <CardContent>

              <Skeleton className="w-full aspect-[2/1]" />

            </CardContent>

          </Card>

        </div>

      </div>

    );

  }



  return (

    <>

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        {isAdminL2 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Currency:</span>
            <Select
              value={selectedCurrency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="JMD">JMD (J$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>



      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <Card>

          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">Packages Received Today</CardTitle>

            <Package className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{statistics?.packagesThisMonth || 0}</div>

            <p className="text-xs text-muted-foreground flex items-center mt-1">

              {(statistics?.packageGrowth || 0) > 0 ? (

                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />

              ) : (

                <TrendingDown className="h-4 w-4 text-amber-500 mr-1" />

              )}

              <span>{Math.abs(statistics?.packageGrowth || 0).toFixed(1)}% {(statistics?.packageGrowth || 0) > 0 ? 'increase' : 'decrease'} from last month</span>

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">Ready For Pickup</CardTitle>

            <ShoppingBag className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{statistics?.packagesByStatus?.ready_for_pickup || 0}</div>

            <p className="text-xs text-muted-foreground flex items-center mt-1">

              <TrendingDown className="h-4 w-4 text-amber-500 mr-1" />

              <span>Packages awaiting pickup</span>

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">Pending Pre-alerts</CardTitle>

            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{statistics?.pendingPreAlerts || 0}</div>

            <p className="text-xs text-muted-foreground flex items-center mt-1">

              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />

              <span>Pre-alerts to process</span>

            </p>

          </CardContent>

        </Card>

        {isAdminL2 && (

          <Card>

            <CardHeader className="flex flex-row items-center justify-between pb-2">

              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>

              <DollarSign className="h-4 w-4 text-muted-foreground" />

            </CardHeader>

            <CardContent>

              <div className="text-2xl font-bold">

                {formatCurrency(statistics?.revenue?.current || 0)}

                {statistics?.currency && (

                  <span className="text-xs ml-1 text-muted-foreground">

                    {statistics.currency}

                  </span>

                )}

              </div>

              <p className="text-xs text-muted-foreground flex items-center mt-1">

                {(statistics?.revenue?.growth || 0) > 0 ? (

                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />

                ) : (

                  <TrendingDown className="h-4 w-4 text-amber-500 mr-1" />

                )}

                <span>{Math.abs(statistics?.revenue?.growth || 0).toFixed(1)}% {(statistics?.revenue?.growth || 0) > 0 ? 'increase' : 'decrease'} from last month</span>

              </p>

            </CardContent>

          </Card>

        )}

      </div>



      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">

        {isAdminL2 && (

          <Card className="lg:col-span-4">

            <CardHeader>

              <CardTitle>Revenue Overview</CardTitle>

              <CardDescription>

                Monthly revenue trend ({selectedCurrency})

                {statistics?.exchangeRate && (

                  <span className="ml-2 text-xs text-muted-foreground">

                    Exchange Rate: 1 USD = {statistics.exchangeRate.toFixed(2)} JMD

                  </span>

                )}

              </CardDescription>

            </CardHeader>

            <CardContent>

              <ChartContainer config={chartConfig} className="aspect-[2/1]">

                <RechartLineChart data={statistics?.monthlyRevenueTrend || []}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" />

                  <YAxis

                    tickFormatter={(value) => 

                      selectedCurrency === 'USD' 

                        ? `$${value}`

                        : `J$${value}`

                    }

                  />

                  <ChartTooltip 

                    formatter={(value: number) => [

                      formatCurrency(value),

                      'Revenue'

                    ]} 

                  />

                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" activeDot={{ r: 8 }} />

                </RechartLineChart>

              </ChartContainer>

            </CardContent>

          </Card>

        )}

        <Card className={isAdminL2 ? "lg:col-span-3" : "lg:col-span-7"}>

          <CardHeader>

            <CardTitle>Package Status Distribution</CardTitle>

            <CardDescription>Current status of all packages</CardDescription>

          </CardHeader>

          <CardContent>

            <ChartContainer config={chartConfig} className="aspect-[2/1]">

              <RechartBarChart data={Object.entries(statistics?.packagesByStatus || {}).map(([status, count]) => ({

                status: status.replace('_', ' ').toUpperCase(),

                count

              }))}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="status" />

                <YAxis />

                <ChartTooltip />

                <Bar dataKey="count" fill="#3b82f6" />

              </RechartBarChart>

            </ChartContainer>

          </CardContent>

        </Card>

      </div>

    </>

  )

} 