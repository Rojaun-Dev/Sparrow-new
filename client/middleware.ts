import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Define the route access map with proper type
const ROUTE_ACCESS_MAP: Record<string, string[]> = {
  '/customer': ['customer'],
  '/admin': ['admin_l1', 'admin_l2'],
  '/superadmin': ['super_admin'],
};

// Debug function that shows token contents, with optional masking
function debugToken(token: string | undefined | null) {
  if (!token) return 'No token present';
  
  try {
    // Extract first 10 chars and last 10 chars for identification
    // This allows us to identify the token without exposing the full value in logs
    const maskedToken = token.length > 20 
      ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}`
      : token;
    
    const decoded = jwtDecode(token);
    return {
      maskedToken,
      contents: decoded
    };
  } catch (e) {
    return {
      maskedToken: token.length > 20 
        ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}`
        : token,
      error: 'Invalid JWT format'
    };
  }
}

// Function to detect company information from the request
async function detectCompanyFromRequest(request: NextRequest) {
  const url = request.nextUrl;
  let companySubdomain = null;

  // Method 1: Check for subdomain
  // Example: company-name.app.example.com
  const hostname = request.headers.get('host') || '';
  const hostParts = hostname.split('.');
  
  // If we have at least 3 parts (subdomain.domain.tld) and it's not 'www'
  if (hostParts.length >= 3 && hostParts[0] !== 'www') {
    companySubdomain = hostParts[0];
  }

  // Method 2: Check for company parameter in URL
  // Example: app.example.com?company=company-name
  if (!companySubdomain) {
    companySubdomain = url.searchParams.get('company');
  }

  // If we found a company identifier, try to fetch company details
  if (companySubdomain) {
    try {
      console.log(`Detected company subdomain: ${companySubdomain}`);
      
      // Call the API to get company information
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/companies/by-subdomain/${companySubdomain}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const company = await response.json();
        return company;
      } else {
        console.log('Failed to fetch company data:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  }
  
  return null;
}

export async function middleware(request: NextRequest) {
  // Log all cookies for debugging
  // This helps identify if cookies are being properly sent with each request
  console.log('All cookies:', Array.from(request.cookies.getAll()).map(c => c.name));
  
  // Try to detect company from the request (subdomain or URL parameter)
  const company = await detectCompanyFromRequest(request);
  
  // Save detected company in request header for the application
  if (company) {
    // Add company information to response headers
    const response = NextResponse.next();
    response.headers.set('x-company-id', company.id);
    response.headers.set('x-company-name', company.name);
    response.headers.set('x-company-subdomain', company.subdomain);
    return response;
  }

  // Get the token from cookie or authorization header - focus on cookie first
  // We check multiple locations because tokens might be stored in different ways
  const tokenFromCookie = request.cookies.get('token')?.value;
  const tokenFromAuthHeader = request.headers.get('Authorization')?.split(' ')[1] ||
                             request.headers.get('authorization')?.split(' ')[1];
  
  const token = tokenFromCookie || tokenFromAuthHeader;
  
  // Debug token sources - helps identify where the token is being found
  console.log('Token from cookie:', debugToken(tokenFromCookie));
  console.log('Token from auth header:', debugToken(tokenFromAuthHeader));

  const path = request.nextUrl.pathname;
  
  // Check if path needs to be protected - this avoids unnecessary processing
  // for public routes
  const protectedPathPrefix = Object.keys(ROUTE_ACCESS_MAP).find(
    prefix => path === prefix || path.startsWith(`${prefix}/`)
  );
  
  if (!protectedPathPrefix) {
    // Not a protected route, proceed
    return NextResponse.next();
  }
  
  console.log('Middleware checking path:', path);
  console.log('Token present:', !!token);
  
  // No token, redirect to unauthorized
  if (!token) {
    console.log('No token found, redirecting to unauthorized');
    const url = new URL('/unauthorized', request.url);
    url.searchParams.set('message', 'You need to be logged in to access this page');
    return NextResponse.redirect(url);
  }

  try {
    // Decode token to get user role
    const decodedToken = jwtDecode<{ role?: string; user?: { role: string }; exp?: number }>(token);
    
    console.log('Full token contents:', decodedToken);
    
    // Check if token is expired - important security check
    // This prevents access with expired tokens even if they're technically valid format
    if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
      console.log('Token is expired, redirecting to login');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Handle different token formats - some APIs put role at top level, others nested in user object
    // This flexibility allows our middleware to work with different JWT structures
    const userRole = decodedToken.role || (decodedToken.user?.role);
    
    console.log('Decoded user role:', userRole);
    
    if (!userRole) {
      console.log('No role found in token');
      const url = new URL('/unauthorized', request.url);
      url.searchParams.set('message', 'Authentication error: Unable to determine user role');
      return NextResponse.redirect(url);
    }

    // Get allowed roles for this path (safely typed)
    const allowedRoles = ROUTE_ACCESS_MAP[protectedPathPrefix];
    
    // Check if user role is allowed for this path - this is the core RBAC logic
    if (!allowedRoles.includes(userRole)) {
      console.log(`Role ${userRole} not allowed for ${protectedPathPrefix}, allowed roles:`, allowedRoles);
      const url = new URL('/unauthorized', request.url);
      url.searchParams.set('message', 'You do not have permission to access this page');
      return NextResponse.redirect(url);
    }

    console.log('Access granted for role', userRole);
    // User has correct role, proceed
    return NextResponse.next();
  } catch (error) {
    console.error("Token validation error:", error);
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    // Apply middleware to these routes
    '/customer/:path*',
    '/admin/:path*',
    '/superadmin/:path*',
    // Exclude these routes
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}; 