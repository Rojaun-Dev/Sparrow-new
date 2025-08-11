'use client';
import React, { useState } from 'react';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { usePackages } from '@/hooks/usePackages';
import { usePreviewInvoice, useGenerateInvoice } from '@/hooks/useInvoices';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useMyAdminCompany } from '@/hooks/useCompanies';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnbilledPackagesByUser } from '@/hooks/usePackages';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { SupportedCurrency } from '@/lib/api/types';
import { CurrencySelector } from '@/components/ui/currency-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Helper to safely convert to number
function safeNumber(val: any) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export default function CreateInvoicePage() {
  // Get current company
  const { data: company } = useMyAdminCompany();
  const companyId = company?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Currency conversion
  const { selectedCurrency, setSelectedCurrency, convertAndFormat, convert } = useCurrency();

  // State for selected customer and packages
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [customerSelectionDisabled, setCustomerSelectionDisabled] = useState(false);

  // Customer search/sort state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSort, setCustomerSort] = useState<'firstName' | 'lastName' | 'email'>('firstName');
  const [customerOrder, setCustomerOrder] = useState<'asc' | 'desc'>('asc');

  // Package search/sort state
  const [packageSearch, setPackageSearch] = useState('');
  const [packagePage, setPackagePage] = useState(1);
  const [packageSort, setPackageSort] = useState<'trackingNumber' | 'status'>('trackingNumber');
  const [packageOrder, setPackageOrder] = useState<'asc' | 'desc'>('asc');
  const packagesPerPage = 10;

  // Fetch customers
  const {
    data: customersData,
    isLoading: customersLoading,
    error: customersError,
  } = useCompanyUsers(companyId, {
    page: customerPage,
    limit: 10,
    search: customerSearch,
    sort: customerSort,
    order: customerOrder,
    role: 'customer',
  });

  // Fetch all packages for the company (no pagination in API call)
  const {
    data: packagesData,
    isLoading: packagesLoading,
    error: packagesError,
  } = usePackages({
    companyId,
    search: packageSearch,
    sortBy: packageSort,
    sortOrder: packageOrder,

    // For some reason, the frontend doesn't display all packages without this limit
    limit: 1000, // HACK: Try to fetch all packages in one request
                 // lol who am I kidding, I'm likely never getting back to this.
    // TODO: Add pagination to packages
  });

  // Fetch unbilled packages for the selected customer
  const {
    data: unbilledPackagesData,
    isLoading: unbilledPackagesLoading,
    error: unbilledPackagesError,
  } = useUnbilledPackagesByUser(selectedCustomer?.id, companyId);

  // Filter and paginate unbilled packages for the selected customer
  const filteredPackages = unbilledPackagesData || [];
  const totalFilteredPages = Math.max(1, Math.ceil(filteredPackages.length / packagesPerPage));
  const paginatedPackages = filteredPackages.slice(
    (packagePage - 1) * packagesPerPage,
    packagePage * packagesPerPage
  );

  // Reset packagePage if filteredPackages changes and current page is out of range
  React.useEffect(() => {
    if (packagePage > totalFilteredPages) {
      setPackagePage(1);
    }
  }, [filteredPackages.length, totalFilteredPages, packagePage]);

  // Preview invoice calculation
  const previewInvoice = usePreviewInvoice();
  // Generate invoice
  const generateInvoice = useGenerateInvoice();

  // State to hold preview result
  const [invoicePreview, setInvoicePreview] = useState<any>(null);

  // Notes field
  const [notes, setNotes] = useState('');

  // Additional charge state
  const [additionalCharge, setAdditionalCharge] = useState('');
  const [additionalChargeCurrency, setAdditionalChargeCurrency] = useState<SupportedCurrency>('USD');
  const [sendNotification, setSendNotification] = useState(false);

  // On mount, check for customerId in query params and preselect customer
  React.useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId && customersData?.data) {
      const found = customersData.data.find((c: any) => c.id === customerId);
      if (found) {
        setSelectedCustomer(found);
        setCustomerSelectionDisabled(true);
      }
    }
  }, [searchParams, customersData]);

  // Live preview: call previewInvoice when selectedCustomer or selectedPackages changes
  React.useEffect(() => {
    if (selectedCustomer && selectedPackages.length > 0) {
      previewInvoice.mutate(
        {
          userId: selectedCustomer.id,
          packageIds: selectedPackages,
          additionalCharge: additionalCharge ? Number(additionalCharge) : undefined,
          additionalChargeCurrency: additionalCharge ? additionalChargeCurrency : undefined,
        },
        {
          onSuccess: (data) => {
            setInvoicePreview(data);
          },
          onError: () => {
            setInvoicePreview(null);
          },
        }
      );
    } else {
      setInvoicePreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer, selectedPackages, additionalCharge, additionalChargeCurrency]);

  // Handler for selecting a customer
  const handleSelectCustomer = (customer: any) => {
    if (customerSelectionDisabled) return;
    setSelectedCustomer(customer);
    setSelectedPackages([]); // Reset packages when customer changes
  };

  // Pagination helpers
  const totalPages = customersData?.pagination?.totalPages || 1;

  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  // Handler for invoice creation
  const handleCreateInvoice = async () => {
    if (!selectedCustomer || selectedPackages.length === 0) return;
    return new Promise<void>((resolve, reject) => {
      generateInvoice.mutate(
        {
          userId: selectedCustomer.id,
          packageIds: selectedPackages,
          additionalCharge: additionalCharge ? Number(additionalCharge) : undefined,
          additionalChargeCurrency: additionalCharge ? additionalChargeCurrency : undefined,
          sendNotification,
          notes: notes || undefined,
        },
        {
          onSuccess: (data) => {
            toast({ title: 'Invoice created', description: 'The invoice was successfully created.' });
            setShowConfirm(false);
            setAdditionalCharge('');
            setAdditionalChargeCurrency('USD');
            setSendNotification(false);
            setNotes('');
            // Optionally redirect to the invoice detail page
            if (data && data.id) {
              router.push(`/admin/invoices/${data.id}`);
            }
            resolve();
          },
          onError: (error: any) => {
            toast({ title: 'Error', description: error?.message || 'Failed to create invoice', variant: 'destructive' });
            reject(error);
          },
        }
      );
    });
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-extrabold mb-6 tracking-tight">Create Invoice</h1>
      {/* Invoice Calculation Preview (now at the top) */}
      <div className="mb-6">
        <Card className="shadow-sm border rounded-lg">
          <CardHeader className="py-3 px-6 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Invoice Calculation Preview</CardTitle>
            <Select
              value={selectedCurrency}
              onValueChange={(value: SupportedCurrency) => setSelectedCurrency(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="JMD">JMD (J$)</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="py-4 px-6">
            {previewInvoice.isPending ? (
              <div className="py-2"><Skeleton className="h-6 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></div>
            ) : previewInvoice.isError ? (
              <div className="text-red-600 text-sm">Failed to preview invoice. Please try again.</div>
            ) : invoicePreview ? (
              <div className="space-y-1 text-base">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>{convertAndFormat(safeNumber(invoicePreview.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tax:</span>
                  <span>{convertAndFormat(safeNumber(invoicePreview.taxAmount))}</span>
                </div>
                {invoicePreview.feeBreakdown && Object.keys(invoicePreview.feeBreakdown).length > 0 && (
                  <div className="space-y-0.5">
                    <div className="font-semibold">Fees:</div>
                    {Object.entries(invoicePreview.feeBreakdown).map(([fee, amount]: [string, any]) => (
                      <div className="flex justify-between text-sm pl-4" key={fee}>
                        <span>{fee}:</span>
                        <span>{convertAndFormat(safeNumber(amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total:</span>
                  <span>{convertAndFormat(safeNumber(invoicePreview.subtotal) + safeNumber(invoicePreview.taxAmount))}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-base">Select packages to preview invoice calculation.</div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Customer and Package panels side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Select Customer */}
        <Card className="shadow-sm border rounded-lg h-full flex flex-col">
          <CardHeader className="py-3 px-6 border-b">
            <CardTitle className="text-lg font-semibold">Customer</CardTitle>
          </CardHeader>
          <CardContent className="py-4 px-6 flex-1 flex flex-col">
            <div className="mb-2 flex gap-2 items-center">
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value);
                  setCustomerPage(1);
                }}
                className="max-w-xs h-8 text-sm"
              />
            </div>
            <div className="overflow-x-auto flex-1">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="px-2 py-1">Name</TableHead>
                    <TableHead className="px-2 py-1">Email</TableHead>
                    <TableHead className="px-2 py-1">Phone</TableHead>
                    <TableHead className="px-2 py-1"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="h-8">
                        <TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : customersError ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-red-600 text-center">Failed to load customers</TableCell>
                    </TableRow>
                  ) : customersData?.data?.length ? (
                    customersData.data.map((customer: any) => (
                      <TableRow
                        key={customer.id}
                        className={selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''}
                      >
                        <TableCell className="px-2 py-1">{customer.firstName} {customer.lastName}</TableCell>
                        <TableCell className="px-2 py-1">{customer.email}</TableCell>
                        <TableCell className="px-2 py-1">{customer.phone || '-'}</TableCell>
                        <TableCell className="px-2 py-1">
                          <Button
                            size="sm"
                            variant={selectedCustomer?.id === customer.id ? 'default' : 'outline'}
                            onClick={() => handleSelectCustomer(customer)}
                            disabled={selectedCustomer?.id === customer.id}
                            className="h-7 px-3 text-xs"
                          >
                            {selectedCustomer?.id === customer.id ? 'Selected' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-2 flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                      aria-disabled={customerPage === 1}
                      tabIndex={customerPage === 1 ? -1 : 0}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-2 py-0.5 text-xs">Page {customerPage} of {totalPages}</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCustomerPage(p => Math.min(totalPages, p + 1))}
                      aria-disabled={customerPage === totalPages}
                      tabIndex={customerPage === totalPages ? -1 : 0}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
        {/* Select Packages */}
        <Card className="shadow-sm border rounded-lg h-full flex flex-col">
          <CardHeader className="py-3 px-6 border-b">
            <CardTitle className="text-lg font-semibold">Packages</CardTitle>
          </CardHeader>
          <CardContent className="py-4 px-6 flex-1 flex flex-col">
            {!selectedCustomer ? (
              <div className="text-muted-foreground text-sm">Select a customer to view their packages.</div>
            ) : (
              <>
                <div className="mb-2 flex gap-2 items-center">
                  <Input
                    placeholder="Search packages by tracking #, description, etc..."
                    value={packageSearch}
                    onChange={e => {
                      setPackageSearch(e.target.value);
                      setPackagePage(1);
                    }}
                    className="max-w-xs h-8 text-sm"
                  />
                </div>
                <div className="overflow-x-auto flex-1">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="h-8">
                        <TableHead className="px-2 py-1"></TableHead>
                        <TableHead className="px-2 py-1">Tracking #</TableHead>
                        <TableHead className="px-2 py-1">Description</TableHead>
                        <TableHead className="px-2 py-1">Status</TableHead>
                        <TableHead className="px-2 py-1">Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unbilledPackagesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i} className="h-8">
                            <TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell>
                          </TableRow>
                        ))
                      ) : unbilledPackagesError ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-red-600 text-center">Failed to load packages</TableCell>
                        </TableRow>
                      ) : paginatedPackages.length ? (
                        paginatedPackages.map((pkg: any) => {
                          const checked = selectedPackages.includes(pkg.id);
                          return (
                            <TableRow
                              key={pkg.id}
                              className={checked ? 'bg-blue-50' : ''}
                            >
                              <TableCell className="px-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={e => {
                                    setSelectedPackages(prev =>
                                      e.target.checked
                                        ? [...prev, pkg.id]
                                        : prev.filter(id => id !== pkg.id)
                                    );
                                  }}
                                  className="accent-blue-600 w-4 h-4"
                                />
                              </TableCell>
                              <TableCell className="px-2 py-1">{pkg.trackingNumber}</TableCell>
                              <TableCell className="px-2 py-1">{pkg.description || '-'}</TableCell>
                              <TableCell className="px-2 py-1">{pkg.status}</TableCell>
                              <TableCell className="px-2 py-1">{pkg.weight ?? '-'}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No packages found for this customer.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 flex justify-end">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPackagePage(p => Math.max(1, p - 1))}
                          aria-disabled={packagePage === 1}
                          tabIndex={packagePage === 1 ? -1 : 0}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-2 py-0.5 text-xs">Page {packagePage} of {totalFilteredPages}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPackagePage(p => Math.min(totalFilteredPages, p + 1))}
                          aria-disabled={packagePage === totalFilteredPages}
                          tabIndex={packagePage === totalFilteredPages ? -1 : 0}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Confirmation Dialog Button (right aligned) */}
      <div className="flex justify-end mt-2">
        <ConfirmationDialog
          title="Create Invoice?"
          description="Are you sure you want to create this invoice? You can add an additional charge, notes, and choose to notify the customer."
          confirmText={generateInvoice.isPending ? 'Creating...' : 'Create Invoice'}
          cancelText="Cancel"
          variant="default"
          onConfirm={handleCreateInvoice}
          trigger={
            <Button
              disabled={
                !selectedCustomer ||
                selectedPackages.length === 0 ||
                generateInvoice.isPending
              }
              onClick={() => setShowConfirm(true)}
              className="h-8 px-4 text-sm"
            >
              Create Invoice
            </Button>
          }
        >
          <div className="space-y-2 py-1">
            <div>
              <label className="block text-xs font-medium mb-1">Additional Charge (optional)</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={additionalCharge}
                  onChange={e => setAdditionalCharge(e.target.value)}
                  placeholder="0.00"
                  className="max-w-[120px] h-8 text-sm"
                />
                <CurrencySelector
                  value={additionalChargeCurrency}
                  onValueChange={setAdditionalChargeCurrency}
                  size="sm"
                  className="text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Notes (optional)</label>
              <Input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes to this invoice..."
                className="max-w-xs h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="notify-checkbox"
                checked={sendNotification}
                onCheckedChange={checked => setSendNotification(!!checked)}
                className="w-4 h-4"
              />
              <label htmlFor="notify-checkbox" className="text-xs select-none cursor-pointer">Send notification to customer</label>
            </div>
          </div>
        </ConfirmationDialog>
      </div>
    </div>
  );
} 