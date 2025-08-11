'use client';

import React, { useState, useMemo } from 'react';
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

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  prefId?: string;
  phone?: string;
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

  // Filter customers based on search input
  const filteredCustomers = useMemo(() => {
    if (!searchValue) return customers;
    
    const search = searchValue.toLowerCase();
    return customers.filter(customer => {
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const email = customer.email.toLowerCase();
      const prefId = customer.prefId?.toLowerCase() || '';
      
      return fullName.includes(search) || 
             email.includes(search) || 
             prefId.includes(search);
    });
  }, [customers, searchValue]);

  // Find the selected customer
  const selectedCustomer = customers.find(customer => customer.id === value);

  // Format customer display text
  const formatCustomerDisplay = (customer: Customer, isSelected = false) => {
    const name = `${customer.firstName} ${customer.lastName}`;
    if (isSelected) {
      return name;
    }
    
    const parts = [name];
    if (customer.prefId) {
      parts.push(`(${customer.prefId})`);
    }
    parts.push(`- ${customer.email}`);
    
    return parts.join(' ');
  };

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
                {formatCustomerDisplay(selectedCustomer, true)}
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
            value={searchValue}
            onValueChange={setSearchValue}
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
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{customer.email}</span>
                      {customer.prefId && (
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