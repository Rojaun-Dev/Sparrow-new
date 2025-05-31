"use client";
import { useExportCsv } from '@/hooks/useExportCsv';
import { exportPaymentsCsv } from '@/lib/api/paymentService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useAuth();
  const { exportCsv, loading: exportLoading } = useExportCsv();

  // Export handler
  const handleExport = async () => {
    await exportCsv(
      (params) => exportPaymentsCsv(params, user?.companyId),
      {
        // Add your filters here, e.g. search, status, etc.
      },
      'payments.csv'
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button variant="outline" className="gap-1" onClick={handleExport} disabled={exportLoading}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </>
  );
} 