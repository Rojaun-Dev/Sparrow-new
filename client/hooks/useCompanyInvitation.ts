import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  sendCompanyInvitation,
  verifyCompanyInvitation,
  registerCompanyFromInvitation
} from '../lib/api/companyService';
import { 
  CompanyInvitationRequest,
  RegisterFromInvitationRequest
} from '../lib/api/types';
import { useToast } from './use-toast';

export const useCompanyInvitation = () => {
  const { toast } = useToast();
  const [invitationEmail, setInvitationEmail] = useState<string>('');

  // Send invitation mutation
  const {
    mutate: sendInvitation,
    isPending: isSendingInvitation
  } = useMutation({
    mutationFn: (data: CompanyInvitationRequest) => sendCompanyInvitation(data),
    onSuccess: () => {
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${invitationEmail}`,
        variant: 'default',
      });
      setInvitationEmail('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  });

  // Verify invitation query
  const useVerifyInvitation = (token: string | undefined) => {
    return useQuery({
      queryKey: ['companyInvitation', token],
      queryFn: async () => {
        if (!token) {
          return { isValid: false };
        }
        try {
          const response = await verifyCompanyInvitation(token);
          return response;
        } catch (error) {
          console.error('Error verifying invitation:', error);
          return { isValid: false };
        }
      },
      enabled: !!token,
      staleTime: 0,
      refetchOnWindowFocus: false,
    });
  };

  // Register from invitation mutation
  const useRegisterFromInvitation = () => {
    return useMutation({
      mutationFn: ({ token, data }: { 
        token: string; 
        data: Omit<RegisterFromInvitationRequest, 'token'>;
      }) => registerCompanyFromInvitation(token, data),
      onSuccess: () => {
        toast({
          title: 'Registration Successful',
          description: 'Your company has been registered successfully.',
          variant: 'default',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to register company',
          variant: 'destructive',
        });
      }
    });
  };

  return {
    invitationEmail,
    setInvitationEmail,
    sendInvitation: (email: string) => {
      setInvitationEmail(email);
      sendInvitation({ email });
    },
    isSendingInvitation,
    useVerifyInvitation,
    useRegisterFromInvitation,
  };
}; 