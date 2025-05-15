'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Loader2,
  FileIcon,
  ExternalLink,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';

export interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: string[];
  initialIndex?: number;
  title?: string;
}

export function DocumentViewer({
  isOpen,
  onClose,
  documents,
  initialIndex = 0,
  title = 'Document Viewer'
}: DocumentViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Reset to initial index when the document list changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < documents.length) {
      setCurrentIndex(initialIndex);
    }
  }, [documents, initialIndex]);

  // Clean up blob URLs when component unmounts or document changes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Generate blob URL for current document
  useEffect(() => {
    if (!documents || documents.length === 0) return;
    
    const currentDoc = documents[currentIndex];
    if (!currentDoc) return;
    
    setLoading(true);
    
    try {
      // Clean up previous blob URL
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      
      // If it's a base64 data URL, convert to blob
      if (currentDoc.startsWith('data:')) {
        // Parse the base64 data
        const [header, base64Data] = currentDoc.split(',');
        if (!header || !base64Data) {
          console.error('Invalid data URL format');
          setLoading(false);
          return;
        }
        
        const mimeType = header.split(':')[1]?.split(';')[0];
        if (!mimeType) {
          console.error('Could not determine MIME type');
          setLoading(false);
          return;
        }
        
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
        // Allow some time for the blob to be ready
        setTimeout(() => setLoading(false), 500);
      } else {
        // Not a data URL, so we can stop loading
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating blob URL:', error);
      setLoading(false);
    }
  }, [documents, currentIndex]);

  if (!documents || documents.length === 0) {
    return null;
  }

  const currentDocument = documents[currentIndex];
  const isImage = currentDocument?.startsWith('data:image');
  const isPdf = currentDocument?.startsWith('data:application/pdf') || 
                (currentDocument?.toLowerCase().endsWith('.pdf')) || 
                (currentDocument?.includes('application/pdf'));
  const totalDocuments = documents.length;
  
  const documentUrl = blobUrl || currentDocument;

  const handleNext = () => {
    setZoom(1);
    setRotation(0);
    setLoading(true);
    setCurrentIndex((prev) => (prev + 1) % totalDocuments);
  };

  const handlePrevious = () => {
    setZoom(1);
    setRotation(0);
    setLoading(true);
    setCurrentIndex((prev) => (prev - 1 + totalDocuments) % totalDocuments);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!currentDocument) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = `document-${currentIndex + 1}.${isPdf ? 'pdf' : isImage ? 'jpg' : 'file'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  // For PDF documents, create a direct link to open in a new tab
  const openInNewTab = () => {
    if (!documentUrl) return;
    // Use the blob URL for better browser compatibility
    window.open(documentUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col p-0" 
        hideCloseButton={true}
      >
        <DialogHeader className="flex flex-row items-center justify-between p-4">
          <DialogTitle>{title} ({currentIndex + 1}/{totalDocuments})</DialogTitle>
          <div className="flex items-center gap-2">
            {isPdf && (
              <Button variant="outline" size="icon" onClick={openInNewTab} title="Open in new tab">
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Open in new tab</span>
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative overflow-hidden flex-grow bg-muted rounded-md flex">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          
          {isImage ? (
            <div 
              className="relative w-full h-full flex items-center justify-center"
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)`, 
                transition: 'transform 0.3s ease' 
              }}
            >
              {documentUrl && (
                <Image
                  src={documentUrl}
                  alt={`Document ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  onLoadingComplete={handleImageLoad}
                  onError={() => setLoading(false)}
                  unoptimized // Don't optimize base64 images
                />
              )}
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex-1 flex items-center justify-center overflow-hidden">
              {documentUrl && (
                <iframe 
                  ref={iframeRef}
                  src={documentUrl}
                  className="w-full h-full" 
                  onLoad={() => setLoading(false)}
                  style={{ 
                    width: '100%',
                    height: '100%',
                    maxHeight: '100%',
                    border: 'none',
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.3s ease'
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <FileIcon className="h-20 w-20 text-primary" />
              <p className="mt-4 text-lg font-medium">Unsupported Document Format</p>
              <p className="text-sm text-muted-foreground">
                This document cannot be previewed. Try downloading it instead.
              </p>
              <Button variant="outline" className="mt-4" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download File
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePrevious}
              disabled={totalDocuments <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous document</span>
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNext}
              disabled={totalDocuments <= 1}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next document</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                  <span className="sr-only">Zoom out</span>
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                  <span className="sr-only">Zoom in</span>
                </Button>
                <Button variant="outline" size="icon" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                  <span className="sr-only">Rotate</span>
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 