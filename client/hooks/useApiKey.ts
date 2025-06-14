import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api/apiClient";

interface ApiKeyResponse {
  success: boolean;
  apiKey: string;
  message: string;
}

export const useApiKey = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate: generateApiKey } = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      try {
        const response = await apiClient.post<ApiKeyResponse>('/company-settings/integration/api-key');
        return response;
      } catch (error) {
        console.error("Error generating API key:", error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (response) => {
      if (response.success && response.apiKey) {
        // Update local state with the new API key
        setApiKey(response.apiKey);
        
        // Invalidate and refetch company settings to get the updated API key
        queryClient.invalidateQueries({
          queryKey: ["companySettings"],
        });
        
        toast({
          title: "Success",
          description: "API key generated successfully",
        });
        
        return response.apiKey;
      } else {
        throw new Error(response.message || "Failed to generate API key");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
    },
  });

  return {
    generateApiKey,
    isGenerating,
    apiKey,
  };
}; 