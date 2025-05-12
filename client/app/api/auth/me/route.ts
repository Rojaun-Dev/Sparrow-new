import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// Define the JWT payload structure
interface JwtPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    // If no token, return unauthorized
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    // Verify and decode token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    
    // Return user data from token
    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    // If token verification fails, return unauthorized
    return NextResponse.json({ user: null }, { status: 401 });
  }
} 