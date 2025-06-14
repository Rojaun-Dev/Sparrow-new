'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/apiClient';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface CompanyInfo {
  id: string;
  name: string;
  subdomain: string;
  logo: string | null;
}

function EmbedContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('api_key');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompany() {
      setLoading(true);
      try {
        if (!apiKey) {
          setError('API key is missing');
          setLoading(false);
          return;
        }

        // Verify API key and get company info
        const response = await fetch(`/api/embed/verify?api_key=${apiKey}`);
        if (!response.ok) {
          throw new Error('Invalid API key or unauthorized domain');
        }

        const companyData = await response.json();
        setCompany(companyData);
      } catch (err) {
        console.error('Error loading company:', err);
        setError('Failed to load company information');
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [apiKey]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-destructive">{error || 'Failed to load company'}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Please contact the website administrator for assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          {company.logo && (
            <div className="flex justify-center mb-4">
              <Image 
                src={company.logo} 
                alt={`${company.name} logo`}
                width={150}
                height={60}
                className="h-auto w-auto"
              />
            </div>
          )}
          <CardTitle>{company.name}</CardTitle>
          <CardDescription>Package Forwarding Service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 justify-center">
            <Button>Track Package</Button>
            <Button variant="outline">Get Quote</Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Sign in to your account to view your packages and more.
          </p>
          <div className="flex justify-center">
            <Button variant="link" className="w-full">
              Sign In / Register
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <EmbedContent />
    </Suspense>
  );
} 