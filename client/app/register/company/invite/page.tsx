'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompanyInvitation } from '../../../../hooks';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Loader2 } from 'lucide-react';
import MultiStepCompanyRegistration from '../../../../components/company-registration/MultiStepCompanyRegistration';
import { useToast } from '../../../../hooks';

interface VerificationData {
  isValid: boolean;
  email?: string;
}

export default function InviteRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  
  const { useVerifyInvitation, useRegisterFromInvitation } = useCompanyInvitation();
  const { data, isLoading: isVerifying, error } = useVerifyInvitation(token || undefined);
  const verificationData = data as VerificationData;
  const { mutate: registerCompany, isPending: isRegistering } = useRegisterFromInvitation();

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }

    if (!isVerifying && verificationData) {
      setIsLoading(false);

      if (!verificationData.isValid) {
        setIsExpired(true);
        toast({
          title: 'Invalid Invitation',
          description: 'This invitation has expired or is invalid.',
          variant: 'destructive',
        });
      } else if (verificationData.email) {
        setInvitedEmail(verificationData.email);
      }
    }
  }, [token, isVerifying, verificationData, router, toast]);

  const handleRegistrationSubmit = (data: any) => {
    if (!token) return;

    registerCompany({
      token,
      data: {
        user: {
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
        },
        company: {
          name: data.companyName,
          subdomain: data.subdomain,
          email: data.email,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          phone: data.phone,
          website: data.website,
          locations: data.locations,
          bankInfo: data.bankInfo
        }
      }
    }, {
      onSuccess: () => {
        // Redirect to login page after successful registration
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    });
  };

  if (isLoading || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Verifying Invitation</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation has expired or is invalid. Please contact the administrator for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/')}>
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <div className="container max-w-screen-lg py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Company Registration</h1>
            <p className="text-muted-foreground mt-2">
              Complete your registration to get started with our platform.
            </p>
            {invitedEmail && (
              <p className="text-sm mt-2 p-2 bg-secondary rounded-md">
                Registering with email: <strong>{invitedEmail}</strong>
              </p>
            )}
          </div>
          
          <MultiStepCompanyRegistration 
            onSubmit={handleRegistrationSubmit} 
            email={invitedEmail || undefined}
            isSubmitting={isRegistering}
            readOnlyEmail={true}
          />
        </div>
      </main>
    </div>
  );
} 