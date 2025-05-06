"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowLeft,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Map,
  MessageSquare,
  Package,
  Printer,
  Truck
} from "lucide-react"

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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function PackageDetailPage({ params }: { params: { id: string } }) {
  const [activeImage, setActiveImage] = useState(0)

  // Example package data - would be fetched from API in a real app
  const packageData = {
    id: params.id,
    trackingNumber: "SP-1234",
    internalTrackingId: "INT-1234",
    description: "Nike Shoes - Air Max 270",
    status: "processing",
    statusLabel: "Processing",
    weight: "2.5 lbs",
    dimensions: {
      length: "12 in",
      width: "8 in",
      height: "6 in",
    },
    declaredValue: "$120.00",
    senderInfo: {
      name: "Nike Store",
      address: "123 Retailer St, Portland, OR"
    },
    receivedDate: "May 20, 2023",
    processingDate: "May 21, 2023",
    estimatedDelivery: "May 25, 2023",
    photos: [
      "/placeholder.svg?key=photo1",
      "/placeholder.svg?key=photo2",
      "/placeholder.svg?key=photo3",
    ],
    notes: "Handle with care. Box slightly damaged during shipping but contents intact.",
    timeline: [
      {
        date: "May 21, 2023 - 10:30 AM",
        status: "Processing",
        description: "Package is being processed at our warehouse.",
        icon: Package,
      },
      {
        date: "May 20, 2023 - 2:15 PM",
        status: "Received",
        description: "Package has been received at our warehouse.",
        icon: Package,
      },
      {
        date: "May 18, 2023 - 9:45 AM",
        status: "Pre-Alert Created",
        description: "Pre-alert was created for this package.",
        icon: FileText,
      },
    ],
    invoice: {
      id: "INV-202",
      amount: "$45.30",
      status: "Unpaid",
      dueDate: "May 25, 2023",
      items: [
        { description: "Shipping Fee", amount: "$35.00" },
        { description: "Handling Fee", amount: "$5.00" },
        { description: "Tax", amount: "$5.30" },
      ],
    },
  }

  // Get status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pre_alert":
        return "bg-gray-500"
      case "received":
        return "bg-blue-500"
      case "processing":
        return "bg-amber-500"
      case "ready_for_pickup":
        return "bg-green-500"
      case "in_transit":
        return "bg-blue-600"
      case "delivered":
        return "bg-green-700"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/customer/packages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Package Details</h1>
          <Badge className={getStatusBadgeColor(packageData.status)}>
            {packageData.statusLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Support
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Package Information</CardTitle>
              <CardDescription>
                Details about your package and its current status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tracking Number</h3>
                    <p className="text-base font-medium">{packageData.trackingNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Internal ID</h3>
                    <p className="text-base">{packageData.internalTrackingId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="text-base">{packageData.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Weight</h3>
                    <p className="text-base">{packageData.weight}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Dimensions</h3>
                    <p className="text-base">
                      {packageData.dimensions.length} × {packageData.dimensions.width} × {packageData.dimensions.height}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Declared Value</h3>
                    <p className="text-base">{packageData.declaredValue}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sender</h3>
                    <p className="text-base">{packageData.senderInfo.name}</p>
                    <p className="text-sm text-muted-foreground">{packageData.senderInfo.address}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Received Date</h3>
                    <p className="text-base">{packageData.receivedDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Estimated Delivery</h3>
                    <p className="text-base">{packageData.estimatedDelivery}</p>
                  </div>
                </div>
              </div>

              {packageData.notes && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                    <div className="rounded-md bg-muted p-4 text-sm">
                      {packageData.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tracking Timeline</CardTitle>
              <CardDescription>
                Follow the journey of your package.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {packageData.timeline.map((event, index) => (
                  <div key={index} className="flex">
                    <div className="mr-4 flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <event.icon className="h-5 w-5 text-primary" />
                      </div>
                      {index !== packageData.timeline.length - 1 && (
                        <div className="mt-1 h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="space-y-1 pt-1.5">
                      <p className="text-sm font-medium">{event.status}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Photos</CardTitle>
              <CardDescription>
                {packageData.photos.length} photos available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {packageData.photos.length > 0 ? (
                <div className="space-y-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="overflow-hidden rounded-md border cursor-pointer">
                        <Image
                          src={packageData.photos[activeImage]}
                          alt="Package photo"
                          width={400}
                          height={300}
                          className="aspect-video object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Package Photos</DialogTitle>
                        <DialogDescription>
                          Photos of your package taken at our warehouse.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <Image
                          src={packageData.photos[activeImage]}
                          alt="Package photo"
                          width={800}
                          height={600}
                          className="rounded-md"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex flex-wrap gap-2">
                    {packageData.photos.map((photo, i) => (
                      <div
                        key={i}
                        className={`relative h-16 w-16 cursor-pointer overflow-hidden rounded-md border transition-colors ${
                          activeImage === i ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setActiveImage(i)}
                      >
                        <Image
                          src={photo}
                          alt={`Photo ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No photos available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Associated invoice for this package.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {packageData.invoice ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{packageData.invoice.id}</p>
                      <p className="text-sm text-muted-foreground">Due: {packageData.invoice.dueDate}</p>
                    </div>
                    <Badge variant={packageData.invoice.status === "Paid" ? "outline" : "destructive"}>
                      {packageData.invoice.status}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {packageData.invoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span>{item.amount}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{packageData.invoice.amount}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No invoice available</p>
                </div>
              )}
            </CardContent>
            {packageData.invoice && packageData.invoice.status !== "Paid" && (
              <CardFooter className="border-t px-6 pt-4">
                <Button className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              </CardFooter>
            )}
            {packageData.invoice && packageData.invoice.status === "Paid" && (
              <CardFooter className="border-t px-6 pt-4">
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Truck className="mr-2 h-4 w-4" />
                Track with Courier
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Map className="mr-2 h-4 w-4" />
                Pickup Locations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 