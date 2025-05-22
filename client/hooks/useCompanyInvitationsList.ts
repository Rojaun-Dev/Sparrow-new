import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  listCompanyInvitations, 
  sendSuperAdminCompanyInvitation, 
  resendCompanyInvitation, 
  revokeCompanyInvitation 
} from '../lib/api/companyService';
import { useToast } from './use-toast';

export const useCompanyInvitationsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState<string | undefined>(undefined);

  // Query invitations with pagination
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['companyInvitations', page, limit, status, search],
    queryFn: () => listCompanyInvitations(page, limit, status, search),
  });

  // Send invitation mutation
  const {
    mutate: sendInvitation,
    isPending: isSendingInvitation
  } = useMutation({
    mutationFn: (email: string) => sendSuperAdminCompanyInvitation(email),
    onSuccess: () => {
      toast({
        title: 'Invitation Sent',
        description: 'The invitation has been sent successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['companyInvitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  });

  // Resend invitation mutation
  const {
    mutate: resendInvitation,
    isPending: isResendingInvitation
  } = useMutation({
    mutationFn: (id: number) => resendCompanyInvitation(id),
    onSuccess: () => {
      toast({
        title: 'Invitation Resent',
        description: 'The invitation has been resent successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['companyInvitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  });

  // Revoke invitation mutation
  const {
    mutate: revokeInvitation,
    isPending: isRevokingInvitation
  } = useMutation({
    mutationFn: (id: number) => revokeCompanyInvitation(id),
    onSuccess: () => {
      toast({
        title: 'Invitation Revoked',
        description: 'The invitation has been revoked successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['companyInvitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke invitation',
        variant: 'destructive',
      });
    }
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  // Handle status change
  const handleStatusChange = (newStatus: string | undefined) => {
    setStatus(newStatus);
    setPage(1); // Reset to first page when changing status
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm.length > 0 ? searchTerm : undefined);
    setPage(1); // Reset to first page when searching
  };

  return {
    invitations: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    page,
    limit,
    status,
    search,
    handlePageChange,
    handleLimitChange,
    handleStatusChange,
    handleSearch,
    sendInvitation,
    isSendingInvitation,
    resendInvitation,
    isResendingInvitation,
    revokeInvitation,
    isRevokingInvitation,
    refetch
  };
}; 