import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/apiClient';

export async function GET(request: NextRequest) {
  try {
    // Extract the API key from the query parameter
    const apiKey = request.nextUrl.searchParams.get('api_key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }
    
    // Check the referring domain to ensure it's allowed
    const referer = request.headers.get('referer');
    let referringDomain = null;
    
    if (referer) {
      try {
        const url = new URL(referer);
        referringDomain = url.hostname;
      } catch (e) {
        console.error('Invalid referer URL:', e);
      }
    }
    
    // Call the backend to verify the API key and check if the domain is allowed
    const verifyResponse = await apiClient.get(
      `/company-by-api-key?apiKey=${apiKey}${referringDomain ? `&domain=${referringDomain}` : ''}`
    );
    
    // Return company data if verification is successful
    return NextResponse.json(verifyResponse);
  } catch (error) {
    console.error('API key verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid API key or unauthorized domain' },
      { status: 401 }
    );
  }
} 