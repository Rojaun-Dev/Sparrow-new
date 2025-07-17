import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Define the route access map with proper type
const ROUTE_ACCESS_MAP: Record<string, string[]> = {
  '/customer': ['customer'],
  '/admin': ['admin_l1', 'admin_l2'],
  '/superadmin': ['super_admin'],
};

// Cache for company lookups to avoid repeated API calls
const companyCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Optimized function to detect company information from the request
function detectCompanyFromRequest(request: NextRequest) {
  const url = request.nextUrl;
  let companySubdomain = null;

  // Method 1: Check for subdomain
  const hostname = request.headers.get('host') || '';
  const hostParts = hostname.split('.');
  
  // Handle localhost subdomains (e.g., express.localhost:3000)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    if (hostParts.length >= 2 && hostParts[1] === 'localhost') {
      companySubdomain = hostParts[0];
    }
  } else if (hostParts.length >= 3 && hostParts[0] !== 'www') {
    companySubdomain = hostParts[0];
  }

  // Method 2: Check for company parameter in URL
  if (!companySubdomain) {
    companySubdomain = url.searchParams.get('company');
  }

  return companySubdomain;
}

// Optimized async company lookup with caching and timeout
async function getCompanyDetails(subdomain: string) {
  const cacheKey = `company_${subdomain}`;
  const cached = companyCache.get(cacheKey);
  
  // Check cache first
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/companies/by-subdomain/${subdomain}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(apiUrl, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'max-age=300' // 5 minute cache
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const company = await response.json();
      // Cache the result
      companyCache.set(cacheKey, {
        data: company,
        timestamp: Date.now()
      });
      return company;
    }
  } catch (error) {
    // Silent fail - don't log in production to reduce overhead
    if (process.env.NODE_ENV === 'development') {
      console.error('Company lookup error:', error?.message || error);
    }
  }
  
  return null;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Early exit for public routes and static assets
  if (path.startsWith('/_next') || path.startsWith('/api/auth') || 
      path === '/favicon.ico' || path === '/unauthorized' || path === '/') {
    return NextResponse.next();
  }
  
  // Check if path needs to be protected
  const protectedPathPrefix = Object.keys(ROUTE_ACCESS_MAP).find(
    prefix => path === prefix || path.startsWith(`${prefix}/`)
  );
  
  let response = NextResponse.next();
  
  if (!protectedPathPrefix) {
    // Not a protected route, proceed with company headers if set
    return response;
  }

  // Get the token from multiple sources to handle iOS iframe issues
  const tokenFromCookie = request.cookies.get('token')?.value;
  const tokenFromAuthHeader = request.headers.get('Authorization')?.split(' ')[1] ||
                             request.headers.get('authorization')?.split(' ')[1];
  
  // Check for token in custom header (for iOS iframe contexts where cookies are blocked)
  const tokenFromCustomHeader = request.headers.get('x-auth-token');
  
  // Check for token in URL parameters (for iOS iframe navigation)
  const tokenFromUrl = request.nextUrl.searchParams.get('ios_token');
  
  // Check if this is an iOS iframe context by looking at User-Agent and headers
  const userAgent = request.headers.get('user-agent') || '';
  const isIOSUserAgent = /iPad|iPhone|iPod/.test(userAgent);
  const hasIOSToken = !!tokenFromUrl;
  
  const token = tokenFromCookie || tokenFromAuthHeader || tokenFromCustomHeader || tokenFromUrl;
  
  // Debug token sources in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware token check for path:', path);
    console.log('Token from cookie:', tokenFromCookie ? 'Present' : 'Missing');
    console.log('Token from auth header:', tokenFromAuthHeader ? 'Present' : 'Missing');
    console.log('Token from custom header:', tokenFromCustomHeader ? 'Present' : 'Missing');
    console.log('Token from URL:', tokenFromUrl ? 'Present' : 'Missing');
    console.log('Final token decision:', token ? 'Present' : 'Missing');
    console.log('All cookies:', request.cookies.getAll().map(c => c.name));
    console.log('User-Agent:', request.headers.get('user-agent'));
  }
  
  // No token, redirect to unauthorized
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('No token found, redirecting to unauthorized');
    }
    const url = new URL('/unauthorized', request.url);
    url.searchParams.set('message', 'You need to be logged in to access this page');
    return NextResponse.redirect(url);
  }

  try {
    // Decode token to get user role
    const decodedToken = jwtDecode<{ role?: string; user?: { role: string }; exp?: number }>(token);
    
    // Check if token is expired
    if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Handle different token formats
    const userRole = decodedToken.role || (decodedToken.user?.role);
    
    if (!userRole) {
      const url = new URL('/unauthorized', request.url);
      url.searchParams.set('message', 'Authentication error: Unable to determine user role');
      return NextResponse.redirect(url);
    }

    // Get allowed roles for this path
    const allowedRoles = ROUTE_ACCESS_MAP[protectedPathPrefix];
    
    // Check if user role is allowed for this path
    if (!allowedRoles.includes(userRole)) {
      const url = new URL('/unauthorized', request.url);
      url.searchParams.set('message', 'You do not have permission to access this page');
      return NextResponse.redirect(url);
    }

    // User has correct role, proceed
    // If token was passed via URL (iOS iframe), clean it up and set as cookie for subsequent requests
    if (tokenFromUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.log('iOS iframe token detected in URL, cleaning up and setting cookie');
      }
      
      const url = request.nextUrl.clone();
      url.searchParams.delete('ios_token');
      response = NextResponse.redirect(url);
      
      // For iOS Chrome/Safari iframe contexts, try multiple cookie strategies
      const isSecure = process.env.NODE_ENV === 'production';
      
      // Primary attempt with SameSite=None
      try {
        response.cookies.set('token', tokenFromUrl, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });
      } catch (error) {
        // Fallback without SameSite for problematic browsers
        response.cookies.set('token', tokenFromUrl, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });
      }
      
      // For iOS Chrome/Safari that are particularly stubborn, add additional headers
      if (isIOSUserAgent) {
        response.headers.set('X-iOS-Token', tokenFromUrl);
        response.headers.set('X-iOS-Auth-Hint', 'token-available');
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Cookie and headers set in middleware redirect response');
      }
    }
    
    return response;
  } catch (error) {
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    // Only apply to protected routes - more selective
    '/customer/:path*',
    '/admin/:path*',
    '/superadmin/:path*',
  ],
}; 