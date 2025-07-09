import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAssignUserToPackage } from "@/hooks/usePackages";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, User, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/apiClient";
import { debounce } from "lodash";
import { useAuth } from "@/hooks/useAuth";

interface AssignUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string | null;
  onSuccess?: () => void;
  companyId?: string;
}

export function AssignUserModal({ 
  open, 
  onOpenChange, 
  packageId, 
  onSuccess,
  companyId
}: AssignUserModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const assignUserMutation = useAssignUserToPackage();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setUsers([]);
      setSelectedUserId(null);
    }
  }, [open]);

  // Debounced search function
  const searchUsers = debounce(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      // Use the company ID from props or from the authenticated user
      const cId = companyId || user?.companyId;
      
      if (!cId) {
        throw new Error("Company ID is required");
      }
      
      // Make sure we're explicitly filtering for customers only
      // Try different search parameter names that might be expected by the API
      const response = await apiClient.get<any>(`/companies/${cId}/users`, {
        params: {
          search: query,
          query: query, // Try an alternative parameter name
          role: 'customer',
          limit: 10
        }
      });
      
      // Handle different response formats
      let customerUsers: any[] = [];
      
      if (Array.isArray(response)) {
        // If response is already an array
        customerUsers = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // If response has a data property that's an array
        customerUsers = response.data;
      } else {
        console.warn("Unexpected API response format:", response);
        customerUsers = [];
      }
      
      // Ensure we only have customer users AND manually filter by search query
      // if the backend isn't doing it properly
      customerUsers = customerUsers.filter(user => {
        // First ensure it's a customer
        if (user.role !== 'customer') return false;
        
        // Then manually filter by search query (case insensitive)
        const searchLower = query.toLowerCase();
        return (
          (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      });
      
      setUsers(customerUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search for users",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  // Handle user selection
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  // Handle assign button click
  const handleAssign = async () => {
    if (!packageId || !selectedUserId) return;
    
    try {
      await assignUserMutation.mutateAsync({ packageId, userId: selectedUserId });
      
      toast({
        title: "Success",
        description: "User assigned to package successfully",
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign user to package",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Customer to Package</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name or email..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {loading && (
              <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {/* Search results */}
          <div className="max-h-60 overflow-y-auto border rounded-md">
            {users.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery.length > 0 
                  ? loading 
                    ? "Searching..." 
                    : "No customers found. Try a different search." 
                  : "Search for customers by name or email."}
              </div>
            ) : (
              <div className="divide-y">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-accent ${
                      selectedUserId === user.id ? "bg-accent" : ""
                    }`}
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {selectedUserId === user.id && (
                      <UserCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedUserId || assignUserMutation.isPending}
          >
            {assignUserMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Customer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 