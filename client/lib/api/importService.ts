import { ApiClient } from './apiClient';

class ImportService {
  private baseUrl = '/companies';
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  private async getCompanyId(): Promise<string> {
    const companyIdFromLocalStorage = localStorage.getItem('currentCompanyId');
    if (companyIdFromLocalStorage) {
      return companyIdFromLocalStorage;
    }
    throw new Error('Company ID not found. Please ensure you are logged in and have selected a company.');
  }

  /**
   * Import packages from CSV content for a user
   * @param userId The user ID to assign packages to
   * @param csvContent The CSV content as string
   * @param companyId Optional company ID
   */
  async importPackagesFromCsvContent(
    userId: string | null | undefined,
    csvContent: string,
    companyId?: string,
  ): Promise<any> {
    const cid = companyId || await this.getCompanyId();
    
    // Use different endpoint based on whether userId is provided
    const endpoint = userId 
      ? `${this.baseUrl}/${cid}/import/users/${userId}/packages/import`
      : `${this.baseUrl}/${cid}/import/packages/import`;
    
    return this.apiClient.post(
      endpoint,
      { csvContent }
    );
  }

  /**
   * Import packages from a CSV file for a user
   * @param userId The user ID to assign packages to
   * @param file The CSV file to upload
   * @param companyId Optional company ID
   */
  async importPackagesFromCsvFile(
    userId: string | null | undefined,
    file: File,
    companyId?: string,
  ): Promise<any> {
    const cid = companyId || await this.getCompanyId();
    
    console.log('[ImportService] Using companyId:', {
      providedCompanyId: companyId,
      resolvedCompanyId: cid,
      fromLocalStorage: !companyId,
    });
    
    const formData = new FormData();
    formData.append('csvFile', file);
    
    // DEBUG: verify we're passing a proper FormData instance and File object
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ImportService] Sending FormData with file:', {
        isFormData: formData instanceof FormData,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    }
    
    // Use different endpoint based on whether userId is provided
    const endpoint = userId 
      ? `${this.baseUrl}/${cid}/import/users/${userId}/packages/import/file`
      : `${this.baseUrl}/${cid}/import/packages/import/file`;
    
    // Don't set Content-Type header, let the browser set it with the correct boundary
    return this.apiClient.post(
      endpoint,
      formData
    );
  }

  /**
   * Parse CSV file and return the parsed data without importing
   * @param file The CSV file to parse
   */
  async parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvData = event.target?.result as string;
          const parsedData = this.parseCSV(csvData);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Parse CSV content string into array of objects
   * @param csvContent The CSV content as string
   */
  private parseCSV(csvContent: string): any[] {
    const lines = csvContent.split('\n');
    const result = [];
    const headers = lines[0].split(',').map(header => header.trim());
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const obj: Record<string, string> = {};
      const currentLine = lines[i].split(',');
      
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j]?.trim() || '';
      }
      
      result.push(obj);
    }
    
    return result;
  }
}

export const importService = new ImportService(); 