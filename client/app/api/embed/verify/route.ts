import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/apiClient';

interface CompanyResponse {
  id: string;
  name: string;
  subdomain?: string;
  logo?: string | null;
  [key: string]: any;
}

interface CompanyAsset {
  id: string;
  companyId: string;
  type: 'logo' | 'banner' | 'favicon' | 'small_logo';
  metadata: Record<string, any>;
  imageData?: string; // base64 encoded image
  createdAt: string;
}

interface EnhancedCompanyResponse extends CompanyResponse {
  assets?: CompanyAsset[];
  logo: string | null;
  banner: string | null;
}

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
    
    // Prefer an explicit domain query param (set by the embed script) over the Referer header
    const domainParam = request.nextUrl.searchParams.get('domain');

    let referringDomain: string | null = domainParam || null;

    // Fallback to the Referer header only if the domain param was not provided
    if (!referringDomain) {
      const refererHeader = request.headers.get('referer');
      if (refererHeader) {
        try {
          const url = new URL(refererHeader);
          referringDomain = url.hostname;
        } catch (e) {
          console.error('Invalid referer URL:', e);
        }
      }
    }
    
    // Call the backend to verify the API key and check if the domain is allowed
    const companyResponse = await apiClient.get<CompanyResponse>(
      `/company-by-api-key?apiKey=${apiKey}${referringDomain ? `&domain=${referringDomain}` : ''}`
    );
    
    if (!companyResponse || !companyResponse.id) {
      throw new Error('Invalid API key or unauthorized domain');
    }
    
    // Create a response object that we'll build upon
    const responseData: EnhancedCompanyResponse = {
      ...companyResponse,
      logo: companyResponse.logo || null,
      banner: null
    };
    
    // Fetch company assets using the public assets endpoint
    try {
      console.log(`Fetching public assets for company ${companyResponse.id}`);
      
      // Use our public assets endpoint
      const apiUrl = process.env.NEXT_PUBLIC_URL || '';
      const assetsResponse = await fetch(`${apiUrl}/api/public/assets/${companyResponse.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure we don't cache the response
      });
      
      if (!assetsResponse.ok) {
        console.error(`Failed to fetch assets: ${assetsResponse.status}`);
      } else {
        const assets = await assetsResponse.json();
        console.log('Public assets fetched successfully:', assets);
        
        if (Array.isArray(assets) && assets.length > 0) {
          // Add assets to the company object
          responseData.assets = assets;
          
          const toDataUrl = (asset: any) => {
            if (!asset || !asset.imageData) return null;
            if (asset.imageData.startsWith('data:')) return asset.imageData;
            const mime = asset.metadata?.mimeType || 'image/png';
            return `data:${mime};base64,${asset.imageData}`;
          };

          const logoAsset = assets.find(asset => asset.type === 'logo');
          responseData.logo = toDataUrl(logoAsset);

          const bannerAsset = assets.find(asset => asset.type === 'banner');
          responseData.banner = toDataUrl(bannerAsset);
        }
      }
    } catch (assetError) {
      // Log the error but continue
      console.error('Error fetching company assets:', assetError);
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('API key verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid API key or unauthorized domain' },
      { status: 401 }
    );
  }
} 