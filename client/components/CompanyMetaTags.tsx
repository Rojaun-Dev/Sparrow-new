import { headers } from 'next/headers';

export default async function CompanyMetaTags() {
  const headersList = await headers();
  
  const companyId = headersList.get('x-company-id');
  const companyName = headersList.get('x-company-name');
  const companySubdomain = headersList.get('x-company-subdomain');
  
  if (!companyId || !companyName || !companySubdomain) {
    return null;
  }
  
  return (
    <>
      <meta name="x-company-id" content={companyId} />
      <meta name="x-company-name" content={companyName} />
      <meta name="x-company-subdomain" content={companySubdomain} />
    </>
  );
} 