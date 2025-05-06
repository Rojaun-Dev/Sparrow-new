import Link from "next/link"
import { Calendar, ChevronDown, CreditCard, Download, Eye, Filter, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

export default function PaymentsPage() {
  // Example payment data - in a real app, this would come from an API
  const payments = [
    {
      id: "pmt-001",
      invoiceNumber: "INV-203",
      paymentMethod: "Credit Card",
      paymentMethodDetails: "**** **** **** 4242",
      amount: "$85.50",
      status: "completed",
      statusLabel: "Completed",
      date: "May 29, 2023",
      transactionId: "txn_1NjTxLKj8JNkCvBl7QTrFxBp",
    },
    {
      id: "pmt-002",
      invoiceNumber: "INV-201",
      paymentMethod: "PayPal",
      paymentMethodDetails: "john.doe@example.com",
      amount: "$112.30",
      status: "completed",
      statusLabel: "Completed",
      date: "May 18, 2023",
      transactionId: "9K5731485Y547602N",
    },
    {
      id: "pmt-003",
      invoiceNumber: "INV-200",
      paymentMethod: "Bank Transfer",
      paymentMethodDetails: "Wire Transfer",
      amount: "$215.75",
      status: "completed",
      statusLabel: "Completed",
      date: "May 10, 2023",
      transactionId: "WIRE-78912345",
    },
    {
      id: "pmt-004",
      invoiceNumber: "INV-199",
      paymentMethod: "Credit Card",
      paymentMethodDetails: "**** **** **** 4242",
      amount: "$45.20",
      status: "failed",
      statusLabel: "Failed",
      date: "May 5, 2023",
      transactionId: "txn_1NjLkPKj8JNkCvBl6YTfJsBn",
    },
    {
      id: "pmt-005",
      invoiceNumber: "INV-199",
      paymentMethod: "Credit Card",
      paymentMethodDetails: "**** **** **** 4242",
      amount: "$45.20",
      status: "completed",
      statusLabel: "Completed",
      date: "May 6, 2023",
      transactionId: "txn_1NjMxRKj8JNkCvBl2FTwMpSq",
    },
  ]

  // Example payment methods
  const paymentMethods = [
    {
      id: "pm-001",
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2024,
      isDefault: true,
    },
    {
      id: "pm-002",
      type: "card",
      brand: "Mastercard",
      last4: "5555",
      expiryMonth: 10,
      expiryYear: 2025,
      isDefault: false,
    },
    {
      id: "pm-003",
      type: "paypal",
      email: "john.doe@example.com",
      isDefault: false,
    },
  ]

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      case "refunded":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Payment Methods
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Payment methods management will be available in a future release</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>Find specific transactions by invoice number, date range, or amount.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-8"
                  />
                </div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="card">Credit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <Input type="date" placeholder="From Date" />
                </div>
                <div>
                  <Input type="date" placeholder="To Date" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <Button variant="outline" size="sm">
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
                <Button size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your payment history for the past 90 days
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Last 90 Days
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          <Link href={`/customer/invoices/${payment.invoiceNumber}`} className="hover:underline">
                            {payment.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{payment.paymentMethod}</span>
                            <span className="text-xs text-muted-foreground">{payment.paymentMethodDetails}</span>
                          </div>
                        </TableCell>
                        <TableCell>{payment.amount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(payment.status)}>
                            {payment.statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/customer/payments/${payment.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Receipt
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download Receipt
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  Showing <strong>{payments.length}</strong> of <strong>{payments.length}</strong> transactions
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Saved Payment Methods</CardTitle>
                <CardDescription>
                  Manage your saved payment methods
                </CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Add New Method
                      <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adding payment methods will be available in a future release</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
                <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">Payment Methods Management Coming Soon</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground max-w-md">
                  In a future update, you'll be able to add and manage your payment methods securely for faster checkout.
                </p>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Available in v2</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Payment FAQs</CardTitle>
          <CardDescription>
            Common questions about payments and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium">When am I charged for my packages?</h3>
            <p className="text-sm text-muted-foreground">
              Invoices are generated when your package is processed at our warehouse. You'll have 14 days to pay before the invoice becomes overdue.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-base font-medium">What payment methods do you accept?</h3>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and bank transfers.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-base font-medium">Is my payment information secure?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, all payment information is encrypted and securely processed. We do not store your full credit card details on our servers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 