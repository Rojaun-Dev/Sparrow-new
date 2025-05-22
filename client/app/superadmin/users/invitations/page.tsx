"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Plus,
  MoreHorizontal,
  RefreshCw,
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Search,
  Filter,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useCompanyInvitationsList } from "@/hooks/useCompanyInvitationsList"
import { formatDistanceToNow, format } from "date-fns"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { CompanyInvitation } from "@/lib/api/types"

// Form schema for adding an invitation
const invitationFormSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
}).required();

type InvitationFormValues = z.infer<typeof invitationFormSchema>

export default function InvitationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    invitations,
    pagination,
    isLoading,
    isError,
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
  } = useCompanyInvitationsList();

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form submission handler
  async function onSubmit(data: InvitationFormValues) {
    try {
      await sendInvitation(data.email);
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  }

  // Handle status filter change
  const onStatusFilterChange = (value: string) => {
    handleStatusChange(value === 'all' ? undefined : value);
  };

  // Get status badge
  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="success">
            <CheckCircle className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        )
      default:
        return null
    }
  }

  // Format date as relative or full
  const formatDate = (dateString: string, showFull: boolean = false) => {
    const date = new Date(dateString);
    if (showFull) {
      return format(date, 'PPP p'); // Full date and time
    }
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Actions for invitations
  function InvitationActions({ invitation }: { invitation: CompanyInvitation }) {
    const [isActioning, setIsActioning] = useState<string | null>(null);

    const handleResend = async () => {
      setIsActioning('resend');
      try {
        await resendInvitation(invitation.id);
      } finally {
        setIsActioning(null);
      }
    };

    const handleRevoke = async () => {
      setIsActioning('revoke');
      try {
        await revokeInvitation(invitation.id);
      } finally {
        setIsActioning(null);
      }
    };

    if (invitation.status === "pending") {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={handleResend}
            disabled={isActioning === 'resend'}
          >
            {isActioning === 'resend' ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3 w-3" />
            )}
            Resend
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-red-600"
            onClick={handleRevoke}
            disabled={isActioning === 'revoke'}
          >
            {isActioning === 'revoke' ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-3 w-3" />
            )}
            Revoke
          </Button>
        </div>
      )
    } else {
      return null;
    }
  }

  // Table columns
  const columns = [
    {
      header: "Email",
      accessorKey: "email" as const,
      cell: (invitation: CompanyInvitation) => <span className="font-medium">{invitation.email}</span>,
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (invitation: CompanyInvitation) => getStatusBadge(invitation.status),
    },
    {
      header: "Created",
      accessorKey: "createdAt" as const,
      cell: (invitation: CompanyInvitation) => (
        <span title={formatDate(invitation.createdAt, true)}>
          {formatDate(invitation.createdAt)}
        </span>
      ),
    },
    {
      header: "Expires",
      accessorKey: "expiresAt" as const,
      cell: (invitation: CompanyInvitation) => (
        <span title={formatDate(invitation.expiresAt, true)}>
          {formatDate(invitation.expiresAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (invitation: CompanyInvitation) => <InvitationActions invitation={invitation} />,
      className: "text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Invitations</h1>
          <p className="text-muted-foreground">
            Send and manage pending invitations for new companies.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="pl-3">
              <Plus className="mr-2 h-4 w-4" />
              New Invitation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send New Invitation</DialogTitle>
              <DialogDescription>
                Send an invitation to create a new company. The recipient will receive an email with instructions.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter email address" 
                          {...field} 
                          autoComplete="off" 
                        />
                      </FormControl>
                      <FormDescription>
                        The invitation will be sent to this email address.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isSendingInvitation}
                    className="w-full sm:w-auto"
                  >
                    {isSendingInvitation && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Manage Invitations</CardTitle>
          <CardDescription>
            View and manage all pending and past invitations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by email..."
                  className="pl-8 w-full md:w-[260px]"
                  value={search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select 
                value={status || 'all'} 
                onValueChange={onStatusFilterChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={pagination?.limit.toString() || '10'}
                onValueChange={(value) => handleLimitChange(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load invitations. Please try again.</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2" />
              <p>No invitations found.</p>
            </div>
          ) : (
            <ResponsiveTable
              data={invitations}
              columns={columns}
              pagination={{
                currentPage: pagination?.page || 1,
                totalPages: pagination?.totalPages || 1,
                onPageChange: handlePageChange
              }}
            />
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.page > 1) {
                          handlePageChange(pagination.page - 1);
                        }
                      }}
                      aria-disabled={pagination.page === 1}
                      className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.page < pagination.totalPages) {
                          handlePageChange(pagination.page + 1);
                        }
                      }}
                      aria-disabled={pagination.page >= pagination.totalPages}
                      className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
