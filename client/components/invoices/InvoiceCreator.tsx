'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, Trash2, Package, Calculator, User } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useMyAdminCompany } from '@/hooks/useCompanies';
import { useCompanyLogo } from '@/hooks/useCompanyAssets';
import { useCurrency } from '@/hooks/useCurrency';
import { SupportedCurrency } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { PackageSelectionDialog } from './PackageSelectionDialog';
import { SearchableCustomerDropdown } from './SearchableCustomerDropdown';
import { FeeCalculationDialog } from './FeeCalculationDialog';
import { invoiceService } from '@/lib/api/invoiceService';
import { useToast } from '@/hooks/use-toast';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency?: SupportedCurrency;
  packageId?: string;
  type: 'custom' | 'package' | 'fee' | 'tax' | 'shipping' | 'handling' | 'customs' | 'other';
}

interface InvoiceData {
  customerId: string | null;
  issueDate: Date;
  dueDate: Date;
  invoiceNumber: string;
  notes: string;
  currency: SupportedCurrency;
}

interface InvoiceCreatorProps {
  mode?: 'create' | 'edit';
  initialData?: Partial<InvoiceData>;
  onSave?: (data: any) => void;
  onPreview?: (data: any) => void;
  onGenerate?: (data: any) => void;
}

export function InvoiceCreator({
  mode = 'create',
  initialData,
  onSave,
  onPreview,
  onGenerate
}: InvoiceCreatorProps) {
  const { toast } = useToast();
  
  // Company and user data
  const { data: company } = useMyAdminCompany();
  const { data: usersData } = useCompanyUsers(company?.id, { role: 'customer' });
  const { logoUrl, isUsingBanner } = useCompanyLogo(company?.id);
  const { selectedCurrency, setSelectedCurrency, convertAndFormat } = useCurrency();

  // Invoice state
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    customerId: null,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    invoiceNumber: `INV-${Date.now()}`,
    notes: '',
    currency: selectedCurrency,
    ...initialData
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      currency: selectedCurrency,
      type: 'custom'
    }
  ]);

  // Package selection state
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<any[]>([]);
  const [generatingFees, setGeneratingFees] = useState(false);
  
  // Fee calculation dialog state
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [pendingPackages, setPendingPackages] = useState<any[]>([]);
  
  // Track if there are any actual tax line items
  const hasTaxItems = useMemo(() => {
    return lineItems.some(item => item.type === 'tax');
  }, [lineItems]);

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      // Convert to invoice currency if needed
      const amount = item.currency && item.currency !== invoiceData.currency
        ? convertAndFormat(item.quantity * item.unitPrice, item.currency, true) as number // Return numeric value
        : item.quantity * item.unitPrice;
      return sum + amount;
    }, 0);

    // Tax amount is only the sum of tax line items (no hardcoded percentages)
    const taxAmount = lineItems
      .filter(item => item.type === 'tax')
      .reduce((sum, item) => {
        const amount = item.currency && item.currency !== invoiceData.currency
          ? convertAndFormat(item.quantity * item.unitPrice, item.currency, true) as number
          : item.quantity * item.unitPrice;
        return sum + amount;
      }, 0);
    
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      total
    };
  }, [lineItems, invoiceData.currency, convertAndFormat]);

  // Get selected customer
  const selectedCustomer = usersData?.data?.find(user => user.id === invoiceData.customerId);

  // Handlers
  const updateInvoiceData = (field: keyof InvoiceData, value: any) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
    
    // If currency is being updated, also update the global currency context
    if (field === 'currency') {
      setSelectedCurrency(value);
    }
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      currency: invoiceData.currency,
      type: 'custom'
    };
    setLineItems(prev => [...prev, newItem]);
  };

  const addPackagesAsLineItems = (packages: any[]) => {
    setPendingPackages(packages);
    setFeeDialogOpen(true);
  };
  
  const handleCalculateFees = async () => {
    setSelectedPackages(pendingPackages);
    await generateFeesForPackages(pendingPackages);
    setPendingPackages([]);
  };
  
  const handleSkipFees = () => {
    setSelectedPackages(pendingPackages);
    const packageItems: LineItem[] = pendingPackages.map(pkg => ({
      id: `pkg-${pkg.id}`,
      description: `Package: ${pkg.trackingNumber} - ${pkg.description || 'No description'}`,
      quantity: 1,
      unitPrice: 0, // User can set price
      currency: invoiceData.currency,
      packageId: pkg.id,
      type: 'package' as const
    }));
    
    setLineItems(prev => [...prev, ...packageItems]);
    setPendingPackages([]);
  };

  const generateFeesForPackages = async (packages?: any[]) => {
    const packagesToUse = packages || selectedPackages;
    if (!packagesToUse.length || !company?.id) return;

    setGeneratingFees(true);
    try {
      const feeItems: LineItem[] = [];
      
      for (const pkg of packagesToUse) {
        try {
          // Call the fee calculation API using the invoice service
          const feeData = await invoiceService.previewInvoice({
            userId: invoiceData.customerId,
            packageIds: [pkg.id],
            generateFees: true,
            isDraft: true
          });
          
          // Convert fee line items to our format
          if (feeData.lineItems && Array.isArray(feeData.lineItems)) {
            const packageFeeItems: LineItem[] = feeData.lineItems.map((item: any) => ({
              id: `fee-${pkg.id}-${Date.now()}-${Math.random()}`,
              description: item.description,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || item.lineTotal || 0,
              currency: invoiceData.currency,
              packageId: pkg.id,
              type: item.type || 'fee'
            }));
            
            feeItems.push(...packageFeeItems);
          }
        } catch (error) {
          console.error(`Failed to get fees for package ${pkg.id}:`, error);
        }
      }
      
      if (feeItems.length > 0) {
        setLineItems(prev => [...prev, ...feeItems]);
        toast({
          title: 'Fees Generated',
          description: `Generated ${feeItems.length} fee line items from selected packages`,
        });
      } else {
        toast({
          title: 'No Fees Found',
          description: 'No applicable fees found for the selected packages',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error Generating Fees',
        description: 'Failed to generate fees from packages',
        variant: 'destructive',
      });
    } finally {
      setGeneratingFees(false);
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePreview = () => {
    if (!invoiceData.customerId) return;
    
    const previewData = {
      userId: invoiceData.customerId,
      customLineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        packageId: item.packageId
      })),
      packageIds: selectedPackages.map(pkg => pkg.id),
      generateFees: false,
      isDraft: true,
      notes: invoiceData.notes,
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate
    };
    onPreview?.(previewData);
  };

  const handleGenerate = (isDraft = false) => {
    const generateData = {
      userId: invoiceData.customerId,
      customLineItems: lineItems
        .filter(item => item.description.trim())
        .map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          packageId: item.packageId
        })),
      packageIds: selectedPackages.map(pkg => pkg.id),
      notes: invoiceData.notes,
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      generateFees: false, // We're generating fees manually now
      isDraft
    };
    onGenerate?.(generateData);
  };

  // Sync global currency with local invoice data
  useEffect(() => {
    // Only update if the currencies are different to prevent loops
    if (selectedCurrency !== invoiceData.currency) {
      setInvoiceData(prev => ({ ...prev, currency: selectedCurrency }));
    }
  }, [selectedCurrency, invoiceData.currency]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* PDF-Like Invoice Form */}
        <Card className="bg-white shadow-lg" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto', padding: '30px' }}>
          
          {/* Header with Logo and Company Info - Exact PDF Layout */}
          <div className="flex justify-between mb-5" style={{ marginBottom: '20px' }}>
            <div>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={isUsingBanner ? "Company Banner" : "Company Logo"} 
                  style={{ 
                    width: isUsingBanner ? '200px' : '120px', 
                    height: '60px', 
                    objectFit: 'contain' 
                  }} 
                />
              ) : (
                <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'Helvetica' }}>{company?.name || 'Company Name'}</div>
              )}
            </div>
            <div className="text-right" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', fontFamily: 'Helvetica' }}>{company?.name || 'Company Name'}</div>
              <div style={{ fontSize: '12px', lineHeight: '1.2' }}>
                <div>{company?.address?.street || ''}</div>
                <div>{company?.address?.city || ''}, {company?.address?.state || ''} {company?.address?.postalCode || ''}</div>
                <div>{company?.phone || ''}</div>
                <div>{company?.email || ''}</div>
              </div>
            </div>
          </div>

          {/* Invoice Title and Number - Exact PDF Layout */}
          <div style={{ marginBottom: '20px' }}>
            <div className="flex justify-between items-center mb-2">
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', fontFamily: 'Helvetica' }}>INVOICE</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Currency:</span>
                <CurrencySelector 
                  value={invoiceData.currency} 
                  onValueChange={(currency) => updateInvoiceData('currency', currency)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
              <div>Invoice #: 
                <input
                  type="text"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => updateInvoiceData('invoiceNumber', e.target.value)}
                  className="ml-1 border-none bg-transparent outline-none underline decoration-dotted"
                  style={{ fontSize: '12px' }}
                />
              </div>
              <div>Status: <span className="text-blue-600 font-medium">Draft</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <div>Issue Date: 
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="ml-1 underline decoration-dotted hover:bg-gray-50 px-1">
                      {format(invoiceData.issueDate, "MMM dd, yyyy")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={invoiceData.issueDate}
                      onSelect={(date) => date && updateInvoiceData('issueDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>Due Date: 
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="ml-1 underline decoration-dotted hover:bg-gray-50 px-1">
                      {format(invoiceData.dueDate, "MMM dd, yyyy")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={invoiceData.dueDate}
                      onSelect={(date) => date && updateInvoiceData('dueDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Customer Information Section - Exact PDF Layout */}
          <div className="mt-4 mb-4">
            <div className="text-sm font-bold mb-2 text-gray-800 bg-gray-100 p-1">Customer Information</div>
            {!selectedCustomer ? (
              <div className="border-2 border-dashed border-gray-300 p-4 text-center">
                <SearchableCustomerDropdown
                  customers={usersData?.data || []}
                  value={invoiceData.customerId || ''}
                  onValueChange={(value) => updateInvoiceData('customerId', value)}
                  placeholder="Search by name, email, or Pref ID..."
                />
              </div>
            ) : (
              <>
                <div className="flex mb-1 text-xs">
                  <div className="w-1/4 text-gray-600">Name:</div>
                  <div className="w-3/4">{selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                </div>
                <div className="flex mb-1 text-xs">
                  <div className="w-1/4 text-gray-600">Email:</div>
                  <div className="w-3/4">{selectedCustomer.email}</div>
                </div>
                <div className="flex mb-1 text-xs">
                  <div className="w-1/4 text-gray-600">Phone:</div>
                  <div className="w-3/4">{selectedCustomer.phone || 'N/A'}</div>
                </div>
                <div className="text-right mt-2">
                  <button 
                    onClick={() => updateInvoiceData('customerId', null)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Change Customer
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Package Selection Section */}
          {selectedCustomer && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-bold text-gray-800">Selected Packages</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPackageDialogOpen(true)}
                    className="text-xs"
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Add Packages
                  </Button>
                  {selectedPackages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateFeesForPackages}
                      disabled={generatingFees}
                      className="text-xs"
                    >
                      <Calculator className="h-3 w-3 mr-1" />
                      {generatingFees ? 'Generating...' : 'Get Fees'}
                    </Button>
                  )}
                </div>
              </div>
              {selectedPackages.length > 0 ? (
                <div className="border border-gray-200 rounded text-xs">
                  {selectedPackages.map(pkg => (
                    <div key={pkg.id} className="p-2 border-b last:border-b-0 flex justify-between">
                      <span>{pkg.trackingNumber} - {pkg.description || 'No description'}</span>
                      <button 
                        onClick={() => {
                          setSelectedPackages(prev => prev.filter(p => p.id !== pkg.id));
                          setLineItems(prev => prev.filter(item => item.packageId !== pkg.id));
                        }}
                        className="text-red-600 hover:underline ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">No packages selected</div>
              )}
            </div>
          )}

          {/* Invoice Items Section - Exact PDF Layout */}
          <div className="mt-4 mb-4">
            <div className="text-sm font-bold mb-2 text-gray-800 bg-gray-100 p-1">Invoice Items</div>
            
            {/* Table Header */}
            <div className="bg-gray-100 border-b border-gray-300 py-2">
              <div className="flex text-xs font-medium">
                <div className="w-3/5 pr-2">Description</div>
                <div className="w-1/5 text-right">Amount</div>
                <div className="w-1/5 text-center">Action</div>
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="border-b border-gray-200">
              {lineItems.length > 0 ? (
                lineItems.map((item) => (
                  <div key={item.id} className="flex items-center py-2 border-b border-gray-100 text-xs">
                    <div className="w-3/5 pr-2">
                      <input
                        type="text"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full border-none bg-transparent outline-none text-xs"
                      />
                    </div>
                    <div className="w-1/5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-16 text-right border-none bg-transparent outline-none text-xs"
                        />
                        <span className="text-gray-600">×</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-12 text-center border-none bg-transparent outline-none text-xs"
                        />
                        <span>=</span>
                        <span className="font-medium min-w-16 text-right">
                          {convertAndFormat(item.quantity * item.unitPrice, item.currency || invoiceData.currency)}
                        </span>
                      </div>
                    </div>
                    <div className="w-1/5 text-center">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500 text-xs italic">
                  No items added yet
                </div>
              )}
            </div>
            
            {/* Totals Section - Exact PDF Layout */}
            <div className="py-2">
              <div className="flex text-xs border-b border-gray-100 py-1">
                <div className="w-3/5 text-right font-medium">Subtotal</div>
                <div className="w-1/5"></div>
                <div className="w-1/5 text-right font-medium">{convertAndFormat(calculations.subtotal, invoiceData.currency)}</div>
              </div>
              {(hasTaxItems || calculations.taxAmount > 0) && (
                <div className="flex text-xs border-b border-gray-100 py-1">
                  <div className="w-3/5 text-right font-medium">Tax</div>
                  <div className="w-1/5"></div>
                  <div className="w-1/5 text-right font-medium">{convertAndFormat(calculations.taxAmount, invoiceData.currency)}</div>
                </div>
              )}
              <div className="flex text-xs py-2 border-t border-gray-400">
                <div className="w-3/5 text-right font-bold">Total</div>
                <div className="w-1/5"></div>
                <div className="w-1/5 text-right font-bold">{convertAndFormat(calculations.total, invoiceData.currency)}</div>
              </div>
            </div>

            {/* Add Item Button */}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Notes Section - Exact PDF Layout */}
          <div className="mt-6">
            <div className="text-sm font-bold mb-2 text-gray-800">Notes:</div>
            <textarea
              value={invoiceData.notes}
              onChange={(e) => updateInvoiceData('notes', e.target.value)}
              placeholder="Payment terms, notes, etc."
              className="w-full border-none bg-transparent outline-none resize-none text-xs"
              rows={3}
            />
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="mt-8 pt-4 border-t border-gray-300 flex justify-center gap-4">
            <Button
              onClick={() => handleGenerate(false)}
              disabled={!invoiceData.customerId || lineItems.every(item => !item.description.trim())}
            >
              Generate Invoice
            </Button>
            <Button
              onClick={handlePreview}
              variant="outline"
              disabled={!invoiceData.customerId || lineItems.every(item => !item.description.trim())}
            >
              Preview
            </Button>
          </div>
        </Card>

        {/* Package Selection Dialog */}
        <PackageSelectionDialog
          open={packageDialogOpen}
          onOpenChange={setPackageDialogOpen}
          customerId={invoiceData.customerId}
          companyId={company?.id}
          onPackagesSelected={addPackagesAsLineItems}
        />

        {/* Fee Calculation Dialog */}
        <FeeCalculationDialog
          open={feeDialogOpen}
          onOpenChange={setFeeDialogOpen}
          onCalculateFees={handleCalculateFees}
          onSkipFees={handleSkipFees}
          packageCount={pendingPackages.length}
        />
      </div>
    </div>
  );
}