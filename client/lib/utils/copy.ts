/**
 * Iframe-safe copy utility functions
 * Provides fallback copy methods that work in iframe contexts where navigator.clipboard may be restricted
 */

import { isInIframe } from './iframe-detection';

/**
 * Result of a copy operation
 */
export interface CopyResult {
  success: boolean;
  method: 'clipboard' | 'execCommand' | 'manual' | 'failed';
  error?: string;
}

/**
 * Attempts to copy text to clipboard using multiple fallback methods
 * Works in both regular browser contexts and iframe environments
 */
export async function copyTextToClipboard(text: string): Promise<CopyResult> {
  if (!text) {
    return {
      success: false,
      method: 'failed',
      error: 'No text provided to copy'
    };
  }

  // Method 1: Try modern Clipboard API (works in most modern browsers, not in many iframes)
  if (navigator.clipboard && !isInIframe()) {
    try {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        method: 'clipboard'
      };
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
    }
  }

  // Method 2: Try legacy document.execCommand (works in iframes)
  try {
    const result = await copyWithExecCommand(text);
    if (result.success) {
      return result;
    }
  } catch (error) {
    console.warn('execCommand failed, trying manual fallback:', error);
  }

  // Method 3: Manual selection fallback (for iOS and other restricted environments)
  try {
    const result = copyWithManualSelection(text);
    return result;
  } catch (error) {
    console.error('All copy methods failed:', error);
    return {
      success: false,
      method: 'failed',
      error: 'Copy not supported in this environment'
    };
  }
}

/**
 * Copy using the legacy document.execCommand method
 * This method works in most iframe contexts
 */
function copyWithExecCommand(text: string): Promise<CopyResult> {
  return new Promise((resolve) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('tabindex', '-1');

    document.body.appendChild(textArea);
    
    try {
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        resolve({
          success: true,
          method: 'execCommand'
        });
      } else {
        resolve({
          success: false,
          method: 'failed',
          error: 'execCommand copy failed'
        });
      }
    } catch (error) {
      document.body.removeChild(textArea);
      resolve({
        success: false,
        method: 'failed',
        error: error instanceof Error ? error.message : 'Unknown execCommand error'
      });
    }
  });
}

/**
 * Manual selection method - creates a visible input for user to copy manually
 * This is the ultimate fallback for environments where programmatic copy is not allowed
 */
function copyWithManualSelection(text: string): CopyResult {
  const input = document.createElement('input');
  input.value = text;
  input.style.position = 'fixed';
  input.style.left = '50%';
  input.style.top = '50%';
  input.style.transform = 'translate(-50%, -50%)';
  input.style.zIndex = '10000';
  input.style.padding = '10px';
  input.style.border = '2px solid #007bff';
  input.style.borderRadius = '4px';
  input.style.fontSize = '16px';
  input.setAttribute('readonly', '');

  document.body.appendChild(input);
  
  try {
    input.focus();
    input.select();
    input.setSelectionRange(0, text.length);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 5000);
    
    return {
      success: true,
      method: 'manual'
    };
  } catch (error) {
    if (document.body.contains(input)) {
      document.body.removeChild(input);
    }
    return {
      success: false,
      method: 'failed',
      error: error instanceof Error ? error.message : 'Manual selection failed'
    };
  }
}

/**
 * User-friendly copy function that provides appropriate feedback messages
 */
export async function copyTextWithFeedback(text: string): Promise<{
  success: boolean;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}> {
  const result = await copyTextToClipboard(text);
  
  if (result.success) {
    switch (result.method) {
      case 'clipboard':
        return {
          success: true,
          title: 'Copied to clipboard',
          description: 'Text has been copied to your clipboard'
        };
      case 'execCommand':
        return {
          success: true,
          title: 'Copied to clipboard',
          description: 'Text has been copied to your clipboard'
        };
      case 'manual':
        return {
          success: true,
          title: 'Text selected',
          description: 'Text is selected - press Ctrl+C (or Cmd+C) to copy'
        };
      default:
        return {
          success: true,
          title: 'Copy completed',
          description: 'Text has been prepared for copying'
        };
    }
  } else {
    return {
      success: false,
      title: 'Copy failed',
      description: result.error || 'Unable to copy text in this environment',
      variant: 'destructive'
    };
  }
}