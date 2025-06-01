"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Package,
  Loader2,
  AlertCircle,
  X,
  FileIcon,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { usePreAlert, useRemovePreAlertDocument, useCancelPreAlert } from "@/hooks";
import { formatDate } from "@/lib/utils";
import { DocumentViewer } from "@/components/ui/document-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { usePackages, useMatchPreAlertToPackage } from '@/hooks/usePackages';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import type { Package as PackageType } from '@/lib/api/types';

// DocumentPreview component (same as customer, but no remove for admin for now)
const DocumentPreview = ({
  document,
  index,
  id,
  onView,
}: {
  document: string;
  index: number;
  id: string;
  onView?: (index: number) => void;
}) => {
  const isImage = document.startsWith("data:image");
  const isPdf = document.startsWith("data:application/pdf");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (document.startsWith("data:")) {
      try {
        const [header, base64Data] = document.split(",");
        if (!header || !base64Data) return;
        const mimeType = header.split(":")[1]?.split(";")[0];
        if (!mimeType) return;
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (error) {
        console.error("Error creating blob URL:", error);
      }
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [document]);
  return (
    <div className="group relative flex flex-col items-center overflow-hidden rounded-lg border bg-background p-2">
      <div
        className="relative h-40 w-full overflow-hidden rounded-md cursor-pointer"
        onClick={() => onView && onView(index)}
      >
        {isImage ? (
          <Image
            src={document}
            alt={`Document ${index + 1}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4">
            <FileIcon className="h-10 w-10 text-primary" />
            <p className="mt-2 text-sm text-center">
              {isPdf ? "PDF Document" : "Document File"}
            </p>
          </div>
        )}
      </div>
      <div className="mt-2 w-full flex items-center justify-between">
        <span className="text-sm font-medium">Document {index + 1}</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.preventDefault();
              window.open(blobUrl || document, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Open document</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AdminPreAlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialDocumentIndex, setInitialDocumentIndex] = useState(0);
  const [mountComplete, setMountComplete] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [packageSearch, setPackageSearch] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  useEffect(() => {
    setMountComplete(true);
  }, []);
  const {
    data: preAlert,
    isLoading,
    error,
    refetch,
  } = usePreAlert(id);
  const { data: packagesData, isLoading: packagesLoading } = usePackages({ search: packageSearch });
  const matchMutation = useMatchPreAlertToPackage();
  const handleViewDocument = (index: number) => {
    setInitialDocumentIndex(index);
    setViewerOpen(true);
  };
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500";
      case "matched":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  const formatStatusLabel = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);
  const openMatchModal = () => {
    setShowMatchModal(true);
    setSelectedPackage(null);
    setPackageSearch("");
    setSendNotification(true);
  };
  const closeMatchModal = () => {
    setShowMatchModal(false);
    setSelectedPackage(null);
    setPackageSearch("");
    setSendNotification(true);
  };
  const handleMatch = () => {
    if (!preAlert || !selectedPackage) return;
    matchMutation.mutate(
      {
        packageId: selectedPackage.id,
        preAlertId: preAlert.id,
        sendNotification,
      },
      {
        onSuccess: () => {
          toast({ title: "Matched!", description: "Pre-alert matched to package successfully." });
          closeMatchModal();
          refetch && refetch();
        },
        onError: (err) => {
          toast({ title: "Error", description: err?.message || "Failed to match pre-alert." });
        },
      }
    );
  };
  if (isLoading) {
    return <PreAlertSkeleton key="skeleton" />;
  }
  if (!mountComplete) {
    return <PreAlertSkeleton key="hydration-skeleton" />;
  }
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load pre-alert details. This pre-alert may not exist or you may not have permission to view it.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/admin/pre-alerts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pre-Alerts
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  if (!preAlert) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            The requested pre-alert could not be found. It may have been deleted or you may not have permission to view it.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/admin/pre-alerts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pre-Alerts
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/pre-alerts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pre-Alert Details</h1>
        <Badge className={`ml-2 ${getStatusBadgeColor(preAlert.status)}`}>{formatStatusLabel(preAlert.status)}</Badge>
      </div>
      <div className="grid gap-6 ">
        <div className="md:col-span-2 space-y-6">
          {/* Main Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment Information</CardTitle>
              <CardDescription>Details about this pre-alerted package</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                  <p className="font-medium text-lg">{preAlert.trackingNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Courier</p>
                  <p className="font-medium">{preAlert.courier?.toUpperCase?.()}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p>{preAlert.description || "No description provided"}</p>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estimated Weight</p>
                  <p>{preAlert.weight ? `${preAlert.weight} lbs` : "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estimated Arrival</p>
                  <p>{preAlert.estimatedArrival ? formatDate(preAlert.estimatedArrival) : "Not specified"}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status Information</p>
                <div className="space-y-2">
                  {preAlert.status === "pending" && (
                    <>
                      <p className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-amber-500" />
                        Waiting for package to arrive at our facility, if package is present go ahead and match it.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1.5 hover:bg-green-50 transition-colors border-green-200"
                        onClick={openMatchModal}
                      >
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Match</span>
                      </Button>
                    </>
                  )}
                  {preAlert.status === "matched" && (
                    <p className="flex items-center">
                      <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                      Package has been received and matched with this pre-alert
                    </p>
                  )}
                  {preAlert.status === "cancelled" && (
                    <p className="flex items-center">
                      <X className="mr-1 h-4 w-4 text-red-500" />
                      This pre-alert has been cancelled
                    </p>
                  )}
                </div>
              </div>
              {preAlert.packageId && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Linked Package</p>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/packages/${preAlert.packageId}`}>
                        <Package className="mr-2 h-4 w-4" />
                        View Package Details
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Created on {formatDate(preAlert.createdAt)}
                </p>
              </div>
            </CardFooter>
          </Card>
          {/* Documents Card */}
          <Card>
            <CardHeader>
              <CardTitle>Attached Documents</CardTitle>
              <CardDescription>Invoice, receipt, or other documents attached to this pre-alert</CardDescription>
            </CardHeader>
            <CardContent>
              {!preAlert.documents || preAlert.documents.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">No Documents Attached</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    There are no documents attached to this pre-alert.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {preAlert.documents.map((document, index) => (
                    <DocumentPreview
                      key={index}
                      document={document}
                      index={index}
                      id={preAlert.id}
                      onView={handleViewDocument}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* DocumentViewer */}
      {preAlert?.documents && preAlert.documents.length > 0 && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          documents={preAlert.documents}
          initialIndex={initialDocumentIndex}
          title={`Pre-Alert #${preAlert.trackingNumber} Documents`}
        />
      )}
      {/* Match Modal */}
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Pre-Alert to Package</DialogTitle>
          </DialogHeader>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mb-2 cursor-help text-blue-700 underline text-xs w-fit">
                  How does this work?
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div>
                  <b>How to use:</b><br />
                  1. Search and select the correct package.<br />
                  2. (Optional) Check the box to send a notification to the customer.<br />
                  3. Click <b>Confirm Match</b> to complete the process.<br /><br />
                  <b>Tip:</b> Only unmatched pre-alerts and available packages are shown.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="mb-2">
            <b>Pre-Alert:</b> {preAlert?.trackingNumber} ({preAlert?.courier})
          </div>
          <Input
            placeholder="Search packages..."
            value={packageSearch}
            onChange={e => setPackageSearch(e.target.value)}
            className="mb-2"
          />
          <div className="overflow-x-auto max-h-48 border rounded">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left font-semibold bg-muted uppercase tracking-wide text-xs">Tracking #</th>
                  <th className="px-4 py-2 text-left font-semibold bg-muted uppercase tracking-wide text-xs">User</th>
                  <th className="px-4 py-2 text-left font-semibold bg-muted uppercase tracking-wide text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {packagesLoading ? (
                  <tr><td colSpan={3}>Loading...</td></tr>
                ) : packagesData?.data?.length ? (
                  (packagesData.data as PackageType[]).map((pkg) => (
                    <tr
                      key={pkg.id}
                      className={selectedPackage?.id === pkg.id ? "bg-green-50" : "cursor-pointer"}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <td className="px-4 py-2">{pkg.trackingNumber}</td>
                      <td className="px-4 py-2">{pkg.userId}</td>
                      <td className="px-4 py-2">{pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace(/_/g, ' ')}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3}>No packages found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Checkbox
              checked={sendNotification}
              onCheckedChange={v => setSendNotification(!!v)}
              id="sendNotification"
            />
            <label htmlFor="sendNotification" className="text-sm font-medium">
              Send notification to customer
            </label>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Notification will <b>{sendNotification ? 'be sent' : 'not be sent'}</b> to the customer upon matching.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMatchModal} disabled={matchMutation.isPending}>Cancel</Button>
            <Button onClick={handleMatch} disabled={!selectedPackage || matchMutation.isPending}>
              {matchMutation.isPending ? "Matching..." : "Confirm Match"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreAlertSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/pre-alerts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Shipment Information Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-60" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Skeleton className="h-4 w-48" />
            </CardFooter>
          </Card>
          {/* Documents Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map(i => (
                  <div key={i} className="group relative flex flex-col items-center overflow-hidden rounded-lg border bg-background p-2">
                    <Skeleton className="h-40 w-full rounded-md" />
                    <div className="mt-2 w-full flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 