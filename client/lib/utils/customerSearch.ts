import React, { useMemo, useCallback } from 'react';

// Customer interface that can be extended as needed
export interface SearchableCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  prefId?: string;
  phone?: string;
  [key: string]: any; // Allow additional properties
}

// Search configuration options
export interface CustomerSearchOptions {
  searchByName?: boolean;
  searchByEmail?: boolean;
  searchByPrefId?: boolean;
  searchByPhone?: boolean;
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

// Default search options
export const DEFAULT_SEARCH_OPTIONS: CustomerSearchOptions = {
  searchByName: true,
  searchByEmail: true,
  searchByPrefId: true,
  searchByPhone: false,
  caseSensitive: false,
  exactMatch: false,
};

/**
 * Core customer search function
 * Filters customers based on search criteria and options
 */
export function filterCustomers(
  customers: SearchableCustomer[],
  searchQuery: string,
  options: CustomerSearchOptions = DEFAULT_SEARCH_OPTIONS
): SearchableCustomer[] {
  if (!searchQuery?.trim()) return customers;

  const query = options.caseSensitive 
    ? searchQuery.trim() 
    : searchQuery.toLowerCase().trim();

  return customers.filter(customer => {
    const searchFields: string[] = [];

    // Build search fields array based on options
    if (options.searchByName) {
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      if (fullName) {
        searchFields.push(options.caseSensitive ? fullName : fullName.toLowerCase());
        // Also add individual name parts
        if (customer.firstName) {
          searchFields.push(options.caseSensitive ? customer.firstName : customer.firstName.toLowerCase());
        }
        if (customer.lastName) {
          searchFields.push(options.caseSensitive ? customer.lastName : customer.lastName.toLowerCase());
        }
      }
    }

    if (options.searchByEmail && customer.email) {
      searchFields.push(options.caseSensitive ? customer.email : customer.email.toLowerCase());
    }

    if (options.searchByPrefId && customer.prefId) {
      searchFields.push(options.caseSensitive ? customer.prefId : customer.prefId.toLowerCase());
    }

    if (options.searchByPhone && customer.phone) {
      searchFields.push(options.caseSensitive ? customer.phone : customer.phone.toLowerCase());
    }

    // Check if query matches any field
    return searchFields.some(field => {
      return options.exactMatch 
        ? field === query 
        : field.includes(query);
    });
  });
}

/**
 * React hook for customer searching with memoization
 * Provides optimized customer filtering with configurable options
 */
export function useCustomerSearch(
  customers: SearchableCustomer[],
  searchQuery: string,
  options: CustomerSearchOptions = DEFAULT_SEARCH_OPTIONS
) {
  const filteredCustomers = useMemo(() => {
    return filterCustomers(customers, searchQuery, options);
  }, [customers, searchQuery, options]);

  return filteredCustomers;
}

/**
 * Format customer display text
 * Handles missing data gracefully and provides consistent formatting
 */
export function formatCustomerDisplay(
  customer: SearchableCustomer,
  options: {
    showPrefId?: boolean;
    showEmail?: boolean;
    isCompact?: boolean;
  } = {}
): string {
  const { showPrefId = true, showEmail = true, isCompact = false } = options;
  
  const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  const displayName = name || 'Unnamed Customer';
  
  if (isCompact) {
    return displayName;
  }
  
  const parts = [displayName];
  
  if (showPrefId && customer.prefId?.trim()) {
    parts.push(`(${customer.prefId})`);
  }
  
  if (showEmail && customer.email?.trim()) {
    parts.push(`- ${customer.email}`);
  }
  
  return parts.join(' ');
}

/**
 * Get customer search suggestions based on partial query
 * Useful for autocomplete functionality
 */
export function getCustomerSearchSuggestions(
  customers: SearchableCustomer[],
  searchQuery: string,
  maxSuggestions: number = 5,
  options: CustomerSearchOptions = DEFAULT_SEARCH_OPTIONS
): string[] {
  if (!searchQuery?.trim()) return [];

  const query = options.caseSensitive 
    ? searchQuery.trim() 
    : searchQuery.toLowerCase().trim();

  const suggestions = new Set<string>();

  customers.forEach(customer => {
    // Add name suggestions
    if (options.searchByName) {
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      if (fullName && (options.caseSensitive ? fullName : fullName.toLowerCase()).includes(query)) {
        suggestions.add(fullName);
      }
      
      if (customer.firstName && (options.caseSensitive ? customer.firstName : customer.firstName.toLowerCase()).includes(query)) {
        suggestions.add(customer.firstName);
      }
      
      if (customer.lastName && (options.caseSensitive ? customer.lastName : customer.lastName.toLowerCase()).includes(query)) {
        suggestions.add(customer.lastName);
      }
    }

    // Add email suggestions
    if (options.searchByEmail && customer.email) {
      const email = options.caseSensitive ? customer.email : customer.email.toLowerCase();
      if (email.includes(query)) {
        suggestions.add(customer.email);
      }
    }

    // Add prefId suggestions
    if (options.searchByPrefId && customer.prefId) {
      const prefId = options.caseSensitive ? customer.prefId : customer.prefId.toLowerCase();
      if (prefId.includes(query)) {
        suggestions.add(customer.prefId);
      }
    }
  });

  return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Validate customer search query
 * Returns validation result and error message if applicable
 */
export function validateSearchQuery(
  query: string,
  minLength: number = 1,
  maxLength: number = 100
): { isValid: boolean; error?: string } {
  if (!query?.trim()) {
    return { isValid: false, error: 'Search query cannot be empty' };
  }

  const trimmed = query.trim();
  
  if (trimmed.length < minLength) {
    return { isValid: false, error: `Search query must be at least ${minLength} character(s)` };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Search query cannot exceed ${maxLength} characters` };
  }

  return { isValid: true };
}

/**
 * Debounced search hook
 * Delays search execution to improve performance
 */
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => T,
  delay: number = 300
): {
  debouncedSearch: (query: string) => void;
  isSearching: boolean;
  result: T | null;
} {
  const [isSearching, setIsSearching] = React.useState(false);
  const [result, setResult] = React.useState<T | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback((query: string) => {
    setIsSearching(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const searchResult = searchFunction(query);
      setResult(searchResult);
      setIsSearching(false);
    }, delay);
  }, [searchFunction, delay]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedSearch, isSearching, result };
}