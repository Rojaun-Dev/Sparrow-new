"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Check, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useInitiateCompanyOnboarding } from "@/hooks/useInitiateCompanyOnboarding"

// Define the form schema
const createCompanySchema = z.object({
  adminEmail: z
    .string({ required_error: "Admin email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
})

type CreateCompanyFormValues = z.infer<typeof createCompanySchema>

export default function CreateCompanyPage() {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)
  const initiateOnboarding = useInitiateCompanyOnboarding()

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      adminEmail: "",
    },
    mode: "onChange",
  })

  // Form submission handler
  async function onSubmit(data: CreateCompanyFormValues) {
    try {
      await initiateOnboarding.mutateAsync(data)
      setIsSuccess(true)
      // Redirect to companies list after 2 seconds
      setTimeout(() => {
        router.push('/superadmin/companies')
      }, 2000)
    } catch (error) {
      // Error is handled by the hook
      console.error('Error initiating onboarding:', error)
    }
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
            Enter the admin email to create a new company. An invitation will be sent to complete the setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <Alert className="bg-green-50 border-green-500">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Onboarding Initiated!</AlertTitle>
              <AlertDescription className="text-green-700">
                An invitation has been sent to the admin to complete the company setup.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@company.com" type="email" {...field} />
                      </FormControl>
                      <FormDescription>The email of the primary admin who will receive an invitation to complete the company setup.</FormDescription>
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
            <Button onClick={form.handleSubmit(onSubmit)} disabled={initiateOnboarding.isPending}>
              {initiateOnboarding.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating...
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
