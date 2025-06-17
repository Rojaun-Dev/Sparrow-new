import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface ImportStatusResult {
  successCount: number;
  failedCount?: number;
  skippedCount?: number;
  totalRecords?: number;
}

export interface ImportStatusProps {
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'none' | 'unknown';
  progress?: number;
  error?: string;
  result?: ImportStatusResult;
  onComplete?: () => void;
}

export function ImportStatusAlert({ status, progress, error, result, onComplete }: ImportStatusProps) {
  const { toast } = useToast();
  
  // Effect to show toast when result becomes available
  useEffect(() => {
    if (status === 'completed' && result) {
      // Create a more detailed success message including added and skipped packages
      const addedCount = result.successCount || 0;
      const skippedCount = result.skippedCount || 0;
      
      let successMessage = `Import complete: ${addedCount} packages imported`;
      if (skippedCount > 0) {
        successMessage += `, ${skippedCount} packages skipped (already exist)`;
      }
      
      // Show success toast when result data is available
      toast({
        title: 'Import Complete',
        description: successMessage,
        variant: 'default',
        duration: 5000,
      });
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } else if (status === 'failed' && error) {
      // Show error toast when error is available
      toast({
        title: 'Import Failed',
        description: error,
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [status, result, error, onComplete, toast]);
  
  return (
    <Alert className={`mb-6 ${
      status === 'failed' ? 'bg-red-50 border-red-200' : 
      status === 'completed' ? 'bg-green-50 border-green-200' : 
      'bg-blue-50 border-blue-200'
    }`}>
      {status === 'failed' ? (
        <AlertCircle className="h-4 w-4 text-red-500" />
      ) : status === 'completed' ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      )}
      <AlertTitle>
        {status === 'failed' ? 'Auto Import Failed' : 
         status === 'completed' ? 'Auto Import Completed' : 
         'Auto Import In Progress'}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        {status === 'in_progress' && (
          <>
            <div>Processing data from Magaya. This may take a few minutes.</div>
            {progress !== undefined && (
              <div className="mt-2">
                <div className="text-sm font-medium">
                  {progress}% Complete
                </div>
                <div className="h-2 w-full bg-blue-100 rounded-full mt-1">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </>
        )}
        {status === 'failed' && error && (
          <div className="text-red-700">{error}</div>
        )}
        {status === 'completed' && (
          <div>
            Import completed successfully.
            {result && (
              <>
                Added {result.successCount || 0} packages
                {(result.skippedCount || 0) > 0 && 
                  `, skipped ${result.skippedCount} packages (already exist)`}. 
              </>
            )}
            Redirecting to packages page...
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
} 