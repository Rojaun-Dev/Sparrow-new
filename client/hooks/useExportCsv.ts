import { useState } from 'react';

export function useExportCsv() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetchCsvBlob: async function that returns a Blob (e.g., usersService.exportUsersCsv)
  // params: query params to pass to the API
  // filename: name for the downloaded file
  const exportCsv = async (
    fetchCsvBlob: (params?: any) => Promise<Blob>,
    params?: any,
    filename: string = 'export.csv'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const blob = await fetchCsvBlob(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  return { exportCsv, loading, error };
} 