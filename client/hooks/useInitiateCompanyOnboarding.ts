import { useMutation } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { companyService, sendCompanyInvitation } from '@/lib/api/companyService';

interface OnboardingInitiationData {
  name: string;
  subdomain: string;
  adminEmail: string;
}

export function useInitiateCompanyOnboarding() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: OnboardingInitiationData) => {

      // Then send the invitation to the admin
      await sendCompanyInvitation({
        email: data.adminEmail
      });

    },
    onSuccess: (data) => {
      toast({
        title: "Onboarding Initiated",
        description: "The company has been created and an invitation has been sent to the admin.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Initiating Onboarding",
        description: error.message || "Failed to initiate company onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });
} 