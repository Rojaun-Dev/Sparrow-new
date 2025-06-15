'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompanyContextType {
  companyId: string | null;
  companyName: string | null;
  companySubdomain: string | null;
  companyLogo: string | null;
  companyBanner: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const defaultContext: CompanyContextType = {
  companyId: null,
  companyName: null,
  companySubdomain: null,
  companyLogo: null,
  companyBanner: null,
  isLoading: true,
  refetch: async () => {}
};

const CompanyContext = createContext<CompanyContextType>(defaultContext);

export const useCompanyContext = () => useContext(CompanyContext);

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider = ({ children }: CompanyProviderProps) => {
  const [companyContext, setCompanyContext] = useState<CompanyContextType>(defaultContext);
  const [urlPath, setUrlPath] = useState<string>('');
  const [urlParams, setUrlParams] = useState<string>('');

  // Function to detect company information
  const detectCompany = async () => {
    try {
      // Check for company information from response headers (set by middleware)
      const companyId = document.head.querySelector('meta[name="x-company-id"]')?.getAttribute('content');
      const companyName = document.head.querySelector('meta[name="x-company-name"]')?.getAttribute('content');
      const companySubdomain = document.head.querySelector('meta[name="x-company-subdomain"]')?.getAttribute('content');

      if (companyId && companyName && companySubdomain) {
        // Company detected from middleware
        setCompanyContext({
          companyId,
          companyName,
          companySubdomain,
          companyLogo: null, // Will need to fetch the logo
          companyBanner: null,
          isLoading: false,
          refetch: detectCompany
        });
        return;
      }

      // Method 1: Check URL for company parameter
      const urlParams = new URLSearchParams(window.location.search);
      const companyParam = urlParams.get('company');

      // Method 2: Check subdomain
      const hostname = window.location.hostname;
      const hostParts = hostname.split('.');
      const subdomainFromHost = hostParts.length >= 3 && hostParts[0] !== 'www' ? hostParts[0] : null;

      const detectedSubdomain = companyParam || subdomainFromHost;

      if (detectedSubdomain) {
        // Fetch company information from API
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/companies/by-subdomain/${detectedSubdomain}`;
        const response = await fetch(apiUrl);

        if (response.ok) {
          const company = await response.json();
          setCompanyContext({
            companyId: company.id,
            companyName: company.name,
            companySubdomain: company.subdomain,
            companyLogo: company.logo,
            companyBanner: company.banner || null,
            isLoading: false,
            refetch: detectCompany
          });
          return;
        }
      }

      // No company detected
      setCompanyContext({
        ...defaultContext,
        isLoading: false,
        refetch: detectCompany
      });
    } catch (error) {
      console.error('Error detecting company:', error);
      setCompanyContext({
        ...defaultContext,
        isLoading: false,
        refetch: detectCompany
      });
    }
  };

  // Update URL tracking for changes
  useEffect(() => {
    const checkUrlChanges = () => {
      const currentPath = window.location.pathname;
      const currentParams = window.location.search;
      
      if (currentPath !== urlPath || currentParams !== urlParams) {
        setUrlPath(currentPath);
        setUrlParams(currentParams);
        detectCompany();
      }
    };

    // Initial check
    checkUrlChanges();

    // Set up listener for URL changes
    window.addEventListener('popstate', checkUrlChanges);
    
    // Check periodically (Next.js client routing might not trigger popstate)
    const interval = setInterval(checkUrlChanges, 300);

    return () => {
      window.removeEventListener('popstate', checkUrlChanges);
      clearInterval(interval);
    };
  }, [urlPath, urlParams]);

  // Initial company detection
  useEffect(() => {
    // Run detection on component mount
    detectCompany();
  }, []);

  return (
    <CompanyContext.Provider value={companyContext}>
      {children}
    </CompanyContext.Provider>
  );
}; 