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
  
  // Try to detect company from the request (subdomain or URL parameter)
  const companySubdomain = detectCompanyFromRequest(request);
  let response = NextResponse.next();
  
  // Only fetch company details if we have a subdomain and need it
  if (companySubdomain) {
    try {
      const company = await getCompanyDetails(companySubdomain);
      if (company) {
        // Add company information to response headers
        response.headers.set('x-company-id', company.id);
        response.headers.set('x-company-name', company.name);
        response.headers.set('x-company-subdomain', company.subdomain);
        
        // Also set in request headers for SSR/ISR support
        request.headers.set('x-company-id', company.id);
        request.headers.set('x-company-name', company.name);
        request.headers.set('x-company-subdomain', company.subdomain);
      }
    } catch (error) {
      // Silent fail for company lookup to prevent blocking
      if (process.env.NODE_ENV === 'development') {
        console.error('Company lookup failed:', error);
      }
    }
  }
  
  if (!protectedPathPrefix) {
    // Not a protected route, proceed with company headers if set
    return response;
  }

  // Get the token from cookie (primary) or authorization header (fallback)
  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.split(' ')[1] ||
                request.headers.get('authorization')?.split(' ')[1];
  
  // No token, redirect to unauthorized
  if (!token) {
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

    // User has correct role, proceed with company headers if set
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