'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { formatCustomerDisplay, type SearchableCustomer, useDebouncedValue } from '@/lib/utils/customerSearch';

interface Customer extends SearchableCustomer {
  firstName: string;
  lastName: string;
  email: string;
}

interface SearchableCustomerDropdownProps {
  companyId?: string;
  value?: string;
  onValueChange: (value: string) => void;
  onCustomerSelect?: (customer: Customer | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableCustomerDropdown({
  companyId,
  value,
  onValueChange,
  onCustomerSelect,
  placeholder = "Select customer",
  disabled = false
}: SearchableCustomerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [internalSearchValue, setInternalSearchValue] = useState("");

  // Debounced search value for API calls
  const debouncedSearchValue = useDebouncedValue(searchValue, 300);

  // Use server-side search with useCompanyUsers
  const { data: usersData, isLoading } = useCompanyUsers(companyId || '', { 
    role: 'customer',
    search: debouncedSearchValue || undefined,
    limit: 50 // Reasonable limit for dropdown
  });

  const customers = usersData?.data || [];

  // Find the selected customer
  const selectedCustomer = customers.find(customer => customer.id === value);

  // Handle search input changes with direct state updates
  const handleSearchChange = useCallback((query: string) => {
    setInternalSearchValue(query);
    setSearchValue(query); // This will trigger the debounced API call
  }, []);

  // Reset search when dropdown opens/closes
  useEffect(() => {
    if (!open) {
      setSearchValue("");
      setInternalSearchValue("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            {selectedCustomer ? (
              <span className="truncate">
                {formatCustomerDisplay(selectedCustomer, { isCompact: true })}
              </span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search by name, email, or Pref ID..." 
            value={internalSearchValue}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Searching...' : 'No customers found.'}
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => {
                    const newValue = customer.id === value ? "" : customer.id;
                    onValueChange(newValue);
                    onCustomerSelect?.(newValue ? customer : null);
                    setOpen(false);
                    setSearchValue("");
                    setInternalSearchValue("");
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <div className="font-medium">
                      {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unnamed Customer'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{customer.email || 'No email'}</span>
                      {customer.prefId?.trim() && (
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                          {customer.prefId}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}