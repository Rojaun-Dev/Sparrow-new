import { headers } from 'next/headers';

export default async function CompanyMetaTags() {
  const headersList = await headers();
  
  const companyId = headersList.get('x-company-id');
  const companyName = headersList.get('x-company-name');
  const companySubdomain = headersList.get('x-company-subdomain');
  
  return (
    <>
      {/* Favicon links */}
      <link rel="icon" href="/favicon_io/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
      <link rel="apple-touch-icon" href="/favicon_io/apple-touch-icon.png" />
      <link rel="manifest" href="/favicon_io/site.webmanifest" />
      
      {/* Company meta tags */}
      {companyId && <meta name="x-company-id" content={companyId} />}
      {companyName && <meta name="x-company-name" content={companyName} />}
      {companySubdomain && <meta name="x-company-subdomain" content={companySubdomain} />}
    </>
  );
} 