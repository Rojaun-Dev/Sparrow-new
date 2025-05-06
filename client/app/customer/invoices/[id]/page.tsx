"use client"

import Link from "next/link"
import { ArrowLeft, CreditCard, Download, ExternalLink, FileText, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Define types for the invoice data
type PaymentHistory = {
  date: string;
  method: string;
  transactionId: string;
  amount: string;
}

export default function InvoiceDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, this would be fetched from an API
  const invoice = {
    id: params.id,
    invoiceNumber: "INV-202",
    status: "unpaid",
    statusLabel: "Unpaid",
    issueDate: "May 20, 2023",
    dueDate: "Jun 03, 2023",
    subtotal: "$120.00",
    tax: "$5.30",
    total: "$125.30",
    packages: [
      { id: "pkg-001", trackingNumber: "SP-1234", description: "Nike Shoes", weight: "2.5 lbs" }
    ],
    items: [
      { description: "Shipping Fee", details: "International shipping", amount: "$90.00" },
      { description: "Handling Fee", details: "Package processing", amount: "$30.00" },
      { description: "Tax", details: "Sales tax", amount: "$5.30" },
    ],
    billingAddress: {
      name: "John Doe",
      line1: "123 Main St",
      city: "Kingston",
      state: "Jamaica",
      postalCode: "00001",
      country: "Jamaica"
    },
    paymentHistory: [] as PaymentHistory[]
  }

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500"
      case "unpaid":
        return "bg-amber-500"
      case "overdue":
        return "bg-red-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/customer/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Invoice</h1>
            <p className="text-sm text-muted-foreground">
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Issued on {invoice.issueDate}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(invoice.status)}>
                {invoice.statusLabel}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoice Date</h3>
                    <p className="text-base">{invoice.issueDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                    <p className={`text-base ${invoice.status === "overdue" ? "text-red-600 font-medium" : ""}`}>
                      {invoice.dueDate}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                    <p className="text-base">{invoice.invoiceNumber}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Billing Address</h3>
                    <div className="text-sm">
                      <p>{invoice.billingAddress.name}</p>
                      <p>{invoice.billingAddress.line1}</p>
                      <p>
                        {invoice.billingAddress.city}, {invoice.billingAddress.state} {invoice.billingAddress.postalCode}
                      </p>
                      <p>{invoice.billingAddress.country}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="mb-4 text-base font-medium">Related Packages</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.trackingNumber}</TableCell>
                          <TableCell>{pkg.description}</TableCell>
                          <TableCell>{pkg.weight}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/customer/packages/${pkg.id}`}>
                                View Package
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="mb-4 text-base font-medium">Invoice Items</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>{item.details}</TableCell>
                          <TableCell className="text-right">{item.amount}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-medium">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right">{invoice.subtotal}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-medium">
                          Tax
                        </TableCell>
                        <TableCell className="text-right">{invoice.tax}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-medium">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold">{invoice.total}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {invoice.paymentHistory.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-4 text-base font-medium">Payment History</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.paymentHistory.map((payment, index) => (
                            <TableRow key={index}>
                              <TableCell>{payment.date}</TableCell>
                              <TableCell>{payment.method}</TableCell>
                              <TableCell className="font-mono text-xs">{payment.transactionId}</TableCell>
                              <TableCell className="text-right">{payment.amount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            {invoice.status === "unpaid" || invoice.status === "overdue" ? (
              <CardFooter className="flex justify-end border-t px-6 pt-4">
                <Button asChild>
                  <Link href={`/customer/invoices/${invoice.id}/pay`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Link>
                </Button>
              </CardFooter>
            ) : (
              <CardFooter className="flex justify-center border-t px-6 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/customer/invoices">
                    Back to Invoices
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-2 rounded-md border p-6">
                <Badge className={`mb-2 ${getStatusBadgeColor(invoice.status)}`}>
                  {invoice.statusLabel}
                </Badge>
                <p className="text-2xl font-bold">{invoice.total}</p>
                {invoice.status === "unpaid" && (
                  <p className="text-center text-sm text-muted-foreground">
                    Due on {invoice.dueDate}
                  </p>
                )}
                {invoice.status === "overdue" && (
                  <p className="text-center text-sm text-red-600">
                    Overdue since {invoice.dueDate}
                  </p>
                )}
                {invoice.status === "paid" && invoice.paymentHistory.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Paid on {invoice.paymentHistory[0].date}
                  </p>
                )}
              </div>
              
              {(invoice.status === "unpaid" || invoice.status === "overdue") && (
                <Button className="w-full" asChild>
                  <Link href={`/customer/invoices/${invoice.id}/pay`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Link>
                </Button>
              )}
              
              {invoice.status === "paid" && (
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you have any questions about this invoice or need assistance with payment, please contact our support team.
              </p>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 