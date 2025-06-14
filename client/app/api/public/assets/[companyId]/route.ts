import { NextResponse } from 'next/server';

interface CompanyAsset {
  id: string;
  companyId: string;
  type: 'logo' | 'banner' | 'favicon' | 'small_logo';
  metadata: Record<string, any>;
  imageData?: string; // base64 encoded image
  createdAt: string;
}

export async function GET(
  _request: Request,
  context: { params: { companyId: string } }
) {
  try {
    // Get the company ID from params - properly handled for Next.js dynamic API routes
    const companyId = context.params.companyId;
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
    
    try {
      // Use the public endpoint that doesn't require authentication
      // Important: This endpoint is public in the backend and doesn't require JWT
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/companies/${companyId}/public-assets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure we don't cache the response
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch public assets: ${response.status}`);
        // Return empty array instead of throwing error
        return NextResponse.json([]);
      }
      
      const data = await response.json();
      console.log('Public assets fetched successfully:', data.data || []);
      
      // Extract the assets from the response
      const assets = data.data || [];
      
      return NextResponse.json(assets);
    } catch (error) {
      console.error('Error fetching public company assets:', error);
      // Return empty array instead of error to avoid breaking the UI
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error in public assets endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch company assets' }, { status: 500 });
  }
} 