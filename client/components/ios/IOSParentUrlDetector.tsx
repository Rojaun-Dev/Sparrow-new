'use client';

import { useIOSParentUrl } from '@/hooks/useIOSParentUrl';

/**
 * Client component to detect and store iOS parent URL
 * Can be used in any layout or page to ensure parent URL is captured
 */
export function IOSParentUrlDetector() {
  // This hook runs the parent URL detection logic
  useIOSParentUrl();
  
  // This component doesn't render anything visible
  return null;
}