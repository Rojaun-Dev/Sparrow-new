"use client"

import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"

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

export default function AddPaymentMethodPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/customer/payments?methods=true">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Add Payment Method</h1>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Coming Soon</CardTitle>
          <CardDescription>
            Payment methods management will be available in a future release
          </CardDescription>
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
        <CardFooter className="flex justify-between border-t px-6 pt-4">
          <Button variant="outline" asChild>
            <Link href="/customer/payments?methods=true">Go Back</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 