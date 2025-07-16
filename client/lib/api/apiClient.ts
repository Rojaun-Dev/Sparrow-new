import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from './types';
import Cookies from 'js-cookie';

// Define error types for better handling
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// API constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create a base API client class
export class ApiClient {
  client: AxiosInstance; // Changed to public for debugging
  private baseUrl: string;

  constructor() {
    // Get API URL from environment variables or use default
    this.baseUrl = API_BASE_URL;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      // Do not set a default Content-Type header here.
      // Axios will automatically set the correct header based on the request data.
      // Additional default headers (like Accept) can be added here if needed.
    });

    // Set up request interceptors
    this.client.interceptors.request.use(
      (config) => {
        // Get token from localStorage 
        const token = this.getToken();
        if (token) {
          // Ensure headers object exists
          config.headers = config.headers || {};
          // Set Authorization header with Bearer token
          config.headers.Authorization = `Bearer ${token}`;
          
          // For iOS iframe contexts, also add token as custom header
          // This helps with middleware token detection when cookies are blocked
          if (this.isIOSInIframe()) {
            config.headers['X-Auth-Token'] = token;
            console.log('iOS iframe - Adding X-Auth-Token header');
          }
          
          console.log('Adding token to request:', token.substring(0, 10) + '...');
        } else {
          console.warn('No token found for request');
        }

        // Add company ID to every request for multi-tenant isolation
        // This will be implemented when company context is available
        // if (companyId) {
        //   config.headers['X-Company-ID'] = companyId;
        // }

        return config;
      },
      (error) => Promise.reject(this.handleError(error))
    );

    // Set up response interceptors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.handleError(error))
    );
  }

  // Detect iOS devices in iframe contexts
  private isIOSInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check if we're in an iframe
    const isIframe = window.parent !== window;
    
    // Check if we're on iOS (covers Safari, Chrome, Firefox on iOS)
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    
    return isIOS && isIframe;
  }

  // Get token from localStorage
  public getToken(): string | null {
    if (typeof window !== 'undefined') {
      // First try to get from localStorage (backward compatibility)
      let token = localStorage.getItem('token');
      
      // For iOS iframe contexts, check sessionStorage first
      if (!token && this.isIOSInIframe()) {
        token = sessionStorage.getItem('ios_iframe_token');
        if (token) {
          localStorage.setItem('token', token);
          return token;
        }
      }
      
      // If not in localStorage but in cookies, update localStorage
      // This creates a bridge between cookies (needed for middleware/server) 
      // and localStorage (used by client-side code)
      if (!token) {
        const cookieToken = Cookies.get('token');
        if (cookieToken) {
          localStorage.setItem('token', cookieToken);
          token = cookieToken;
        }
      }
      
      // For iframe environments, try additional token synchronization
      if (!token && window.parent !== window) {
        try {
          // Check if parent has token information we can use
          // This is a fallback for iframe scenarios where cookies might not work
          const parentToken = sessionStorage.getItem('parentToken');
          if (parentToken) {
            localStorage.setItem('token', parentToken);
            token = parentToken;
          }
        } catch (error) {
          // Silent fail for cross-origin restrictions
        }
      }
      
      return token;
    }
    return null;
  }

  // Set token in localStorage and cookie
  public setToken(token: string, rememberMe = false): void {
    if (typeof window !== 'undefined') {
      // Store in localStorage for existing code that depends on it
      localStorage.setItem('token', token);
      
      // For iOS iframe contexts, cookies are blocked so we rely on localStorage + headers
      if (this.isIOSInIframe()) {
        console.log('iOS iframe detected - cookies will be blocked, using localStorage only');
        sessionStorage.setItem('ios_iframe_token', token);
        
        // Try to communicate with parent window for navigation
        try {
          if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
              type: 'SPARROW_AUTH_SUCCESS',
              token: token,
              timestamp: Date.now()
            }, '*');
            console.log('Sent auth success message to parent window');
          }
        } catch (error) {
          console.warn('Failed to communicate with parent window:', error);
        }
        return;
      }
      
      // Also store in cookie for middleware to access 
      // Middleware runs on the server and can't access localStorage,
      // but can access cookies sent with the request
      const isProduction = process.env.NODE_ENV === 'production';
      const isSecure = window.location.protocol === 'https:';
      
      // Use longer expiration for "remember me" option
      const expirationDays = rememberMe ? 30 : 7;

      // Try multiple cookie strategies for iframe compatibility
      const cookieOptions = {
        expires: expirationDays,
        path: '/',
        secure: isSecure,
        sameSite: 'none' as const
      };

      // Primary attempt with SameSite=None for iframe support
      try {
        Cookies.set('token', token, cookieOptions);
        console.log('Cookie set successfully with SameSite=None');
      } catch (error) {
        console.warn('Failed to set SameSite=None cookie, trying fallback:', error);
        
        // Fallback for browsers that don't support SameSite=None
        try {
          Cookies.set('token', token, {
            expires: expirationDays,
            path: '/',
            secure: isSecure,
            sameSite: 'lax' as const
          });
          console.log('Cookie set successfully with SameSite=Lax');
        } catch (fallbackError) {
          console.warn('Failed to set SameSite=Lax cookie, trying without SameSite:', fallbackError);
          
          // Final fallback - no SameSite specified
          Cookies.set('token', token, {
            expires: expirationDays,
            path: '/',
            secure: isSecure
          });
          console.log('Cookie set successfully without SameSite');
        }
      }
      
      // Verify cookie was set
      const cookieCheck = Cookies.get('token');
      if (cookieCheck) {
        console.log('Cookie verification successful');
      } else {
        console.error('Cookie verification failed - token not found after setting');
      }
      
      // For iframe environments, also try setting with document.cookie as a backup
      if (window.parent !== window) {
        try {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + expirationDays);
          document.cookie = `token=${token}; expires=${expirationDate.toUTCString()}; path=/; ${isSecure ? 'secure;' : ''} samesite=none`;
          
          // Also store in sessionStorage for iframe fallback
          sessionStorage.setItem('parentToken', token);
        } catch (docCookieError) {
          console.warn('Failed to set iframe cookie with document.cookie:', docCookieError);
        }
      }
    }
  }

  // Remove token from localStorage and cookie
  public removeToken(): void {
    if (typeof window !== 'undefined') {
      console.log('Removing tokens from storage and cookies');
      
      // Clear from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // For iOS iframe contexts, also clear sessionStorage
      if (this.isIOSInIframe()) {
        sessionStorage.removeItem('ios_iframe_token');
        sessionStorage.removeItem('parentToken');
        
        // Notify parent window of logout
        try {
          if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
              type: 'SPARROW_TOKEN_REMOVED',
              timestamp: Date.now()
            }, '*');
            console.log('Sent logout message to parent window');
          }
        } catch (error) {
          console.warn('Failed to notify parent window of logout:', error);
        }
      }
      
      // Also remove from cookies - important to use same path/domain options as when setting
      // Otherwise cookie deletion might not work if paths don't match
      Cookies.remove('token', {
        path: '/',
        secure: true,
        sameSite: 'none'
      });
      
      Cookies.remove('refreshToken', {
        path: '/',
        secure: true,
        sameSite: 'none'
      });
      
      // Double-check cookies were removed - an additional safety check
      // Sometimes cookies don't get removed due to browser quirks,
      // so we add this verification step
      const tokenStillExists = Cookies.get('token');
      if (tokenStillExists) {
        console.warn('Cookie removal failed! Trying alternative method...');
        // Fallback: overwrite with expired cookie
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      console.log('Token removal complete. Token cookie exists:', !!Cookies.get('token'));
    }
  }

  // Error handling helper
  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const responseData = error.response.data as any;
      return {
        status: error.response.status,
        message: responseData?.message || 'An error occurred with the server response',
        details: responseData
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        status: 0,
        message: 'No response received from server',
        details: error.request
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        status: 0,
        message: error.message || 'An error occurred while setting up the request',
        details: error
      };
    }
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse = await this.client.request(config);
      console.log(`Response from ${config.url}:`, response.data);
      
      // If there's no data at all, return an empty object or array
      if (!response.data) {
        console.warn(`No data in response from ${config.url}`);
        return (Array.isArray(response.data) ? [] : {}) as T;
      }
      
      // If the response is already in the format we expect
      if (!(response.data.success !== undefined && response.data.data !== undefined)) {
        return response.data as T;
      }
      
      // Standard API response format with { success, data }
      if (response.data.success && response.data.data !== undefined) {
        // Return just the data property
        return response.data.data as T;
      }
      
      // If success is false, throw an error
      if (response.data.success === false) {
        throw {
          status: response.status,
          message: response.data.message || 'API request failed',
          details: response.data
        };
      }
      
      // Default case - return the whole response data
      return response.data as T;
    } catch (error) {
      console.error(`Request error for ${config.url}:`, error);
      throw error;
    }
  }

  // Convenience methods for different HTTP verbs
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log(`Making DELETE request to: ${url}`, config);
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // Download a file (CSV/blob) from a GET endpoint
  async downloadFile(url: string, params?: any): Promise<Blob> {
    const response = await this.client.get(url, {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  }
}

// Create a singleton instance
export const apiClient = new ApiClient(); 