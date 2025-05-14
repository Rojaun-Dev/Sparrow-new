"use client"

import { useState, use } from "react"
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
import { usePackage, usePackageTimeline } from "@/hooks/usePackages"
import { Skeleton } from "@/components/ui/skeleton"

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const resolvedParams = use(params);
  
  const [activeImage, setActiveImage] = useState(0)
  
  // Fetch package data using the usePackage hook
  const { data: packageData, isLoading, isError, error } = usePackage(resolvedParams.id);
  const { data: timeline } = usePackageTimeline(resolvedParams.id);

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

  // Get status label from status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pre_alert":
        return "Pre-Alert"
      case "received":
        return "Received"
      case "processing":
        return "Processing"
      case "ready_for_pickup":
        return "Ready for Pickup"
      case "in_transit":
        return "In Transit"
      case "delivered":
        return "Delivered"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  }

  if (isLoading) {
    return <PackageDetailsSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h3 className="text-xl font-semibold mb-2">Error Loading Package</h3>
        <p className="text-muted-foreground mb-4">{error?.message || "Failed to load package details"}</p>
        <Button asChild variant="outline">
          <Link href="/customer/packages">Return to Packages</Link>
        </Button>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h3 className="text-xl font-semibold mb-2">Package Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested package could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/customer/packages">Return to Packages</Link>
        </Button>
      </div>
    )
  }

  const packagePhotos = packageData.photos || [];
  const packageTimeline = timeline || [];

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
            {getStatusLabel(packageData.status)}
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
                  {packageData.internalTrackingId && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Internal ID</h3>
                      <p className="text-base">{packageData.internalTrackingId}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="text-base">{packageData.description}</p>
                  </div>
                  {packageData.weight && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Weight</h3>
                      <p className="text-base">{packageData.weight}</p>
                    </div>
                  )}
                  {packageData.dimensions && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Dimensions</h3>
                      <p className="text-base">
                        {packageData.dimensions.length} × {packageData.dimensions.width} × {packageData.dimensions.height}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {packageData.declaredValue && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Declared Value</h3>
                      <p className="text-base">{packageData.declaredValue}</p>
                    </div>
                  )}
                  {packageData.senderInfo && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Sender</h3>
                      <p className="text-base">{packageData.senderInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{packageData.senderInfo.address}</p>
                    </div>
                  )}
                  {packageData.receivedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Received Date</h3>
                      <p className="text-base">{new Date(packageData.receivedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {packageData.estimatedDelivery && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Estimated Delivery</h3>
                      <p className="text-base">{new Date(packageData.estimatedDelivery).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                    <p className="text-base">Customer ID: {packageData.userId}</p>
                    {packageData.companyId && (
                      <p className="text-base">Company ID: {packageData.companyId}</p>
                    )}
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
                {packageTimeline.length > 0 ? (
                  packageTimeline.map((event: any, index: number) => (
                    <div key={index} className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        {index !== packageTimeline.length - 1 && (
                          <div className="mt-1 h-full w-px bg-border" />
                        )}
                      </div>
                      <div className="space-y-1 pt-1.5">
                        <p className="text-sm font-medium">{event.status || "Status Update"}</p>
                        <p className="text-sm text-muted-foreground">{event.description || "Package status updated"}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.timestamp ? new Date(event.timestamp).toLocaleString() : new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center py-8 text-muted-foreground">
                    No tracking information available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Photos</CardTitle>
              <CardDescription>
                {packagePhotos.length} photos available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {packagePhotos.length > 0 ? (
                <div className="space-y-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="overflow-hidden rounded-md border cursor-pointer">
                        <Image
                          src={packagePhotos[activeImage]}
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
                          src={packagePhotos[activeImage]}
                          alt="Package photo"
                          width={800}
                          height={600}
                          className="rounded-md"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex flex-wrap gap-2">
                    {packagePhotos.map((photo, i) => (
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

          {packageData.invoiceId && (
            <Card>
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
                <CardDescription>
                  Associated invoice for this package.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Invoice ID: {packageData.invoiceId}</p>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/customer/invoices/${packageData.invoiceId}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Invoice
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {packageData.trackingUrl && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={packageData.trackingUrl} target="_blank">
                    <Truck className="mr-2 h-4 w-4" />
                    Track with Courier
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              )}
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

// Skeleton loader component
function PackageDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-5 w-48" />
                      {i === 2 && <Skeleton className="h-4 w-64 mt-1" />}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex">
                    <div className="mr-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      {i !== 3 && <Skeleton className="h-16 w-1 mx-auto mt-1" />}
                    </div>
                    <div className="space-y-1 pt-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-32" />
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
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[100px] w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 