"use client"

import { DrawerFooter } from "@/components/ui/drawer"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, MoreHorizontal, Edit, Trash, Copy, Tag, Loader2, Check, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ResponsiveTable } from "@/components/ui/responsive-table"

// Import the useFeedback hook and ConfirmationDialog component
import { useFeedback } from "@/components/ui/toast-provider"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

// Mock data for fee templates
const feeTemplates = [
  {
    id: "1",
    name: "Standard Shipping Fee",
    feeType: "Service",
    calculationMethod: "flat",
    amount: 15.0,
    currency: "USD",
    appliesTo: ["standard", "regular"],
    description: "Standard shipping fee for regular packages",
    enabled: true,
  },
  {
    id: "2",
    name: "Express Handling",
    feeType: "Service",
    calculationMethod: "percent",
    amount: 10.0,
    currency: "USD",
    appliesTo: ["express", "priority"],
    description: "Express handling fee calculated as percentage of package value",
    enabled: true,
  },
  {
    id: "3",
    name: "Customs Processing",
    feeType: "Customs",
    calculationMethod: "flat",
    amount: 25.0,
    currency: "USD",
    appliesTo: ["international", "customs"],
    description: "Fee for processing customs documentation",
    enabled: true,
  },
  {
    id: "4",
    name: "Weight Surcharge",
    feeType: "Service",
    calculationMethod: "per_weight",
    amount: 2.5,
    currency: "USD",
    appliesTo: ["heavy", "oversize"],
    description: "Additional fee per pound for heavy packages",
    enabled: false,
  },
  {
    id: "5",
    name: "Tax",
    feeType: "Tax",
    calculationMethod: "percent",
    amount: 7.5,
    currency: "USD",
    appliesTo: ["all"],
    description: "Standard sales tax",
    enabled: true,
  },
]

// Form schema for fee template
const feeTemplateFormSchema = z.object({
  name: z
    .string({ required_error: "Template name is required" })
    .min(2, { message: "Template name must be at least 2 characters" })
    .trim(),
  feeType: z.enum(["Service", "Tax", "Customs"], {
    required_error: "Please select a fee type",
  }),
  calculationMethod: z.enum(["flat", "percent", "per_weight", "delayed", "tiered", "volume"], {
    required_error: "Please select a calculation method",
  }),
  amount: z.number({ required_error: "Amount is required" }).min(0, { message: "Amount must be a positive number" }),
  currency: z.string().default("USD"),
  appliesTo: z
    .string({ required_error: "Tags are required" })
    .min(1, { message: "At least one tag is required" })
    .trim(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
})

type FeeTemplateFormValues = z.infer<typeof feeTemplateFormSchema>

// Add the useFeedback hook inside the component
export default function FeeTemplatesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<(typeof feeTemplates)[0] | null>(null)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { showFeedback } = useFeedback()

  // Filter templates based on search query
  const filteredTemplates = feeTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.feeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.appliesTo.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<FeeTemplateFormValues>({
    resolver: zodResolver(feeTemplateFormSchema),
    defaultValues: {
      name: "",
      feeType: "Service",
      calculationMethod: "flat",
      amount: 0,
      currency: "USD",
      appliesTo: "",
      description: "",
      enabled: true,
    },
    mode: "onChange",
  })

  // Update the onSubmit function to use feedback
  async function onSubmit(data: FeeTemplateFormValues) {
    setIsSubmitting(true)
    console.log("Form submitted:", data)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, this would call an API to create/update the fee template
      showFeedback(
        isEditing
          ? `Fee template "${data.name}" has been updated successfully.`
          : `Fee template "${data.name}" has been created successfully.`,
        "success",
      )

      // Reset form and close dialog/drawer
      form.reset()
      setOpen(false)
    } catch (error) {
      console.error("Error submitting form:", error)
      showFeedback(
        isEditing
          ? "Failed to update fee template. Please try again."
          : "Failed to create fee template. Please try again.",
        "error",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a function to handle template deletion
  const handleDeleteTemplate = async (template: (typeof feeTemplates)[0]) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, this would call an API to delete the template
      console.log(`Deleting template ${template.id}`)

      // Show success feedback
      showFeedback(`Fee template "${template.name}" has been deleted successfully.`, "success")
    } catch (error) {
      console.error("Error deleting template:", error)
      showFeedback("Failed to delete fee template. Please try again.", "error")
    }
  }

  // Edit template handler
  function handleEditTemplate(template: (typeof feeTemplates)[0]) {
    setIsEditing(true)
    setCurrentTemplate(template)
    form.reset({
      name: template.name,
      feeType: template.feeType as "Service" | "Tax" | "Customs",
      calculationMethod: template.calculationMethod as
        | "flat"
        | "percent"
        | "per_weight"
        | "delayed"
        | "tiered"
        | "volume",
      amount: template.amount,
      currency: template.currency,
      appliesTo: template.appliesTo.join(", "),
      description: template.description,
      enabled: template.enabled,
    })
    setOpen(true)
  }

  // Add template handler
  function handleAddTemplate() {
    setIsEditing(false)
    setCurrentTemplate(null)
    form.reset({
      name: "",
      feeType: "Service",
      calculationMethod: "flat",
      amount: 0,
      currency: "USD",
      appliesTo: "",
      description: "",
      enabled: true,
    })
    setOpen(true)
  }

  // Clone template handler
  function handleCloneTemplate(template: (typeof feeTemplates)[0]) {
    setIsEditing(false)
    setCurrentTemplate(null)
    form.reset({
      name: `${template.name} (Copy)`,
      feeType: template.feeType as "Service" | "Tax" | "Customs",
      calculationMethod: template.calculationMethod as
        | "flat"
        | "percent"
        | "per_weight"
        | "delayed"
        | "tiered"
        | "volume",
      amount: template.amount,
      currency: template.currency,
      appliesTo: template.appliesTo.join(", "),
      description: template.description,
      enabled: template.enabled,
    })
    setOpen(true)
  }

  // Get calculation method display
  function getCalculationMethodDisplay(method: string) {
    switch (method) {
      case "flat":
        return "Flat Rate"
      case "percent":
        return "Percentage"
      case "per_weight":
        return "Per Weight"
      case "delayed":
        return "Delayed Calculation"
      case "tiered":
        return "Tiered Rate"
      case "volume":
        return "Volumetric"
      default:
        return method
    }
  }

  // Get amount display
  function getAmountDisplay(template: (typeof feeTemplates)[0]) {
    if (template.calculationMethod === "percent") {
      return `${template.amount}%`
    } else if (template.calculationMethod === "per_weight") {
      return `$${template.amount.toFixed(2)} per lb`
    } else {
      return `$${template.amount.toFixed(2)}`
    }
  }

  // Update the ActionsDropdown component to use ConfirmationDialog
  function ActionsDropdown({ template }: { template: (typeof feeTemplates)[0] }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCloneTemplate(template)}>
            <Copy className="mr-2 h-4 w-4" />
            Clone
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <ConfirmationDialog
              title="Delete Fee Template"
              description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
              confirmText="Delete"
              variant="destructive"
              onConfirm={() => handleDeleteTemplate(template)}
              trigger={
                <button className="flex w-full items-center text-red-600 focus:text-red-600">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </button>
              }
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Table columns
  const columns = [
    {
      header: "Template Name",
      accessorKey: "name" as const,
      cell: (template: (typeof feeTemplates)[0]) => <span className="font-medium">{template.name}</span>,
    },
    {
      header: "Fee Type",
      accessorKey: "feeType" as const,
    },
    {
      header: "Calculation",
      accessorKey: "calculationMethod" as const,
      cell: (template: (typeof feeTemplates)[0]) => getCalculationMethodDisplay(template.calculationMethod),
    },
    {
      header: "Rate/Amount",
      accessorKey: "amount" as const,
      cell: (template: (typeof feeTemplates)[0]) => getAmountDisplay(template),
    },
    {
      header: "Tags",
      accessorKey: "appliesTo" as const,
      cell: (template: (typeof feeTemplates)[0]) => (
        <div className="flex flex-wrap gap-1">
          {template.appliesTo.map((tag) => (
            <Badge key={tag} variant="outline" className="bg-primary/10">
              <Tag className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "enabled" as const,
      cell: (template: (typeof feeTemplates)[0]) => (
        <Badge variant={template.enabled ? "success" : "outline"} className={!template.enabled ? "bg-muted" : ""}>
          {template.enabled ? (
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Enabled
            </div>
          ) : (
            "Disabled"
          )}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (template: (typeof feeTemplates)[0]) => <ActionsDropdown template={template} />,
      className: "text-right",
    },
  ]

  // Form component that works with both Dialog and Drawer
  const FormContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input placeholder="Standard Shipping Fee" {...field} />
              </FormControl>
              <FormDescription>A descriptive name for this fee template.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="feeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a fee type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Tax">Tax</SelectItem>
                    <SelectItem value="Customs">Customs</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>The category of this fee.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="calculationMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calculation Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a calculation method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="flat">Flat Rate</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="per_weight">Per Weight</SelectItem>
                    <SelectItem value="delayed">Delayed Calculation</SelectItem>
                    <SelectItem value="tiered">Tiered Rate</SelectItem>
                    <SelectItem value="volume">Volumetric</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>How this fee will be calculated.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  {form.watch("calculationMethod") === "percent"
                    ? "Percentage value (e.g., 10 for 10%)"
                    : form.watch("calculationMethod") === "per_weight"
                      ? "Amount per pound"
                      : "Fixed amount"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>The currency for this fee.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="appliesTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Applies To Tags</FormLabel>
              <FormControl>
                <Input placeholder="standard, express, international" {...field} />
              </FormControl>
              <FormDescription>Comma-separated tags that determine when this fee applies.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description of this fee template..." {...field} />
              </FormControl>
              <FormDescription>Optional description for this fee template.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enabled</FormLabel>
                <FormDescription>When disabled, this fee template won't be available for use.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Global Fee Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable fee templates that can be applied across all tenants for consistency.
          </p>
        </div>
        <Button onClick={handleAddTemplate} className="mt-2 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Fee Templates</CardTitle>
          <CardDescription>A list of all fee templates available for use across tenants.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ResponsiveTable data={filteredTemplates} columns={columns} />
        </CardContent>
      </Card>

      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Fee Template" : "Create Fee Template"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the fee template details below."
                  : "Create a new fee template that can be applied across tenants."}
              </DialogDescription>
            </DialogHeader>
            {FormContent}
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update Template" : "Create Template"}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{isEditing ? "Edit Fee Template" : "Create Fee Template"}</DrawerTitle>
              <DrawerDescription>
                {isEditing
                  ? "Update the fee template details below."
                  : "Create a new fee template that can be applied across tenants."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-2">{FormContent}</div>
            <DrawerFooter className="pt-2">
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update Template" : "Create Template"}</>
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
