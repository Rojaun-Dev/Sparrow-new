'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompanyContextType {
  companyId: string | null;
  companyName: string | null;
  companySubdomain: string | null;
  companyLogo: string | null;
  isLoading: boolean;
}

const defaultContext: CompanyContextType = {
  companyId: null,
  companyName: null,
  companySubdomain: null,
  companyLogo: null,
  isLoading: true,
};

const CompanyContext = createContext<CompanyContextType>(defaultContext);

export const useCompanyContext = () => useContext(CompanyContext);

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider = ({ children }: CompanyProviderProps) => {
  const [companyContext, setCompanyContext] = useState<CompanyContextType>(defaultContext);

  useEffect(() => {
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
            isLoading: false,
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

        let detectedSubdomain = companyParam || subdomainFromHost;

        // Normalize by removing '-client' suffix if present
        if (detectedSubdomain && detectedSubdomain.endsWith('-client')) {
          detectedSubdomain = detectedSubdomain.replace(/-client$/, '');
        }

        if (detectedSubdomain) {
          // Fetch company information from API
          const apiUrl = process.env.NEXT_PUBLIC_API_URL
            ? `${process.env.NEXT_PUBLIC_API_URL}/companies/by-subdomain/${detectedSubdomain}`
            : `/api/company/by-subdomain/${detectedSubdomain}`;
          const response = await fetch(apiUrl);

          if (response.ok) {
            const company = await response.json();
            setCompanyContext({
              companyId: company.id,
              companyName: company.name,
              companySubdomain: company.subdomain,
              companyLogo: company.logo,
              isLoading: false,
            });
            return;
          }
        }

        // No company detected
        setCompanyContext({
          ...defaultContext,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error detecting company:', error);
        setCompanyContext({
          ...defaultContext,
          isLoading: false,
        });
      }
    };

    // Run detection on component mount
    detectCompany();
  }, []);

  return (
    <CompanyContext.Provider value={companyContext}>
      {children}
    </CompanyContext.Provider>
  );
}; 