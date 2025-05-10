import { NextRequest, NextResponse } from "next/server";

// Simplified middleware for debugging - doesn't use Auth0
export function middleware(request: NextRequest) {
  console.log("Debug middleware activated");
  
  // Simply pass through all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}; 