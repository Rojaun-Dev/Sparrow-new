"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronDown, CreditCard, Lock, Trash } from "lucide-react"

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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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
import { Separator } from "@/components/ui/separator"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

export default function PaymentMethodsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/customer/payments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Payment Methods</h1>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:justify-between">
        <Card className="md:w-3/4">
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

        <Card className="md:w-1/4">
          <CardHeader>
            <CardTitle>About Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Securely save your payment methods for faster checkout. Your default payment method will be automatically selected when making a payment.
            </p>
            
            <Separator />
            
            <div className="flex items-center gap-2 rounded-md bg-muted p-4">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Your payment information is encrypted and securely stored. We never store your full card details on our servers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 