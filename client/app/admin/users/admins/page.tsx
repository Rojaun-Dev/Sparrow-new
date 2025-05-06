"use client"

import { useState } from "react"
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

// Import the useFeedback hook
import { useFeedback } from "@/components/ui/toast-provider"

// Mock data for admins
const admins = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Owner",
    status: "active",
    lastLogin: "2023-09-15 14:32",
    avatarUrl: "",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Super Admin",
    status: "active",
    lastLogin: "2023-09-14 09:45",
    avatarUrl: "",
  },
  {
    id: "3",
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    role: "Super Admin",
    status: "suspended",
    lastLogin: "2023-08-30 16:20",
    avatarUrl: "",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    role: "Super Admin",
    status: "active",
    lastLogin: "2023-09-12 11:15",
    avatarUrl: "",
  },
]

// Form schema for adding/editing an admin
const adminFormSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
  role: z.enum(["Owner", "Super Admin"], {
    required_error: "Please select a role",
  }),
  sendEmail: z.boolean().default(true),
})

type AdminFormValues = z.infer<typeof adminFormSchema>

// Add the useFeedback hook inside the component
export default function AdminsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<(typeof admins)[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { showFeedback } = useFeedback()

  // Filter admins based on search query
  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      email: "",
      role: "Super Admin",
      sendEmail: true,
    },
    mode: "onChange",
  })

  // Update the onSubmit function to use feedback
  async function onSubmit(data: AdminFormValues) {
    setIsSubmitting(true)
    console.log("Form submitted:", data)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, this would call an API to create/update the admin
      showFeedback(
        isEditing
          ? `Admin "${data.email}" has been updated successfully.`
          : `Admin "${data.email}" has been added successfully.`,
        "success",
      )

      // Reset form and close dialog
      form.reset()
      document.getElementById("close-admin-dialog")?.click()
    } catch (error) {
      console.error("Error submitting form:", error)
      showFeedback(
        isEditing ? "Failed to update admin. Please try again." : "Failed to add admin. Please try again.",
        "error",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit admin handler
  function handleEditAdmin(admin: (typeof admins)[0]) {
    setIsEditing(true)
    setCurrentAdmin(admin)
    form.reset({
      email: admin.email,
      role: admin.role as "Owner" | "Super Admin",
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
      role: "Super Admin",
      sendEmail: true,
    })
    document.getElementById("open-admin-dialog")?.click()
  }

  // Get initials for avatar
  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Actions dropdown
  function ActionsDropdown({ admin }: { admin: (typeof admins)[0] }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEditAdmin(admin)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {admin.status === "active" ? (
            <DropdownMenuItem className="text-amber-600">
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-green-600">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Activate
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-red-600" disabled={admin.role === "Owner"}>
            <Trash className="mr-2 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Table columns
  const columns = [
    {
      header: "Name",
      accessorKey: "name" as const,
      cell: (admin: (typeof admins)[0]) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={admin.avatarUrl || "/placeholder.svg"} alt={admin.name} />
            <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{admin.name}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email" as const,
    },
    {
      header: "Role",
      accessorKey: "role" as const,
      cell: (admin: (typeof admins)[0]) => (
        <div className="flex items-center gap-2">
          {admin.role === "Owner" ? (
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          ) : (
            <Shield className="h-4 w-4 text-primary" />
          )}
          {admin.role}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (admin: (typeof admins)[0]) => (
        <Badge variant={admin.status === "active" ? "success" : "destructive"}>
          {admin.status === "active" ? (
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
      accessorKey: "lastLogin" as const,
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (admin: (typeof admins)[0]) => <ActionsDropdown admin={admin} />,
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
        <Button onClick={handleAddAdmin} className="mt-2 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>

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
                          <SelectItem value="Owner">Owner</SelectItem>
                          <SelectItem value="Super Admin">Super Admin</SelectItem>
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ResponsiveTable data={filteredAdmins} columns={columns} />
        </CardContent>
      </Card>
    </div>
  )
}
