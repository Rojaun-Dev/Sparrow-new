import { useState } from 'react';
import { importService } from '@/lib/api/importService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UseImportOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function useImport(options: UseImportOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const { user } = useAuth();

  const parseCSVFile = async (file: File) => {
    try {
      setIsParsing(true);
      const result = await importService.parseCSVFile(file);
      setParseResult(result);
      return result;
    } catch (error: any) {
      toast.error(`Error parsing CSV: ${error.message}`);
      options.onError?.(error);
      throw error;
    } finally {
      setIsParsing(false);
    }
  };

  const importPackages = async (userId: string | undefined, file: File) => {
    if (!user?.companyId) {
      toast.error("Company ID not found. Please ensure you're logged in.");
      throw new Error("Company ID not found");
    }
    
    try {
      setIsLoading(true);
      const result = userId 
        ? await importService.importPackagesFromCsvFile(userId, file, user.companyId)
        : await importService.importPackagesFromCsvFile(null, file, user.companyId);
      setImportResult(result);
      toast.success(`Import completed: ${result.successCount} packages imported successfully`);
      options.onSuccess?.(result);
      return result;
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const importPackagesFromContent = async (userId: string, csvContent: string) => {
    if (!user?.companyId) {
      toast.error("Company ID not found. Please ensure you're logged in.");
      throw new Error("Company ID not found");
    }
    
    try {
      setIsLoading(true);
      const result = await importService.importPackagesFromCsvContent(userId, csvContent, user.companyId);
      setImportResult(result);
      toast.success(`Import completed: ${result.successCount} packages imported successfully`);
      options.onSuccess?.(result);
      return result;
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isParsing,
    parseResult,
    importResult,
    parseCSVFile,
    importPackages,
    importPackagesFromContent,
    currentCompanyId: user?.companyId
  };
} 