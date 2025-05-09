"use client"

// Config to prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Check, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the form schema
const createCompanySchema = z.object({
  name: z
    .string({ required_error: "Company name is required" })
    .min(2, { message: "Company name must be at least 2 characters" })
    .trim(),
  subdomain: z
    .string({ required_error: "Subdomain is required" })
    .min(3, { message: "Subdomain must be at least 3 characters" })
    .max(20, { message: "Subdomain must be at most 20 characters" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Subdomain can only contain lowercase letters, numbers, and hyphens",
    })
    .trim(),
  adminEmail: z
    .string({ required_error: "Admin email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
})

type CreateCompanyFormValues = z.infer<typeof createCompanySchema>

export default function CreateCompanyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: "",
      subdomain: "",
      adminEmail: "",
    },
    mode: "onChange",
  })

  // Form submission handler
  async function onSubmit(data: CreateCompanyFormValues) {
    setIsSubmitting(true)
    console.log("Form submitted:", data)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real implementation, this would call an API to create the company
    setIsSubmitting(false)
    setIsSuccess(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Company</h1>
        <p className="text-muted-foreground">Add a new company to the SparrowX platform.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>
            Enter the details for the new company. This will create a new tenant in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <Alert className="bg-green-50 border-green-500">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Company created successfully!</AlertTitle>
              <AlertDescription className="text-green-700">
                The company has been created and the admin has been invited.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Shipping" {...field} />
                      </FormControl>
                      <FormDescription>The full name of the company as it will appear in the system.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomain</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input placeholder="acme" {...field} />
                          <span className="ml-2 text-muted-foreground">.sparrowx.com</span>
                        </div>
                      </FormControl>
                      <FormDescription>The subdomain will be used for the company's portal URL.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@company.com" type="email" {...field} />
                      </FormControl>
                      <FormDescription>The email of the primary admin who will receive an invitation.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/superadmin/companies">Cancel</Link>
          </Button>
          {!isSuccess && (
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Company"
              )}
            </Button>
          )}
          {isSuccess && (
            <Button asChild>
              <Link href="/superadmin/companies">Back to Companies</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
