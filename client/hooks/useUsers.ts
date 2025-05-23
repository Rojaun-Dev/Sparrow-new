import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/lib/api';
import { User } from '@/lib/api/types';

// Key factory for user queries
const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: any) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Hook for fetching a single user by ID
export function useUser(id?: string) {
  return useQuery({
    queryKey: id ? userKeys.detail(id) : userKeys.details(),
    queryFn: () => usersService.getUser(id as string),
    enabled: !!id, // Only run the query if we have an ID
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 