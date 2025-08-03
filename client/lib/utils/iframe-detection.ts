/**
 * Utility functions for detecting iframe and mobile iOS contexts
 * Used to handle iOS mobile iframe redirection workaround
 */

/**
 * Detects if the current page is running inside an iframe
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions,
    // we're likely in an iframe
    return true;
  }
}

/**
 * Detects if the current device is a mobile iOS device (iPhone/iPod)
 */
export function isIOSMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  // Check for iPhone or iPod (mobile devices)
  return /iphone|ipod/.test(userAgent);
}

/**
 * Detects if the current context is an iOS mobile device within an iframe
 * This is the problematic scenario we need to handle
 */
export function isIOSMobileInIframe(): boolean {
  return isIOSMobile() && isInIframe();
}

/**
 * Gets the parent website URL from document.referrer if available
 */
export function getParentWebsiteUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    if (document.referrer) {
      const referrerUrl = new URL(document.referrer);
      // Only return if it's a different origin than current
      if (referrerUrl.origin !== window.location.origin) {
        return referrerUrl.href;
      }
    }
  } catch (e) {
    console.warn('Error parsing document.referrer:', e);
  }
  
  return null;
}

/**
 * Gets parent URL from cookie (set by middleware) or URL parameter (fallback)
 */
export function getParentUrlFromCookieOrUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // First, try to get from cookie (set by middleware)
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'ios_parent_url') {
        const parentUrl = decodeURIComponent(value);
        console.log('Found parent URL in cookie:', parentUrl);
        return parentUrl;
      }
    }
    
    // Fallback: try URL parameters (for direct access)
    const urlParams = new URLSearchParams(window.location.search);
    const parentUrlFromParam = urlParams.get('parent_url');
    if (parentUrlFromParam) {
      console.log('Found parent URL in URL parameter:', parentUrlFromParam);
      return parentUrlFromParam;
    }
    
    return null;
  } catch (e) {
    console.warn('Error getting parent URL from cookie or URL:', e);
    return null;
  }
}

/**
 * Stores the parent website URL in sessionStorage for iOS iframe users
 */
export function storeParentWebsiteUrl(parentUrl: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem('ios_parent_url', parentUrl);
    console.log('Stored parent URL for iOS iframe user:', parentUrl);
  } catch (e) {
    console.warn('Error storing parent URL:', e);
  }
}

/**
 * Clears the parent URL cookie
 */
export function clearParentUrlCookie(): void {
  if (typeof window === 'undefined') return;
  
  try {
    document.cookie = 'ios_parent_url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    console.log('Cleared parent URL cookie');
  } catch (e) {
    console.warn('Error clearing parent URL cookie:', e);
  }
}

/**
 * Gets the stored parent website URL from sessionStorage
 */
export function getStoredParentWebsiteUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return sessionStorage.getItem('ios_parent_url');
  } catch (e) {
    console.warn('Error retrieving stored parent URL:', e);
    return null;
  }
}

/**
 * Removes the stored parent website URL from sessionStorage
 */
export function clearStoredParentWebsiteUrl(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem('ios_parent_url');
  } catch (e) {
    console.warn('Error clearing stored parent URL:', e);
  }
}

/**
 * Redirects iOS mobile iframe users to the main application dashboard
 * Used as a workaround for iOS iframe token validation issues
 * Includes token in URL for proper authentication
 */
export function redirectIOSMobileToMainApp(dashboardPath: string, parentUrl?: string): void {
  if (!isIOSMobileInIframe()) return;
  
  try {
    // Get the authentication token from available sources
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('ios_iframe_token') ||
                  sessionStorage.getItem('token');
    
    if (!token) {
      console.error('No token found for iOS mobile iframe redirect');
      // Redirect to login if no token is available
      window.top!.location.href = `${window.location.origin}/`;
      return;
    }
    
    // Create URL with token parameter for iOS iframe handling
    const url = new URL(dashboardPath, window.location.origin);
    url.searchParams.set('ios_token', token);
    
    // Add parent URL if provided, or try to detect it
    const finalParentUrl = parentUrl || getParentWebsiteUrl();
    if (finalParentUrl) {
      url.searchParams.set('parent_url', finalParentUrl);
    }
    
    const mainAppUrl = url.toString();
    console.log('Redirecting iOS mobile iframe user to main app with token and parent URL');
    
    // Break out of iframe and redirect to main app with token
    window.top!.location.href = mainAppUrl;
  } catch (e) {
    console.error('Error redirecting iOS mobile iframe user:', e);
    // Fallback: open in new window if we can't access window.top
    const token = localStorage.getItem('token') || sessionStorage.getItem('ios_iframe_token');
    const finalParentUrl = parentUrl || getParentWebsiteUrl();
    
    let fallbackUrl = token 
      ? `${window.location.origin}${dashboardPath}?ios_token=${token}`
      : `${window.location.origin}/`;
    
    if (finalParentUrl) {
      const fallbackUrlObj = new URL(fallbackUrl);
      fallbackUrlObj.searchParams.set('parent_url', finalParentUrl);
      fallbackUrl = fallbackUrlObj.toString();
    }
    
    window.open(fallbackUrl, '_blank');
  }
}