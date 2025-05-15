'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  Package, 
  Truck, 
  Loader2,
  AlertCircle,
  X,
  FileIcon,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  usePreAlert, 
  useRemovePreAlertDocument, 
  useCancelPreAlert 
} from '@/hooks';
import { formatDate } from '@/lib/utils';
import { DocumentViewer } from '@/components/ui/document-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

// Move DocumentPreview to its own client component
const DocumentPreview = ({ 
  document, 
  index, 
  id,
  isRemovable = false,
  onRemove,
  onView
}: { 
  document: string, 
  index: number, 
  id: string,
  isRemovable?: boolean,
  onRemove?: (index: number) => void,
  onView?: (index: number) => void
}) => {
  const isImage = document.startsWith('data:image');
  const isPdf = document.startsWith('data:application/pdf');
  
  // Create a blob URL for the document to ensure it opens properly
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Only create blob URL for data URLs
    if (document.startsWith('data:')) {
      try {
        // Parse the base64 data
        const [header, base64Data] = document.split(',');
        if (!header || !base64Data) return;
        
        const mimeType = header.split(':')[1]?.split(';')[0];
        if (!mimeType) return;
        
        // Convert base64 to binary
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        
        // Create blob and URL
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (error) {
        console.error('Error creating blob URL:', error);
      }
    }
    
    // Cleanup function
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
              {isPdf ? 'PDF Document' : 'Document File'}
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
            onClick={(e) => {
              e.preventDefault();
              window.open(blobUrl || document, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Open document</span>
          </Button>
          {isRemovable && onRemove && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove document</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PreAlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  // Client-side state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialDocumentIndex, setInitialDocumentIndex] = useState(0);
  const [mountComplete, setMountComplete] = useState(false);
  
  // Mark component as mounted to avoid hydration issues
  useEffect(() => {
    setMountComplete(true);
  }, []);
  
  const { 
    data: preAlert, 
    isLoading, 
    error,
    refetch 
  } = usePreAlert(id);
  
  const removeDocument = useRemovePreAlertDocument();
  const cancelPreAlert = useCancelPreAlert();
  
  const handleRemoveDocument = async (index: number) => {
    try {
      await removeDocument.mutateAsync({ id, documentIndex: index });
      toast({
        title: "Document removed",
        description: "The document has been removed successfully.",
      });
    } catch (error) {
      console.error('Failed to remove document:', error);
      toast({
        title: "Error",
        description: "Failed to remove document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDocument = (index: number) => {
    setInitialDocumentIndex(index);
    setViewerOpen(true);
  };
  
  const handleCancelPreAlert = async () => {
    try {
      await cancelPreAlert.mutateAsync(id);
      toast({
        title: "Pre-alert cancelled",
        description: "Your pre-alert has been cancelled successfully.",
      });
      router.push('/customer/prealerts');
    } catch (error) {
      console.error('Failed to cancel pre-alert:', error);
      toast({
        title: "Error",
        description: "Failed to cancel pre-alert. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500';
      case 'matched':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Use key for loading skeleton to ensure it's properly differentiated from the actual content
  if (isLoading) {
    return <PreAlertSkeleton key="skeleton" />;
  }
  
  // Only render content after hydration is complete
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
            <Link href="/customer/prealerts">
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
            <Link href="/customer/prealerts">
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
          <Link href="/customer/prealerts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pre-Alert Details</h1>
        <Badge className={`ml-2 ${getStatusBadgeColor(preAlert.status)}`}>
          {formatStatusLabel(preAlert.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment Information</CardTitle>
              <CardDescription>
                Details about your pre-alerted package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                  <p className="font-medium text-lg">{preAlert.trackingNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Courier</p>
                  <p className="font-medium">{preAlert.courier.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p>{preAlert.description || 'No description provided'}</p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estimated Weight</p>
                  <p>{preAlert.weight ? `${preAlert.weight} lbs` : 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estimated Arrival</p>
                  <p>{preAlert.estimatedArrival ? formatDate(preAlert.estimatedArrival) : 'Not specified'}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status Information</p>
                <div className="flex items-center gap-2">
                  {preAlert.status === 'pending' && (
                    <p className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-amber-500" />
                      Waiting for package to arrive at our facility
                    </p>
                  )}
                  {preAlert.status === 'matched' && (
                    <p className="flex items-center">
                      <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                      Package has been received and matched with this pre-alert
                    </p>
                  )}
                  {preAlert.status === 'cancelled' && (
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
                      <Link href={`/customer/packages/${preAlert.packageId}`}>
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
                {preAlert.status === 'pending' && (
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelPreAlert}
                    disabled={cancelPreAlert.isPending}
                  >
                    {cancelPreAlert.isPending ? 'Cancelling...' : 'Cancel Pre-Alert'}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>

          {/* Documents Card */}
          <Card>
            <CardHeader>
              <CardTitle>Attached Documents</CardTitle>
              <CardDescription>
                Invoice, receipt, or other documents attached to this pre-alert
              </CardDescription>
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
                      isRemovable={preAlert.status === 'pending'}
                      onRemove={handleRemoveDocument}
                      onView={handleViewDocument}
                    />
                  ))}
                </div>
              )}
            </CardContent>
            {preAlert.status === 'pending' && (
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/customer/prealerts/edit/${preAlert.id}`}>
                    Upload Additional Documents
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Wait for package arrival</p>
                    <p className="text-sm text-muted-foreground">
                      Your package is on its way to our facility
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Package processing</p>
                    <p className="text-sm text-muted-foreground">
                      Once received, we'll match it with your pre-alert
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Ready for pickup/delivery</p>
                    <p className="text-sm text-muted-foreground">
                      You'll be notified when your package is ready
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you have questions about your pre-alert or want to update any information, our customer service team is ready to help.
              </p>
              <Button className="w-full" asChild variant="outline">
                <Link href="/customer/help">
                  Contact Support
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add DocumentViewer */}
      {preAlert?.documents && preAlert.documents.length > 0 && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          documents={preAlert.documents}
          initialIndex={initialDocumentIndex}
          title={`Pre-Alert #${preAlert.trackingNumber} Documents`}
        />
      )}
    </div>
  );
}

// Separate skeleton component to avoid hydration issues
function PreAlertSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/customer/prealerts">
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
                {[1, 2].map((i) => (
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
                {[1, 2, 3].map((i) => (
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