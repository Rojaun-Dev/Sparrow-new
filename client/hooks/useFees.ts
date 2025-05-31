import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeService } from '@/lib/api/feeService';
import { Fee } from '@/lib/api/types';

export function useFees(companyId?: string) {
  return useQuery<Fee[]>({
    queryKey: ['fees', companyId],
    queryFn: () => feeService.getFees(companyId),
  });
}

export function useFee(id: string, companyId?: string) {
  return useQuery<Fee>({
    queryKey: ['fee', id, companyId],
    queryFn: () => feeService.getFee(id, companyId),
    enabled: !!id,
  });
}

export function useCreateFee(companyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Fee>) => feeService.createFee(data, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', companyId] });
    },
  });
}

export function useUpdateFee(companyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Fee> }) => feeService.updateFee(id, data, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', companyId] });
    },
  });
}

export function useDeleteFee(companyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feeService.deleteFee(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', companyId] });
    },
  });
} 