import { NextResponse } from 'next/server';

export async function POST() {
  // Create response with success message
  const response = NextResponse.json({ success: true });
  
  // Clear the auth token by setting an expired cookie
  response.cookies.delete('auth-token');
  
  return response;
} 