import { useMutation } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { companyService, sendCompanyInvitation } from '@/lib/api/companyService';

interface OnboardingInitiationData {
  adminEmail: string;
}

export function useInitiateCompanyOnboarding() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: OnboardingInitiationData) => {
      // Send the invitation to the admin
      await sendCompanyInvitation({
        email: data.adminEmail
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Onboarding Initiated",
        description: "An invitation has been sent to the admin to complete the company setup.",
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