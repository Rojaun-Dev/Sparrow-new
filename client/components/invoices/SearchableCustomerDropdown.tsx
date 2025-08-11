'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useCustomerSearch, formatCustomerDisplay, type SearchableCustomer } from '@/lib/utils/customerSearch';

interface Customer extends SearchableCustomer {
  firstName: string;
  lastName: string;
  email: string;
}

interface SearchableCustomerDropdownProps {
  customers: Customer[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableCustomerDropdown({
  customers,
  value,
  onValueChange,
  placeholder = "Select customer",
  disabled = false
}: SearchableCustomerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [internalSearchValue, setInternalSearchValue] = useState("");

  // Use the customer search utility
  const filteredCustomers = useCustomerSearch(customers, searchValue);

  // Find the selected customer
  const selectedCustomer = customers.find(customer => customer.id === value);

  // Debounced search to improve performance
  const debouncedSearch = useCallback((query: string) => {
    const timer = setTimeout(() => {
      setSearchValue(query);
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback((query: string) => {
    setInternalSearchValue(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Reset search when dropdown opens/closes
  useEffect(() => {
    if (!open) {
      setSearchValue("");
      setInternalSearchValue("");
    }
  }, [open]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return debouncedSearch("");
  }, [debouncedSearch]);

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
            <CommandEmpty>No customers found.</CommandEmpty>
            <CommandGroup>
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => {
                    onValueChange(customer.id === value ? "" : customer.id);
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