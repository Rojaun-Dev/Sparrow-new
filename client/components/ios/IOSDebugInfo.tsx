'use client';

import { useEffect, useState } from 'react';
import { isIOSMobile, getStoredParentWebsiteUrl } from '@/lib/utils/iframe-detection';

/**
 * Debug component that displays iOS parent URL info on screen for mobile testing
 * Only shows in development mode and on iOS devices
 */
export function IOSDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<{
    isIOS: boolean;
    parentUrl: string | null;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const isIOS = isIOSMobile();
    
    // Only show for iOS devices
    if (!isIOS) {
      return;
    }

    const parentUrl = getStoredParentWebsiteUrl();
    
    setDebugInfo({
      isIOS,
      parentUrl,
      timestamp: new Date().toLocaleTimeString()
    });

    // Update every 5 seconds to track changes
    const interval = setInterval(() => {
      const currentParentUrl = getStoredParentWebsiteUrl();
      setDebugInfo(prev => ({
        isIOS,
        parentUrl: currentParentUrl,
        timestamp: new Date().toLocaleTimeString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Don't render in production or on non-iOS devices
  if (process.env.NODE_ENV !== 'development' || !debugInfo) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
        wordBreak: 'break-all'
      }}
    >
      <div><strong>iOS Debug Info</strong></div>
      <div>iOS Device: {debugInfo.isIOS ? '✅' : '❌'}</div>
      <div>Parent URL: {debugInfo.parentUrl ? '✅' : '❌'}</div>
      {debugInfo.parentUrl && (
        <div style={{ marginTop: '4px', fontSize: '10px' }}>
          {debugInfo.parentUrl}
        </div>
      )}
      <div style={{ marginTop: '4px', opacity: 0.7 }}>
        Last check: {debugInfo.timestamp}
      </div>
    </div>
  );
}