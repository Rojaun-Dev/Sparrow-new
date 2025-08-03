'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  isIOSMobile, 
  getParentUrlFromCookieOrUrl, 
  storeParentWebsiteUrl 
} from '@/lib/utils/iframe-detection';

/**
 * Global hook to detect and store iOS parent URL across all pages
 * This ensures parent URL is available for logout redirect regardless of which page user logs out from
 */
export function useIOSParentUrl() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run on iOS devices
    if (!isIOSMobile()) {
      return;
    }

    // Check for parent URL from cookie (set by middleware) or URL parameters (fallback)
    const parentUrl = getParentUrlFromCookieOrUrl();
    
    if (parentUrl) {
      // Store the parent URL for later use during logout
      storeParentWebsiteUrl(parentUrl);
      console.log('Global iOS parent URL detection - stored:', parentUrl);
      
      // Log additional context for debugging
      const currentPath = window.location.pathname;
      const hasIOSToken = searchParams.get('ios_token');
      
      if (hasIOSToken) {
        console.log(`iOS parent URL stored on ${currentPath} with ios_token - likely redirected from iframe`);
      } else {
        console.log(`iOS parent URL stored on ${currentPath} from cookie/existing storage`);
      }
    } else {
      console.log('Global iOS parent URL detection - no parent URL found on', window.location.pathname);
    }
  }, [searchParams]);

  // Return current stored parent URL for debugging purposes
  const getStoredParentUrl = () => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem('ios_parent_url');
    } catch {
      return null;
    }
  };

  return {
    storedParentUrl: getStoredParentUrl()
  };
}