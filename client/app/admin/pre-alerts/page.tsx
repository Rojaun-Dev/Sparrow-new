"use client";

import { useState } from "react";
import { usePreAlerts } from "@/hooks/usePreAlerts";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Eye, Link } from "lucide-react";
import { useExportCsv } from "@/hooks/useExportCsv";
import { preAlertService } from "@/lib/api/preAlertService";

export default function PreAlertsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Placeholder for filters
  const [filters] = useState({});

  const { data, isLoading, error } = usePreAlerts({ page, limit: pageSize, ...filters });
  const { exportCsv } = useExportCsv();

  const handleExport = async () => {
    await exportCsv(async () => preAlertService.exportPreAlertsCsv({ ...filters }), undefined, "pre-alerts.csv");
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">All Pre-Alerts</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Pre-Alerts</CardTitle>
            <CardDescription>View and manage all pre-alerts for your company</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Placeholder for filters */}
          <div className="mb-4">{/* Filters coming soon */}</div>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">Failed to load pre-alerts</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Estimated Arrival</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(data?.data) && data.data.length > 0 ? data.data.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.trackingNumber}</TableCell>
                      <TableCell>{alert.userId}</TableCell>
                      <TableCell>{alert.courier}</TableCell>
                      <TableCell>{alert.status}</TableCell>
                      <TableCell>{alert.estimatedArrival ? new Date(alert.estimatedArrival).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => {/* TODO: Implement view handler */}}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => {/* TODO: Implement match handler */}}
                          >
                            <Link className="h-4 w-4" />
                            Match
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pre-alerts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              {data && data.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={data.pagination.page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={data.pagination.page === data.pagination.totalPages}
                      onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                  <div>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 20, 50, 100].map(size => (
                        <option key={size} value={size}>{size} / page</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 