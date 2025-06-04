"use client";

import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useExportCsv } from "@/hooks/useExportCsv";
import { invoiceService } from "@/lib/api/invoiceService";
import { useUsers } from "@/hooks/useUsers";
import Link from "next/link";

export default function InvoicesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Placeholder for filters
  const [filters] = useState({});

  const { data, isLoading, error } = useInvoices({ page, limit: pageSize, ...filters });
  const { exportCsv } = useExportCsv();
  const { data: usersData } = useUsers();
  const usersMap = Array.isArray(usersData) ? usersData.reduce((acc, u) => { acc[u.id] = u; return acc; }, {}) : {};

  const handleExport = async () => {
    await exportCsv(async () => invoiceService.exportInvoicesCsv({ ...filters }), undefined, "invoices.csv");
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">All Invoices</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>View and manage all invoices for your company</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Placeholder for filters */}
          <div className="mb-4">{/* Filters coming soon */}</div>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">Failed to load invoices</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Associated Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(data?.data) && data.data.length > 0 ? data.data.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        {usersMap[inv.userId] ? `${usersMap[inv.userId].firstName} ${usersMap[inv.userId].lastName}` : inv.userId}
                      </TableCell>
                      <TableCell>{inv.status}</TableCell>
                      <TableCell>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{inv.totalAmount ? `$${inv.totalAmount}` : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/invoices/${inv.id}`} passHref legacyBehavior>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                          <Link href={`/admin/invoices/${inv.id}?view=pdf`} passHref legacyBehavior>
                            <Button size="sm" variant="outline">View PDF</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No invoices found.
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