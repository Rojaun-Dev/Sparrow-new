"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, CreditCard, Info, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PayInvoicePage({ params }: { params: { id: string } }) {
  const [selectedMethod, setSelectedMethod] = useState("card-001")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [showSuccess, setShowSuccess] = useState(false)

  // Example invoice data - would be fetched from API in a real app
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
    packages: ["SP-1234"],
    items: [
      { description: "Shipping Fee", amount: "$90.00" },
      { description: "Handling Fee", amount: "$30.00" },
      { description: "Tax", amount: "$5.30" },
    ],
  }

  // Example saved payment methods
  const paymentMethods = [
    {
      id: "card-001",
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2024,
      isDefault: true,
    },
    {
      id: "card-002",
      type: "card",
      brand: "Mastercard",
      last4: "5555",
      expiryMonth: 10,
      expiryYear: 2025,
      isDefault: false,
    },
    {
      id: "paypal-001",
      type: "paypal",
      email: "john.doe@example.com",
      isDefault: false,
    },
  ]

  const handlePayment = () => {
    setPaymentStatus("processing")
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus("success")
      setShowSuccess(true)
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/customer/invoices/${invoice.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pay Invoice</h1>
        <Badge>{invoice.invoiceNumber}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>
                Choose how you would like to pay this invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value={method.id} id={method.id} />
                      {method.type === "card" && (
                        <>
                          {method.brand === "Visa" ? (
                            <div className="flex h-9 w-14 items-center justify-center rounded-md border bg-[#1434CB]">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-8">
                                <path fill="#fff" d="M32 23.6c0 4.5-3.7 8.2-8.2 8.2H2v-16h21.8c4.5 0 8.2 3.7 8.2 8.2v-.4z"/>
                                <path fill="#fff" d="m46 23.6-1.4-3.2-1.4 3.2-3.2-1.3 1.9 2.9H41l-3.3-1.4 1.3 3.2-3.2 1.4 3.2 1.3-1.3 3.3L41 32l.9 2.1-1.9 2.9 3.2-1.3 1.4 3.2 1.4-3.2 3.2 1.3-1.9-2.9 3.3-1.4-3.3-1.3 1.3-3.3-3.2 1.4.9-2.1-1.9-2.9 3.2 1.3z"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="flex h-9 w-14 items-center justify-center rounded-md border bg-[#EB001B]">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-8">
                                <path fill="#FF5F00" d="M16.6 19.1h14.8v9.8H16.6z"/>
                                <path d="M17.3 24a6.2 6.2 0 0 1 2.4-4.9 6.2 6.2 0 1 0 0 9.8 6.2 6.2 0 0 1-2.4-4.9Z" fill="#EB001B"/>
                                <path d="M35.6 24a6.2 6.2 0 0 1-10 4.9 6.2 6.2 0 0 0 0-9.8 6.2 6.2 0 0 1 10 4.9Z" fill="#F79E1B"/>
                              </svg>
                            </div>
                          )}
                          <div>
                            <Label htmlFor={method.id} className="font-medium">
                              {method.brand} •••• {method.last4}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                        </>
                      )}
                      {method.type === "paypal" && (
                        <>
                          <div className="flex h-9 w-14 items-center justify-center rounded-md border bg-[#003087]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-8 text-white" fill="currentColor">
                              <path d="M7.076 21.337H2.47a.97.97 0 0 1-.977-.977V3.651a.97.97 0 0 1 .977-.977h4.606a.97.97 0 0 1 .976.977v16.71a.97.97 0 0 1-.976.977"/><path d="M22.46 12.237c0 4.77-4.85 9.198-10.875 9.198V3.039c6.024 0 10.875 4.428 10.875 9.198"/>
                            </svg>
                          </div>
                          <div>
                            <Label htmlFor={method.id} className="font-medium">
                              PayPal
                            </Label>
                            <p className="text-sm text-muted-foreground">{method.email}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" disabled>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Add New Payment Method
                          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adding payment methods will be available in a future release</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </RadioGroup>
              
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Your payment will be processed securely. You will receive an email confirmation once your payment is complete.
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 pt-4">
              <Button variant="outline" asChild>
                <Link href={`/customer/invoices/${invoice.id}`}>Cancel</Link>
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={paymentStatus === "processing"}
                className="min-w-[140px]"
              >
                {paymentStatus === "processing" ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Pay {invoice.total}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
              <CardDescription>
                {invoice.invoiceNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-medium">Status</div>
                  <Badge variant="destructive">
                    {invoice.statusLabel}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <div>Issue Date</div>
                    <div>{invoice.issueDate}</div>
                  </div>
                  <div className="flex justify-between">
                    <div>Due Date</div>
                    <div className="font-medium text-red-600">{invoice.dueDate}</div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="mb-2 text-sm font-medium">Invoice Items</h3>
                <div className="space-y-2">
                  {invoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span>{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total Due</span>
                <span className="text-lg">{invoice.total}</span>
              </div>
              
              <div className="rounded-md bg-amber-50 p-3 text-amber-800 border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4" />
                  <div className="text-xs">
                    Payment due by <span className="font-medium">{invoice.dueDate}</span>. Late payments may incur additional fees.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Payment Successful!</AlertDialogTitle>
            <AlertDialogDescription>
              Your payment of {invoice.total} has been processed successfully. A receipt has been sent to your email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Link href="/customer/invoices">
                View Invoices
              </Link>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Link href="/customer/payments">
                Payment History
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 