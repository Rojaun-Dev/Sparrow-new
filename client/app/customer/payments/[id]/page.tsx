"use client"

import Link from "next/link"
import { ArrowLeft, Download, ExternalLink, FileText, Printer } from "lucide-react"

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

export default function PaymentDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, this would be fetched from an API
  const payment = {
    id: params.id,
    invoiceNumber: "INV-203",
    paymentMethod: "Credit Card",
    paymentMethodDetails: "**** **** **** 4242",
    amount: "$85.50",
    status: "completed",
    statusLabel: "Completed",
    date: "May 29, 2023",
    time: "2:34 PM",
    transactionId: "txn_1NjTxLKj8JNkCvBl7QTrFxBp",
    receiptNumber: "RCP-0012345",
    items: [
      { description: "Shipping Fee", amount: "$70.00" },
      { description: "Handling Fee", amount: "$10.00" },
      { description: "Tax", amount: "$5.50" },
    ],
    billingAddress: {
      name: "John Doe",
      line1: "123 Main St",
      city: "Kingston",
      state: "Jamaica",
      postalCode: "00001",
      country: "Jamaica"
    }
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/customer/payments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Payment Receipt</h1>
            <p className="text-sm text-muted-foreground">
              {payment.receiptNumber}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Transaction completed on {payment.date}
            </CardDescription>
          </div>
          <Badge className={getStatusBadgeColor(payment.status)}>
            {payment.statusLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Date</h3>
                <p className="text-base">{payment.date} at {payment.time}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                <p className="text-base">{payment.paymentMethod}</p>
                <p className="text-sm text-muted-foreground">{payment.paymentMethodDetails}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Transaction ID</h3>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-mono">{payment.transactionId}</p>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Billing Address</h3>
                <div className="text-sm">
                  <p>{payment.billingAddress.name}</p>
                  <p>{payment.billingAddress.line1}</p>
                  <p>
                    {payment.billingAddress.city}, {payment.billingAddress.state} {payment.billingAddress.postalCode}
                  </p>
                  <p>{payment.billingAddress.country}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                <Link href={`/customer/invoices/${payment.invoiceNumber}`} className="text-base text-primary hover:underline">
                  {payment.invoiceNumber}
                </Link>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="mb-4 text-base font-medium">Payment Summary</h3>
            <div className="rounded-md border">
              <div className="p-4">
                <div className="space-y-2">
                  {payment.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span>{item.amount}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-base font-medium">
                  <span>Total</span>
                  <span>{payment.amount}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>If you have any questions about this payment, please contact our support team.</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t px-6 pt-4">
          <Button variant="outline" asChild>
            <Link href="/customer/payments">Return to Payment History</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 