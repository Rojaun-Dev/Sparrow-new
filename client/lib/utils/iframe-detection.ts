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
 * Redirects iOS mobile iframe users to the main application dashboard
 * Used as a workaround for iOS iframe token validation issues
 * Includes token in URL for proper authentication
 */
export function redirectIOSMobileToMainApp(dashboardPath: string): void {
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
    
    const mainAppUrl = url.toString();
    console.log('Redirecting iOS mobile iframe user to main app with token');
    
    // Break out of iframe and redirect to main app with token
    window.top!.location.href = mainAppUrl;
  } catch (e) {
    console.error('Error redirecting iOS mobile iframe user:', e);
    // Fallback: open in new window if we can't access window.top
    const token = localStorage.getItem('token') || sessionStorage.getItem('ios_iframe_token');
    const fallbackUrl = token 
      ? `${window.location.origin}${dashboardPath}?ios_token=${token}`
      : `${window.location.origin}/`;
    
    window.open(fallbackUrl, '_blank');
  }
}