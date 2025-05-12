import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';
import { sign } from 'jsonwebtoken';

// Simulated user database - in a real app, this would query a database
const users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'Password123!', // In a real app, this would be hashed
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'customer@example.com',
    password: 'Password123!', // In a real app, this would be hashed
    firstName: 'Customer',
    lastName: 'User',
    role: 'customer'
  }
];

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    
    // Find user by email
    const user = users.find(u => u.email === validatedData.email);
    
    // Check if user exists and password matches
    if (!user || user.password !== validatedData.password) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create user data for token (exclude password)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';
    const token = sign(userData, JWT_SECRET, { expiresIn: '1d' });
    
    // Create response with success message
    const response = NextResponse.json({ success: true, user: userData });
    
    // Set token in HTTP-only cookie
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: validatedData.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days if remember me is checked, 1 day if not
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 