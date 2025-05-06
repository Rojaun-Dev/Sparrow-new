import { CreditCard, FileText, Package, PlusCircle, RefreshCw, Truck } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function CustomerDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Packages in transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Ready for collection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$256.50</div>
            <p className="text-xs text-muted-foreground">3 outstanding invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Packages</CardTitle>
            <CardDescription>
              Your most recent packages and their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">SP-1234</TableCell>
                  <TableCell>Nike Shoes</TableCell>
                  <TableCell>
                    <Badge className="bg-amber-500">Processing</Badge>
                  </TableCell>
                  <TableCell>May 20, 2023</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SP-1235</TableCell>
                  <TableCell>Phone Case</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500">Ready for Pickup</Badge>
                  </TableCell>
                  <TableCell>May 18, 2023</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SP-1236</TableCell>
                  <TableCell>Electronics</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500">In Transit</Badge>
                  </TableCell>
                  <TableCell>May 15, 2023</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SP-1237</TableCell>
                  <TableCell>Books</TableCell>
                  <TableCell>
                    <Badge className="bg-green-700">Delivered</Badge>
                  </TableCell>
                  <TableCell>May 10, 2023</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/customer/packages">View All Packages</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Pre-Alert</CardTitle>
            <CardDescription>
              Register an incoming package to get a faster processing time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="tracking" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Tracking Number
                  </label>
                  <input
                    id="tracking"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="courier" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Courier
                  </label>
                  <select
                    id="courier"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select courier</option>
                    <option value="usps">USPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="ups">UPS</option>
                    <option value="dhl">DHL</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Description
                </label>
                <input
                  id="description"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Package contents"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="estimated_weight" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Estimated Weight (lbs)
                </label>
                <input
                  id="estimated_weight"
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0.0"
                  step="0.1"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit Pre-Alert
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your package activity timeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                {
                  title: "Package Received",
                  description: "Your package SP-1234 has been received in our warehouse.",
                  date: "1 hour ago",
                },
                {
                  title: "Invoice Generated",
                  description: "Invoice #INV-202 has been generated for your package SP-1234.",
                  date: "2 hours ago",
                },
                {
                  title: "Package Ready for Pickup",
                  description: "Your package SP-1235 is now ready for pickup.",
                  date: "1 day ago",
                },
                {
                  title: "Payment Received",
                  description: "Your payment of $85.20 for invoice #INV-201 has been processed.",
                  date: "2 days ago",
                },
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="mr-4 mt-0.5 flex h-2 w-2 rounded-full bg-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Outstanding Invoices</CardTitle>
            <CardDescription>Your pending payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  invoice: "INV-202",
                  amount: "$125.00",
                  date: "May 20, 2023",
                  status: "Due",
                },
                {
                  invoice: "INV-203",
                  amount: "$85.50",
                  date: "May 22, 2023",
                  status: "Due",
                },
                {
                  invoice: "INV-204",
                  amount: "$46.00",
                  date: "May 25, 2023",
                  status: "Due",
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.invoice}</p>
                    <p className="text-sm text-muted-foreground">Due: {item.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{item.amount}</p>
                    <Button size="sm" variant="outline">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/customer/invoices">View All Invoices</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 