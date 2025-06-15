import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/apiClient';

interface CompanyPublicResponse {
  id: string;
  name: string;
  subdomain: string;
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

// Add enhanced response interface
interface EnhancedCompanyResponse extends CompanyPublicResponse {
  assets?: CompanyAsset[];
  logo: string | null;
  banner: string | null;
}

export async function GET(
  _request: Request,
  context: { params: { subdomain: string } }
) {
  try {
    // Get the subdomain from params - properly handled for Next.js dynamic API routes
    const subdomain = context.params.subdomain;
    
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }
    
    // Fetch company by subdomain
    const company = await apiClient.get<CompanyPublicResponse>(`/companies/by-subdomain/${subdomain}`);
    
    if (!company || !company.id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    // Create a response object that we'll build upon
    const responseData: EnhancedCompanyResponse = {
      ...company,
      logo: company.logo || null,
      banner: null
    };
    
    // Try to fetch public assets if available
    try {
      console.log(`Fetching public assets for company ${company.id}`);
      
      // Use our public assets endpoint
      const apiUrl = process.env.NEXT_PUBLIC_URL || '';
      const assetsResponse = await fetch(`${apiUrl}/api/public/assets/${company.id}`, {
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
          responseData.assets = assets;
          
          const toDataUrl = (asset: any) => {
            if (!asset || !asset.imageData) return null;
            // If already in data URL format, return as is
            if (asset.imageData.startsWith('data:')) return asset.imageData;
            // Detect mime type from metadata if provided, default to png
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
      // Log the error but continue - don't fail the whole request
      console.error('Error fetching public company assets:', assetError);
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching company by subdomain:', error);
    return NextResponse.json({ error: 'Failed to fetch company information' }, { status: 500 });
  }
} 