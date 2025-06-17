"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useImport } from "@/hooks/useImport";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@/hooks/useAuth";
import { importPackagesSchema, ImportPackagesFormValues } from "@/lib/validations/import";
import { apiClient } from "@/lib/api/apiClient";

export default function ImportPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);
  const { company } = useCompanySettings();
  
  const [magayaSettings, setMagayaSettings] = useState<{
    enabled: boolean;
    username?: string;
    password?: string;
    dateRangePreference?: string;
    autoImportEnabled?: boolean;
    networkId?: string;
  }>({ enabled: false });
  
  // Fetch Magaya integration settings on component mount
  useEffect(() => {
    const fetchMagayaSettings = async () => {
      try {
        const response = await apiClient.get<{
          magayaIntegration?: {
            enabled?: boolean;
            username?: string;
            password?: string;
            dateRangePreference?: string;
            autoImportEnabled?: boolean;
            networkId?: string;
          }
        }>('/company-settings/integration');
        
        setMagayaSettings({
          enabled: !!response?.magayaIntegration?.enabled,
          username: response?.magayaIntegration?.username,
          password: response?.magayaIntegration?.password,
          dateRangePreference: response?.magayaIntegration?.dateRangePreference,
          autoImportEnabled: response?.magayaIntegration?.autoImportEnabled,
          networkId: response?.magayaIntegration?.networkId
        });
      } catch (error) {
        console.error("Failed to fetch Magaya integration settings:", error);
      }
    };
    
    fetchMagayaSettings();
  }, []);
  
  const { data: usersResponse, isLoading: loadingUsers } = useCompanyUsers(user?.companyId || '', {
    role: 'customer',
    isActive: true
  });
  
  const {
    isParsing,
    isLoading: importing,
    parseCSVFile,
    importPackages,
    importResult,
  } = useImport({
    onSuccess: () => {
      setImportComplete(true);
      form.reset();
      setSelectedFile(null);
      setParsedData([]);
      setShowPreview(false);
    },
  });

  const form = useForm<ImportPackagesFormValues>({
    resolver: zodResolver(importPackagesSchema),
    defaultValues: {
      userId: undefined,
      file: undefined,
    },
  });

  const handleFileSelect = async (files: File[]) => {
    if (!files.length) return;
    
    const file = files[0];
    setSelectedFile(file);
    form.setValue("file", file, { shouldValidate: true });
    
    try {
      const parsed = await parseCSVFile(file);
      setParsedData(parsed);
      setShowPreview(true);
      setImportComplete(false);
    } catch (error) {
      console.error("Failed to parse CSV file:", error);
    }
  };

  const onSubmit = async (data: ImportPackagesFormValues) => {
    if (!data.file) return;

    const userId = !data.userId || data.userId === "__unassigned" ? undefined : data.userId;

    try {
      await importPackages(userId, data.file);
    } catch (error) {
      console.error("Failed to import packages:", error);
    }
  };
  
  const handleAutoImport = async () => {
    const userId = form.getValues().userId;
    const targetUserId = !userId || userId === "__unassigned" ? undefined : userId;
    
    // Check if Network ID is configured
    if (!magayaSettings.networkId) {
      toast.error('Network ID is required for Magaya auto-import. Please configure it in Settings.');
      return;
    }
    
    try {
      setIsAutoImporting(true);
      const companyId = user?.companyId;
      const response = await apiClient.post(`/companies/${companyId}/auto-import/magaya`, {
        userId: targetUserId,
        dateRange: magayaSettings.dateRangePreference || 'this_week'
      });
      
      toast.success('Auto import process started');
      
      // Poll for status updates
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes (2s intervals)
      
      const pollStatus = setInterval(async () => {
        attempts++;
        try {
          // Use the general status endpoint that's already set up in the backend
          interface ImportStatusResponse {
            id?: string;
            status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'none' | 'unknown';
            error?: string;
            progress?: number;
            startTime?: Date;
            endTime?: Date;
            result?: {
              successCount: number;
              failedCount?: number;
              skippedCount?: number;
              totalRecords?: number;
            };
          }
          
          const companyId = user?.companyId;
          const statusResponse = await apiClient.get<ImportStatusResponse>(`/companies/${companyId}/auto-import/status/latest`);
          
          if (statusResponse && statusResponse.status === 'completed') {
            clearInterval(pollStatus);
            setIsAutoImporting(false);
            
            // Display import results
            if (statusResponse.result) {
              setImportComplete(true);
              toast.success(`Import complete: ${statusResponse.result.successCount} packages imported`);
            }
          } else if (statusResponse && statusResponse.status === 'failed') {
            clearInterval(pollStatus);
            setIsAutoImporting(false);
            toast.error(`Import failed: ${statusResponse.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error("Failed to check import status", error);
        }
        
        // Stop polling after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(pollStatus);
          setIsAutoImporting(false);
          toast.error('Import process timed out. Check audit logs for details.');
        }
      }, 2000);
      
    } catch (error) {
      console.error("Failed to start auto import:", error);
      toast.error('Failed to start auto import process');
      setIsAutoImporting(false);
    }
  };

  const renderHeaders = () => {
    if (!parsedData.length) return null;
    const headers = Object.keys(parsedData[0] || {});
    return headers.map((header) => (
      <TableHead key={header}>{header}</TableHead>
    ));
  };

  const renderPreviewRows = () => {
    if (!parsedData.length) return null;
    
    // Only show first 5 rows in preview
    const previewRows = parsedData.slice(0, 5);
    
    return previewRows.map((row, rowIndex) => (
      <TableRow key={rowIndex}>
        {Object.values(row).map((cell: any, cellIndex) => (
          <TableCell key={`${rowIndex}-${cellIndex}`}>{cell}</TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Import Packages</h1>
        
        {magayaSettings.enabled && magayaSettings.autoImportEnabled && (
          <Button 
            onClick={handleAutoImport}
            disabled={isAutoImporting || importing}
          >
            <Download className="mr-2 h-4 w-4" />
            {isAutoImporting ? "Importing..." : "Auto Import from Magaya"}
          </Button>
        )}
      </div>
      
      {magayaSettings.enabled && magayaSettings.autoImportEnabled && isAutoImporting && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Auto Import In Progress</AlertTitle>
          <AlertDescription>
            Currently downloading and importing data from Magaya. This may take a few minutes.
          </AlertDescription>
        </Alert>
      )}
      
      {magayaSettings.enabled && !magayaSettings.autoImportEnabled && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Auto Import Disabled</AlertTitle>
          <AlertDescription>
            Magaya integration is configured but auto import is disabled. Contact your administrator to enable this feature.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>CSV Import Tool</CardTitle>
          <CardDescription>
            Import packages for a customer using a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Customer (Optional)</FormLabel>
                    <Select
                      disabled={loadingUsers || importing}
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer or leave empty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__unassigned">No Customer (Unassigned)</SelectItem>
                        {usersResponse?.data?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optionally assign packages to a customer, or leave unassigned
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload CSV File</FormLabel>
                    <FormControl>
                      <FileUpload
                        onFilesChange={handleFileSelect}
                        maxFiles={1}
                        maxSize={5 * 1024 * 1024} // 5MB
                        accept={{
                          "text/csv": [".csv"],
                          "application/vnd.ms-excel": [".csv"],
                        }}
                        disabled={importing}
                        uploading={isParsing}
                        showPreview={true}
                        label="Upload CSV"
                        description="Drag and drop a CSV file or click to browse"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a CSV file containing package information
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {importComplete && importResult && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <AlertTitle>Import Complete</AlertTitle>
                  <AlertDescription>
                    Successfully imported {importResult.successCount} packages.
                    {importResult.failedCount > 0 && 
                      ` Failed to import ${importResult.failedCount} packages.`}
                    {importResult.skippedCount > 0 &&
                      ` Skipped ${importResult.skippedCount} packages (already exist).`}
                  </AlertDescription>
                </Alert>
              )}

              {showPreview && parsedData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Data Preview</h3>
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min(5, parsedData.length)} of {parsedData.length} rows
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>{renderHeaders()}</TableRow>
                      </TableHeader>
                      <TableBody>{renderPreviewRows()}</TableBody>
                    </Table>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      The CSV file should contain columns for Tracking Number, Status, Weight, and Description.
                      Packages with existing tracking numbers will be skipped.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setSelectedFile(null);
                    setParsedData([]);
                    setShowPreview(false);
                    setImportComplete(false);
                  }}
                  disabled={importing}
                >
                  Reset
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    importing || 
                    !selectedFile || 
                    parsedData.length === 0
                  }
                >
                  {importing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Packages
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
} 