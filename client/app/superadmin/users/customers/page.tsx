'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  User,
  UserCheck,
  Building2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { useFeedback } from "@/components/ui/toast-provider";
import { useSuperAdminUsers } from '@/hooks/useSuperAdminUsers';
import { useSuperAdminCompanies } from '@/hooks/useSuperAdminCompanies';
import { UserData } from '@/lib/api/userService';

// Define type for customer data
interface Customer extends UserData {
  companyName: string;
}

// Form schema for customer management
const customerFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  companyId: z.string().min(1, "Please select a company"),
  isActive: z.boolean().default(true)
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const { fetchUsers, users, pagination, loading, error, updateUser, deactivateUser, reactivateUser } = useSuperAdminUsers();
  const { fetchCompanies, companies, loading: companiesLoading } = useSuperAdminCompanies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const { showFeedback } = useFeedback();
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate'>('deactivate');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyId: "",
      isActive: true
    },
    mode: "onChange",
  });

  // Fetch customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        await fetchUsers({
          role: 'customer',
          page: 1,
          limit: 10
        });
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    };

    const loadCompanies = async () => {
      try {
        await fetchCompanies();
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };

    loadCustomers();
    loadCompanies();
  }, [fetchUsers, fetchCompanies]);

  // Filter customers based on search query and company selection
  const filteredCustomers = users
    .filter(user => user.role === 'customer')
    .filter(customer => 
      (customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedCompany !== "all" ? customer.companyId === selectedCompany : true)
    );

  // Handle form submission
  async function onSubmit(data: CustomerFormValues) {
    setIsSubmitting(true);
    console.log("Form submitted:", data);

    try {
      // In a real implementation, this would call an API to update the customer
      if (isEditing && currentCustomer) {
        await updateUser(currentCustomer.id, data);
        showFeedback(`Customer "${data.firstName} ${data.lastName}" has been updated successfully.`, "success");
      } else {
        // Creating new customers not implemented in this example
        showFeedback(`Customer creation not implemented in this example.`, "info");
      }

      // Reset form and close dialog
      form.reset();
      document.getElementById("close-customer-dialog")?.click();
    } catch (error) {
      console.error("Error submitting form:", error);
      showFeedback(
        isEditing ? "Failed to update customer. Please try again." : "Failed to add customer. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Edit customer handler
  function handleEditCustomer(customer: Customer) {
    setIsEditing(true);
    setCurrentCustomer(customer);
    form.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      companyId: customer.companyId,
      isActive: customer.isActive
    });
    document.getElementById("open-customer-dialog")?.click();
  }

  // Handle customer deactivation
  async function handleDeactivateCustomer(id: string) {
    try {
      await deactivateUser(id);
      showFeedback("Customer deactivated successfully", "success");
      setShowConfirmDialog(false);
    } catch (error) {
      showFeedback("Failed to deactivate customer", "error");
    }
  }

  // Handle customer reactivation
  async function handleReactivateCustomer(id: string) {
    try {
      await reactivateUser(id);
      showFeedback("Customer reactivated successfully", "success");
      setShowConfirmDialog(false);
    } catch (error) {
      showFeedback("Failed to reactivate customer", "error");
    }
  }

  // Open confirmation dialog for deactivation
  function confirmDeactivateCustomer(id: string) {
    setSelectedCustomerId(id);
    setConfirmAction('deactivate');
    setShowConfirmDialog(true);
  }

  // Open confirmation dialog for activation
  function confirmActivateCustomer(id: string) {
    setSelectedCustomerId(id);
    setConfirmAction('activate');
    setShowConfirmDialog(true);
  }

  // Confirm action handler
  function handleConfirmAction() {
    if (confirmAction === 'deactivate') {
      handleDeactivateCustomer(selectedCustomerId);
    } else {
      handleReactivateCustomer(selectedCustomerId);
    }
  }

  // Get initials for avatar
  function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // Actions dropdown component
  function ActionsDropdown({ customer }: { customer: Customer }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEditCustomer(customer)} disabled>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {customer.isActive ? (
            <DropdownMenuItem className="text-amber-600" onClick={() => confirmDeactivateCustomer(customer.id)}>
              <Ban className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-green-600" onClick={() => confirmActivateCustomer(customer.id)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Activate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Table columns
  const columns = [
    {
      header: "Name",
      accessorKey: "firstName" as keyof Customer,
      cell: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(customer.firstName, customer.lastName)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{`${customer.firstName} ${customer.lastName}`}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email" as keyof Customer,
    },
    {
      header: "Company",
      accessorKey: "companyName" as keyof Customer,
      cell: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{customer.companyName}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive" as keyof Customer,
      cell: (customer: Customer) => (
        <Badge variant={customer.isActive ? "success" : "destructive"}>
          {customer.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Created",
      accessorKey: "createdAt" as keyof Customer,
      cell: (customer: Customer) => (
        <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Customer,
      cell: (customer: Customer) => <ActionsDropdown customer={customer} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
        <p className="text-muted-foreground">
          Manage customer accounts across all companies in the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>
                All platform users with the customer role.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search customers..."
                  className="pl-8 w-full sm:w-[200px] md:w-[260px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <ResponsiveTable
                columns={columns}
                data={filteredCustomers}
                emptyStateMessage="No customers found. Try adjusting your filters."
              />
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCustomers.length} of {pagination.totalItems} customers
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => fetchUsers({ role: 'customer', page: pagination.page - 1, limit: pagination.limit })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => fetchUsers({ role: 'customer', page: pagination.page + 1, limit: pagination.limit })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog for editing customer details */}
      <Dialog>
        <DialogTrigger asChild>
          <button id="open-customer-dialog" className="hidden">
            Open Dialog
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update customer information and preferences."
                : "Add a new customer to the platform."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Active Account
                    </FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => document.getElementById("close-customer-dialog")?.click()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Update Customer" : "Add Customer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
        <DialogClose id="close-customer-dialog" />
      </Dialog>

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
                ? "Are you sure you want to deactivate this customer? They will no longer be able to access the platform."
                : "Are you sure you want to activate this customer? They will regain access to the platform."}
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
  );
} 