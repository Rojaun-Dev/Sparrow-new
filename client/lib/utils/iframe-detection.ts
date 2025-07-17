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
 */
export function redirectIOSMobileToMainApp(dashboardPath: string): void {
  if (!isIOSMobileInIframe()) return;
  
  try {
    // Get the main application URL with the dashboard path
    const mainAppUrl = `${window.location.origin}${dashboardPath}`;
    
    // Break out of iframe and redirect to main app
    window.top!.location.href = mainAppUrl;
  } catch (e) {
    // Fallback: open in new window if we can't access window.top
    console.warn('Could not redirect to main app, opening in new window');
    window.open(`${window.location.origin}${dashboardPath}`, '_blank');
  }
}