import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/apiClient';

interface CompanyResponse {
  id: string;
  name: string;
  subdomain?: string;
  logo?: string | null;
  banner?: string | null;
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

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Extract the company ID from the route parameters
    const companyId = context.params.id;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Call the backend to get company information
    const company = await apiClient.get<CompanyResponse>(`/companies/${companyId}`);
    
    // Create a response object that we'll build upon
    const responseData: EnhancedCompanyResponse = {
      ...company,
      logo: company.logo || null,
      banner: null
    };
    
    // Fetch company assets using the public assets endpoint
    try {
      console.log(`Fetching public assets for company ${companyId}`);
      
      // Use our public assets endpoint
      const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      const assetsResponse = await fetch(`${apiUrl}/api/public/assets/${companyId}`, {
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
          
          // Extract logo and banner directly from assets for convenience
          const logoAsset = assets.find(asset => asset.type === 'logo');
          if (logoAsset && logoAsset.imageData) {
            responseData.logo = logoAsset.imageData;
          }
          
          const bannerAsset = assets.find(asset => asset.type === 'banner');
          if (bannerAsset && bannerAsset.imageData) {
            responseData.banner = bannerAsset.imageData;
          }
        }
      }
    } catch (assetError) {
      // Log the error but continue - don't fail the whole request just because assets failed
      console.error('Error fetching company assets:', assetError);
    }
    
    // Return the company data with any assets we were able to fetch
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching company data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company information' },
      { status: 500 }
    );
  }
} 