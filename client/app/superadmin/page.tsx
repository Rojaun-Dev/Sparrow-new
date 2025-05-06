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

export default function AdminDashboard() {
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    +2 from last month
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">573</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    +18% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,284</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    +7% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,543</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500 flex items-center">
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                    -2% from last month
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
                  {[
                    { name: "Acme Shipping", packages: 128, users: 24 },
                    { name: "Global Logistics", packages: 85, users: 16 },
                    { name: "FastTrack Delivery", packages: 64, users: 12 },
                    { name: "Island Express", packages: 42, users: 8 },
                  ].map((company, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{company.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Package2 className="mr-1 h-3 w-3" />
                            {company.packages} packages
                          </div>
                          <div className="flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            {company.users} users
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
