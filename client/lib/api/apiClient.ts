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
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Set up request interceptors
    this.client.interceptors.request.use(
      (config) => {
        // Get token from localStorage 
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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

  // Get token from localStorage
  public getToken(): string | null {
    if (typeof window !== 'undefined') {
      // First try to get from localStorage (backward compatibility)
      const token = localStorage.getItem('token');
      
      // If not in localStorage but in cookies, update localStorage
      if (!token) {
        const cookieToken = Cookies.get('token');
        if (cookieToken) {
          localStorage.setItem('token', cookieToken);
          return cookieToken;
        }
      }
      
      return token;
    }
    return null;
  }

  // Set token in localStorage and cookie
  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      // Store in localStorage for existing code
      localStorage.setItem('token', token);
      
      // Also store in cookie for middleware to access
      // Set secure and httpOnly for production
      const isProduction = process.env.NODE_ENV === 'production';
      Cookies.set('token', token, { 
        expires: 7, // 7 days
        path: '/',
        secure: isProduction,
        sameSite: 'strict'
      });
    }
  }

  // Remove token from localStorage and cookie
  public removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Also remove from cookies
      Cookies.remove('token');
      Cookies.remove('refreshToken');
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
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient(); 