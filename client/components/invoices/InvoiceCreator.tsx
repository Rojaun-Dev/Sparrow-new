'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, Trash2, Package, Calculator } from 'lucide-react';
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

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  packageId?: string;
  type: 'custom' | 'package' | 'fee';
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
  // Company and user data
  const { data: company } = useMyAdminCompany();
  const { data: usersData } = useCompanyUsers(company?.id, { role: 'customer' });
  const { logoUrl } = useCompanyLogo(company?.id);
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
      type: 'custom'
    }
  ]);

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const taxRate = 0.165; // 16.5% GCT for Jamaica, adjust as needed
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      total
    };
  }, [lineItems]);

  // Get selected customer
  const selectedCustomer = usersData?.data?.find(user => user.id === invoiceData.customerId);

  // Handlers
  const updateInvoiceData = (field: keyof InvoiceData, value: any) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      type: 'custom'
    };
    setLineItems(prev => [...prev, newItem]);
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
    const previewData = {
      ...invoiceData,
      customLineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        packageId: item.packageId
      })),
      packageIds: [],
      generateFees: false,
      isDraft: true
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
      packageIds: [],
      notes: invoiceData.notes,
      dueDate: invoiceData.dueDate,
      generateFees: false,
      isDraft
    };
    onGenerate?.(generateData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {mode === 'create' ? 'Create Invoice' : 'Edit Invoice'}
              </h1>
              
              {/* Customer Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill To
                  </label>
                  <Select
                    value={invoiceData.customerId || ''}
                    onValueChange={(value) => updateInvoiceData('customerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.data?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn(
                          "w-full justify-start text-left font-normal",
                          !invoiceData.issueDate && "text-muted-foreground"
                        )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceData.issueDate ? format(invoiceData.issueDate, "MMM dd, yyyy") : "Pick date"}
                        </Button>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn(
                          "w-full justify-start text-left font-normal",
                          !invoiceData.dueDate && "text-muted-foreground"
                        )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceData.dueDate ? format(invoiceData.dueDate, "MMM dd, yyyy") : "Pick date"}
                        </Button>
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

                {/* Invoice Number and Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Number
                    </label>
                    <Input
                      value={invoiceData.invoiceNumber}
                      onChange={(e) => updateInvoiceData('invoiceNumber', e.target.value)}
                      placeholder="INV-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <CurrencySelector
                      value={invoiceData.currency}
                      onValueChange={(currency) => updateInvoiceData('currency', currency)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      {index === 0 && (
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description
                        </label>
                      )}
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && (
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Qty
                        </label>
                      )}
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3">
                      {index === 0 && (
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Unit Price
                        </label>
                      )}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      {index === 0 && (
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          &nbsp;
                        </label>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="col-span-1 text-right">
                      {index === 0 && (
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Total
                        </label>
                      )}
                      <div className="text-sm font-medium text-gray-900 py-2">
                        {convertAndFormat(item.quantity * item.unitPrice, invoiceData.currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <Textarea
                value={invoiceData.notes}
                onChange={(e) => updateInvoiceData('notes', e.target.value)}
                placeholder="Payment terms, notes, etc."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleGenerate(true)}
                  variant="outline"
                  disabled={!invoiceData.customerId || lineItems.every(item => !item.description.trim())}
                >
                  Save as Draft
                </Button>
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
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:sticky lg:top-6">
            <Card className="p-8 bg-white shadow-lg min-h-[800px]">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="h-16 w-auto object-contain mb-2" />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{company?.name}</h1>
                  )}
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                  <p className="text-sm text-gray-600">#{invoiceData.invoiceNumber}</p>
                </div>
              </div>

              {/* Company and Customer Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">From:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">{company?.name}</p>
                    <p>{company?.address?.street}</p>
                    <p>{company?.address?.city}, {company?.address?.state} {company?.address?.postalCode}</p>
                    <p>{company?.phone}</p>
                    <p>{company?.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {selectedCustomer ? (
                      <>
                        <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                        <p>{selectedCustomer.email}</p>
                        {selectedCustomer.phone && <p>{selectedCustomer.phone}</p>}
                        {selectedCustomer.address && <p>{selectedCustomer.address}</p>}
                      </>
                    ) : (
                      <p className="text-gray-400 italic">Select a customer</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Issue Date:</span> {format(invoiceData.issueDate, "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Due Date:</span> {format(invoiceData.dueDate, "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mb-8">
                <div className="border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-3 py-3 text-sm font-medium text-gray-900">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {lineItems.filter(item => item.description.trim()).map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 py-2 text-sm">
                      <div className="col-span-6 text-gray-900">{item.description}</div>
                      <div className="col-span-2 text-center text-gray-600">{item.quantity}</div>
                      <div className="col-span-2 text-right text-gray-600">
                        {convertAndFormat(item.unitPrice, invoiceData.currency)}
                      </div>
                      <div className="col-span-2 text-right text-gray-900 font-medium">
                        {convertAndFormat(item.quantity * item.unitPrice, invoiceData.currency)}
                      </div>
                    </div>
                  ))}
                  {lineItems.every(item => !item.description.trim()) && (
                    <div className="py-8 text-center text-gray-400 italic">
                      Add line items to see preview
                    </div>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{convertAndFormat(calculations.subtotal, invoiceData.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (16.5%):</span>
                    <span className="font-medium">{convertAndFormat(calculations.taxAmount, invoiceData.currency)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{convertAndFormat(calculations.total, invoiceData.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoiceData.notes && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoiceData.notes}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}