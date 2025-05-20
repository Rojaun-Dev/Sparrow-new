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

// Mock data for invitations
const invitations = [
  {
    id: "1",
    email: "john.doe@example.com",
    role: "admin_l1",
    status: "pending",
    sentAt: "2023-09-15 14:32",
  },
  {
    id: "2",
    email: "jane.smith@example.com",
    role: "admin_l2",
    status: "pending",
    sentAt: "2023-09-14 09:45",
  },
  {
    id: "3",
    email: "robert.johnson@example.com",
    role: "super_admin",
    status: "expired",
    sentAt: "2023-08-30 16:20",
  },
  {
    id: "4",
    email: "emily.davis@example.com",
    role: "admin_l1",
    status: "pending",
    sentAt: "2023-09-12 11:15",
  },
]

// Form schema for adding/editing an invitation
const invitationFormSchema = z.object({
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

type InvitationFormValues = z.infer<typeof invitationFormSchema>

export default function InvitationsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentInvitation, setCurrentInvitation] = useState<(typeof invitations)[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter invitations based on search query
  const filteredInvitations = invitations.filter(
    (invitation) =>
      invitation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: "",
      role: "admin_l1",
      sendEmail: true,
    },
  })

  // Form submission handler
  async function onSubmit(data: InvitationFormValues) {
    try {
      setIsSubmitting(true)
      console.log("Form submitted:", data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, this would call an API to send the invitation
      setIsSubmitting(false)

      // Reset form and close dialog
      form.reset()
      document.getElementById("close-invitation-dialog")?.click()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
      default:
        return null
    }
  }

  // Actions for invitations
  function InvitationActions({ invitation }: { invitation: (typeof invitations)[0] }) {
    if (invitation.status === "pending") {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <RefreshCw className="mr-2 h-3 w-3" />
            Resend
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-red-600">
            <XCircle className="mr-2 h-3 w-3" />
            Revoke
          </Button>
        </div>
      )
    } else if (invitation.status === "expired") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend
            </DropdownMenuItem>
            <DropdownMenuItem>
              <XCircle className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    } else {
      return (
        <Button variant="ghost" size="sm" className="h-8">
          <Mail className="mr-2 h-4 w-4" />
          Contact
        </Button>
      )
    }
  }

  // Table columns
  const columns = [
    {
      header: "Email",
      accessorKey: "email" as const,
      cell: (invitation: (typeof invitations)[0]) => <span className="font-medium">{invitation.email}</span>,
    },
    {
      header: "Role",
      accessorKey: "role" as const,
    },
    {
      header: "Sent At",
      accessorKey: "sentAt" as const,
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (invitation: (typeof invitations)[0]) => getStatusBadge(invitation.status),
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (invitation: (typeof invitations)[0]) => <InvitationActions invitation={invitation} />,
      className: "text-right",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Invitations</h1>
          <p className="text-muted-foreground">
            Send and manage pending invitations for new super admins or system-wide collaborators.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-2 sm:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              New Invitation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send Invitation</DialogTitle>
              <DialogDescription>
                Invite a new admin to the platform. They will receive an email with instructions.
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
                      <FormDescription>The email address of the person you want to invite.</FormDescription>
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
                        <FormDescription>An email with instructions will be sent to the invitee.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Invitation"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
          <DialogClose asChild>
            <button className="hidden" id="close-invitation-dialog">
              Close
            </button>
          </DialogClose>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
          <CardDescription>A list of all invitations sent to potential platform admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invitations..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ResponsiveTable data={filteredInvitations} columns={columns} />
        </CardContent>
      </Card>
    </div>
  )
}
