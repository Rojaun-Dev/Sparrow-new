import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileIcon, ImageIcon, PlusCircle, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from './button';
import { Progress } from './progress';
import { AlertCircle as AlertCircleIcon } from 'lucide-react';

export type FileWithPreview = File & {
  preview: string;
  id: string;
};

export interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  value?: File[];
  className?: string;
  disabled?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string;
  showPreview?: boolean;
  variant?: 'default' | 'compact';
  previewHeight?: number;
  previewWidth?: number;
  label?: string;
  description?: string;
}

export function FileUpload({
  onFilesChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'application/pdf': ['.pdf'],
  },
  value = [],
  className,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  error,
  showPreview = true,
  variant = 'default',
  previewHeight = 100,
  previewWidth = 100,
  label = 'Upload files',
  description = 'Drag and drop files here or click to browse'
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [rejected, setRejected] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle accepted files
      if (acceptedFiles?.length) {
        const newFiles = acceptedFiles.map(file =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
            id: crypto.randomUUID()
          })
        );

        if (files.length + newFiles.length > maxFiles) {
          setRejected(prev => [
            ...prev,
            ...acceptedFiles.slice(maxFiles - files.length)
          ]);
          setFiles(prev => [
            ...prev,
            ...newFiles.slice(0, maxFiles - files.length)
          ]);
          onFilesChange([
            ...files.slice(0, maxFiles - newFiles.length),
            ...acceptedFiles.slice(0, maxFiles - files.length),
          ]);
        } else {
          setFiles(prev => [...prev, ...newFiles]);
          onFilesChange([...value, ...acceptedFiles]);
        }
      }

      // Handle rejected files
      if (rejectedFiles?.length) {
        setRejected(prev => [...prev, ...rejectedFiles.map(r => r.file)]);
      }
    },
    [files, maxFiles, onFilesChange, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    maxFiles,
    accept,
    disabled: disabled || uploading || files.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
      const updatedFiles = files.filter(f => f.id !== id);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  };

  const removeRejected = (name: string) => {
    setRejected(rejected.filter(f => f.name !== name));
  };

  // Cleanup previews when component unmounts
  React.useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const isCompact = variant === 'compact';

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          isDragActive
            ? "border-primary/50 bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 cursor-pointer",
          disabled && "cursor-not-allowed opacity-60",
          uploading && "cursor-not-allowed",
          error && "border-destructive/50 bg-destructive/5",
          isCompact ? "p-2" : "p-8"
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading files...</p>
            {uploadProgress > 0 && (
              <Progress value={uploadProgress} className="h-1 w-40" />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-center">
            <PlusCircle
              className={cn(
                "text-muted-foreground",
                isCompact ? "h-4 w-4" : "h-6 w-6"
              )}
            />
            <div className={cn(isCompact ? "space-y-0" : "space-y-1")}>
              <p className={cn("font-medium", isCompact ? "text-xs" : "text-sm")}>
                {label}
              </p>
              <p className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
                {description}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-destructive text-sm">
          <AlertCircleIcon className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {/* Preview section */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attached files ({files.length})</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative flex flex-col items-center overflow-hidden rounded-lg border bg-background p-2"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-md">
                  {file.type.startsWith('image/') ? (
                    <Image
                      src={file.preview}
                      alt={file.name}
                      width={previewWidth}
                      height={previewHeight}
                      className="h-full w-full object-cover transition-all"
                      onLoad={() => {
                        URL.revokeObjectURL(file.preview);
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <FileIcon className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>
                <div className="mt-1 w-full truncate text-center text-xs text-muted-foreground">
                  {file.name}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  disabled={uploading}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected files */}
      {rejected.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">Rejected files</p>
          <div className="space-y-2">
            {rejected.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="truncate">{file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeRejected(file.name)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 