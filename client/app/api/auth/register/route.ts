import { NextRequest, NextResponse } from 'next/server';
import { registrationSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';

// Simulated user database - in a real app, this would insert into a database
const users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'Password123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'customer@example.com',
    password: 'Password123!',
    firstName: 'Customer',
    lastName: 'User',
    role: 'customer'
  }
];

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registrationSchema.parse(body);
    
    // Check if email already exists
    const existingUser = users.find(u => u.email === validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 409 }
      );
    }
    
    // In a real application, you would:
    // 1. Hash the password
    // 2. Create a new user in the database
    // 3. Send verification email
    
    // For demo purposes, we'll just log the registration
    console.log('User registered:', {
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      trn: validatedData.trn
    });
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
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