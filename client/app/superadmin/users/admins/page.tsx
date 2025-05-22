"use client"
import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Ban,
  Trash,
  Mail,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { TableSkeleton } from '@/components/ui/loading-skeletons'

// Import hooks
import { useFeedback } from "@/components/ui/toast-provider"
import { useSuperAdminUsers } from "@/hooks/useSuperAdminUsers"
import { useSuperAdminCompanies } from "@/hooks/useSuperAdminCompanies"
import { User } from "@/lib/api/types"

// Extend User type for admin-specific properties
interface AdminUser extends User {
  avatarUrl?: string;
  lastLogin?: string;
}

// Form schema for adding/editing an admin
const adminFormSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
  role: z.enum(["admin_l1", "admin_l2", "super_admin"], {
    required_error: "Please select a role",
  }),
  sendEmail: z.boolean(),
}).required();

// Role display mapping
const roleDisplayMap = {
  admin_l1: "Admin Level 1",
  admin_l2: "Admin Level 2",
  super_admin: "Super Admin"
} as const;

type AdminFormValues = z.infer<typeof adminFormSchema>

// Add the useFeedback hook inside the component
export default function AdminsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { showFeedback } = useFeedback()
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate'>('deactivate')
  const [selectedAdminId, setSelectedAdminId] = useState<string>('')
  
  // Use the hooks
  const { createAdminUser, fetchUsers, loading: usersLoading, users, deactivateUser, reactivateUser } = useSuperAdminUsers()
  const { companies, fetchCompanies, loading: companiesLoading } = useSuperAdminCompanies()
  
  // Load real data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchUsers({ 
          role: ['admin_l1', 'admin_l2', 'super_admin'].join(','),
          page: currentPage,
          limit: 10, // Set appropriate page size
          search: searchQuery || undefined
        });
        
        // Update pagination info
        if (response?.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
        
        // Load companies for the dropdown
        await fetchCompanies();
      } catch (error) {
        console.error('Failed to fetch data:', error);
        showFeedback('Failed to load admin users', 'error');
      }
    };
    
    loadData();
  }, [fetchUsers, fetchCompanies, showFeedback, currentPage, searchQuery]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Filter admins based on search query (if not using server-side search)
  const filteredAdmins = users.filter(
    (admin) => {
      const name = `${admin.firstName || ''} ${admin.lastName || ''}`.trim();
      return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    }
  ) as AdminUser[]

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      email: "",
      role: "admin_l1",
      sendEmail: true,
    },
  })

  // Update the onSubmit function to use the API
  async function onSubmit(data: AdminFormValues) {
    try {
      setIsSubmitting(true)
      console.log("Form submitted:", data)

      // Get the first company from the list (this should be improved with a company selector)
      const targetCompany = companies[0] || { id: '' };
      
      if (!targetCompany.id) {
        showFeedback('No company selected. Please select a company.', 'error');
        return;
      }
      
      // Prepare the data for API call
      const userData = {
        email: data.email,
        role: data.role,
        firstName: 'New', // These should be added to the form
        lastName: 'Admin',
        companyId: targetCompany.id,
        password: 'Password123!', // This should be auto-generated or asked in the form
      };

      // Create the admin via API
      const newUser = await createAdminUser(userData);
      
      showFeedback(
        isEditing
          ? `Admin "${data.email}" has been updated successfully.`
          : `Admin "${data.email}" has been added successfully.`,
        "success",
      )

      // Refresh the admin list
      fetchUsers({ role: ['admin_l1', 'admin_l2', 'super_admin'].join(',') })
        .then(response => {
          // Assuming response.data is the updated list of users
          // Update the users state with the new list
          // This is a placeholder and should be replaced with actual implementation
          // For example, you can use a state management library like Redux or a local state
          // to update the users state
        });

      // Reset form and close dialog
      form.reset()
      document.getElementById("close-admin-dialog")?.click()
    } catch (error: any) {
      console.error("Error submitting form:", error)
      showFeedback(
        error.message || (isEditing ? "Failed to update admin. Please try again." : "Failed to add admin. Please try again."),
        "error",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit admin handler
  function handleEditAdmin(admin: AdminUser) {
    setIsEditing(true)
    setCurrentAdmin(admin)
    form.reset({
      email: admin.email,
      role: admin.role as "admin_l1" | "admin_l2" | "super_admin",
      sendEmail: false,
    })
    document.getElementById("open-admin-dialog")?.click()
  }

  // Add admin handler
  function handleAddAdmin() {
    setIsEditing(false)
    setCurrentAdmin(null)
    form.reset({
      email: "",
      role: "admin_l1",
      sendEmail: true,
    })
    document.getElementById("open-admin-dialog")?.click()
  }

  // Get initials for avatar
  function getInitials(first: string, last: string) {
    const firstName = first || '';
    const lastName = last || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  // Handle admin deactivation
  async function handleDeactivateAdmin(id: string) {
    try {
      await deactivateUser(id);
      showFeedback("Admin deactivated successfully", "success");
      setShowConfirmDialog(false);
    } catch (error) {
      showFeedback("Failed to deactivate admin", "error");
    }
  }

  // Handle admin reactivation
  async function handleReactivateAdmin(id: string) {
    try {
      await reactivateUser(id);
      showFeedback("Admin reactivated successfully", "success");
      setShowConfirmDialog(false);
    } catch (error) {
      showFeedback("Failed to reactivate admin", "error");
    }
  }

  // Open confirmation dialog for deactivation
  function confirmDeactivateAdmin(id: string) {
    setSelectedAdminId(id);
    setConfirmAction('deactivate');
    setShowConfirmDialog(true);
  }

  // Open confirmation dialog for activation
  function confirmActivateAdmin(id: string) {
    setSelectedAdminId(id);
    setConfirmAction('activate');
    setShowConfirmDialog(true);
  }

  // Confirm action handler
  function handleConfirmAction() {
    if (confirmAction === 'deactivate') {
      handleDeactivateAdmin(selectedAdminId);
    } else {
      handleReactivateAdmin(selectedAdminId);
    }
  }

  // Actions dropdown
  function ActionsDropdown({ admin }: { admin: AdminUser }) {
    const handleAction = (e: React.MouseEvent, action: () => void) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              handleEditAdmin(admin);
            }}
          disabled>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              // TODO: Implement send email functionality
            }}
          disabled>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {admin.isActive ? (
            <DropdownMenuItem 
              className="text-amber-600"
              onSelect={(e) => {
                e.preventDefault();
                confirmDeactivateAdmin(admin.id);
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              className="text-green-600"
              onSelect={(e) => {
                e.preventDefault();
                confirmActivateAdmin(admin.id);
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Activate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Table columns
  const columns = [
    {
      header: "Name",
      accessorKey: "firstName" as keyof AdminUser,
      cell: (admin: AdminUser) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={admin.avatarUrl || "/placeholder.svg"} alt={`${admin.firstName} ${admin.lastName}`} />
            <AvatarFallback>{getInitials(admin.firstName, admin.lastName)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{`${admin.firstName || ''} ${admin.lastName || ''}`}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email" as keyof AdminUser,
    },
    {
      header: "Role",
      accessorKey: "role" as keyof AdminUser,
      cell: (admin: AdminUser) => (
        <div className="flex items-center gap-2">
          {admin.role === "super_admin" ? (
            <Shield className="h-4 w-4 text-primary" />
          ) : (
            <Shield className="h-4 w-4 text-primary/50" />
          )}
          {roleDisplayMap[admin.role as keyof typeof roleDisplayMap] || admin.role}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive" as keyof AdminUser,
      cell: (admin: AdminUser) => (
        <Badge variant={admin.isActive ? "success" : "destructive"}>
          {admin.isActive ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Suspended
            </div>
          )}
        </Badge>
      ),
    },
    {
      header: "Last Login",
      accessorKey: "lastLogin" as keyof AdminUser,
      cell: (admin: AdminUser) => (
        <div>
          {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof AdminUser,
      cell: (admin: AdminUser) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionsDropdown admin={admin} />
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Super Admins</h1>
          <p className="text-muted-foreground">
            Manage super admin users who have elevated access to all tenants and global settings.
          </p>
        </div>

        {/* Hidden trigger for the dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="hidden" id="open-admin-dialog">
              Open Dialog
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Admin" : "Add Admin"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the admin details below."
                  : "Add a new admin to the platform. They will receive an email with instructions."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormDescription>The email address of the admin user.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin_l1">{roleDisplayMap.admin_l1}</SelectItem>
                          <SelectItem value="admin_l2">{roleDisplayMap.admin_l2}</SelectItem>
                          <SelectItem value="super_admin">{roleDisplayMap.super_admin}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>The role determines the level of access.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sendEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Send invitation email</FormLabel>
                        <FormDescription>An email with credentials will be sent to the admin.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditing ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>{isEditing ? "Update Admin" : "Add Admin"}</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
          <DialogClose asChild>
            <button className="hidden" id="close-admin-dialog">
              Close
            </button>
          </DialogClose>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Admins</CardTitle>
          <CardDescription>A list of all super admins with access to the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search admins..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {usersLoading ? (
            <TableSkeleton columns={6} rows={5} />
          ) : (
            <ResponsiveTable 
              data={filteredAdmins} 
              columns={columns}
              onRowClick={() => {}} // Prevent row click navigation
              pagination={{
                currentPage,
                totalPages,
                onPageChange: handlePageChange
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction === 'deactivate' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Confirm Deactivation
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Confirm Activation
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'deactivate'
                ? "Are you sure you want to deactivate this admin? They will no longer be able to access the platform."
                : "Are you sure you want to activate this admin? They will regain access to the platform."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button 
              variant={confirmAction === 'deactivate' ? "destructive" : "default"}
              onClick={handleConfirmAction}
            >
              {confirmAction === 'deactivate' ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
