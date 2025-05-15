'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Loader2, AlertCircle } from 'lucide-react';

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
import { useToast } from '@/components/ui/use-toast';
import { FileUpload } from '@/components/ui/file-upload';
import { usePreAlert, useUploadPreAlertDocuments } from '@/hooks';

export default function EditPreAlertPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [documents, setDocuments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { 
    data: preAlert, 
    isLoading, 
    error
  } = usePreAlert(id);
  
  const uploadDocuments = useUploadPreAlertDocuments();
  
  const handleDocumentsUpload = async () => {
    if (!documents.length) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (preAlert?.status !== 'pending') {
      toast({
        title: "Cannot modify",
        description: "You can only add documents to pending pre-alerts.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      await uploadDocuments.mutateAsync({ id, files: documents });
      
      toast({
        title: "Documents uploaded",
        description: "Your documents have been successfully uploaded.",
      });
      
      router.push(`/customer/prealerts/${id}`);
    } catch (error) {
      console.error('Failed to upload documents:', error);
      
      toast({
        title: "Error",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading pre-alert details...</p>
      </div>
    );
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
  
  if (preAlert.status !== 'pending') {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Modify</AlertTitle>
          <AlertDescription>
            This pre-alert cannot be modified because it is no longer pending. Only pending pre-alerts can be updated.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href={`/customer/prealerts/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pre-Alert Details
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
          <Link href={`/customer/prealerts/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Upload Documents</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Documents</CardTitle>
              <CardDescription>
                Upload invoices, receipts, or other documents for pre-alert #{preAlert.trackingNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <FileUpload 
                    onFilesChange={setDocuments}
                    value={documents}
                    maxFiles={5}
                    disabled={isUploading}
                    uploading={isUploading}
                    label="Upload documents"
                    description="Drag & drop or click to upload (PDF, JPG, PNG)"
                  />
                </div>
                
                {preAlert.documents && preAlert.documents.length > 0 && (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Existing Documents</AlertTitle>
                    <AlertDescription>
                      This pre-alert already has {preAlert.documents.length} document(s) attached. 
                      The new documents will be added to the existing ones.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                asChild
              >
                <Link href={`/customer/prealerts/${id}`}>
                  Cancel
                </Link>
              </Button>
              <Button 
                onClick={handleDocumentsUpload}
                disabled={isUploading || documents.length === 0}
              >
                {isUploading ? 'Uploading...' : 'Upload Documents'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upload Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Supported File Types</h3>
                <p className="text-sm text-muted-foreground">
                  PDF, JPG, and PNG files are supported. For best results, upload clear, legible documents.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">File Size Limit</h3>
                <p className="text-sm text-muted-foreground">
                  Each file must be less than 10MB in size.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Recommended Documents</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Purchase invoice or receipt</li>
                  <li>Packing slip</li>
                  <li>Product information</li>
                  <li>Customs declaration</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 