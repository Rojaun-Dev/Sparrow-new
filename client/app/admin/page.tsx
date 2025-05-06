"use client"

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
  ChevronRight
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

export default function AdminDashboard() {
  // Mock data for dashboard - in a real app, this would come from API calls
  const metrics = {
    packagesReceived: 38,
    packagesReadyForPickup: 15,
    pendingPrealerts: 24,
    outstandingInvoices: 8,
    totalCustomers: 152,
    revenueToday: 2450,
    completedDeliveries: 26
  }

  // Mock data for charts
  const revenueData = [
    { month: "Jan", revenue: 3200 },
    { month: "Feb", revenue: 2800 },
    { month: "Mar", revenue: 3400 },
    { month: "Apr", revenue: 3600 },
    { month: "May", revenue: 4200 },
    { month: "Jun", revenue: 3800 },
    { month: "Jul", revenue: 4600 },
  ]

  const packageStatusData = [
    { status: "Pre-alerts", count: 24 },
    { status: "Received", count: 18 },
    { status: "Processed", count: 12 },
    { status: "Ready", count: 15 },
    { status: "Delivered", count: 26 },
    { status: "Returned", count: 3 },
  ]

  const pendingTasks = [
    { id: 1, title: "Process incoming packages", count: 12, priority: "high" },
    { id: 2, title: "Match pre-alerts to received packages", count: 8, priority: "medium" },
    { id: 3, title: "Process invoice payments", count: 5, priority: "medium" },
    { id: 4, title: "Contact customers for package pickup", count: 7, priority: "normal" },
    { id: 5, title: "Update shipping rates", count: 1, priority: "low" },
  ]

  const recentActivity = [
    { id: 1, action: "Package received", target: "PKG-78542", user: "Jane Smith", time: "10 mins ago" },
    { id: 2, action: "Invoice paid", target: "INV-2023-156", user: "Mike Johnson", time: "25 mins ago" },
    { id: 3, action: "Pre-alert created", target: "PA-45231", user: "David Williams", time: "1 hour ago" },
    { id: 4, action: "Package picked up", target: "PKG-78498", user: "Sarah Brown", time: "2 hours ago" },
    { id: 5, action: "New customer registered", target: "Sarah Brown", user: "System", time: "3 hours ago" },
  ]

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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Last 7 Days
          </Button>
          <Button variant="outline" size="sm">
            Last 30 Days
          </Button>
          <Button size="sm">Today</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Packages Received Today</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.packagesReceived}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>12% increase from yesterday</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ready For Pickup</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.packagesReadyForPickup}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-4 w-4 text-amber-500 mr-1" />
              <span>3 packages awaiting 3+ days</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Pre-alerts</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingPrealerts}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>8 new pre-alerts today</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.outstandingInvoices}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
              <span>3 overdue invoices</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-[2/1]">
              <RechartLineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" activeDot={{ r: 8 }} />
              </RechartLineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Package Status Distribution</CardTitle>
            <CardDescription>Current status of all packages</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-[2/1]">
              <RechartBarChart data={packageStatusData}>
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

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Tasks requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {pendingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Badge variant={
                      task.priority === "high" ? "destructive" : 
                      task.priority === "medium" ? "default" : 
                      "secondary"
                    } className="rounded-sm">
                      {task.count}
                    </Badge>
                    <span>{task.title}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    View <ChevronRight className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activity</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{activity.action}</span>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.target} by {activity.user}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 