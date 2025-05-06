"use client"

import { useFormContext } from "react-hook-form"
import type { CompanyRegistrationFormValues } from "@/lib/validations/company-registration"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

export function TermsAndPrivacyStep() {
  const form = useFormContext<CompanyRegistrationFormValues>()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Terms & Privacy</h2>
        <p className="text-muted-foreground">Please review and accept our terms and privacy policy.</p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Before proceeding, please carefully read and accept our terms of service and privacy policy.
        </AlertDescription>
      </Alert>

      <div className="space-y-6 pt-4">
        <div className="border rounded-md p-4 bg-muted/20">
          <h3 className="font-medium mb-2">Terms of Service Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">
            By using SparrowX services, you agree to comply with all applicable laws and regulations. SparrowX reserves
            the right to suspend or terminate services for violations of these terms. You are responsible for
            maintaining the security of your account credentials.
          </p>
          <Link href="#" className="text-sm text-primary hover:underline">
            Read the full Terms of Service
          </Link>
        </div>

        <div className="border rounded-md p-4 bg-muted/20">
          <h3 className="font-medium mb-2">Privacy Policy Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">
            SparrowX collects and processes personal data to provide and improve our services. We implement appropriate
            security measures to protect your data. You have the right to access, correct, or delete your personal data.
          </p>
          <Link href="#" className="text-sm text-primary hover:underline">
            Read the full Privacy Policy
          </Link>
        </div>

        <FormField
          control={form.control}
          name="termsAndPrivacy.acceptTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I accept the Terms of Service</FormLabel>
                <FormDescription>You must accept the Terms of Service to continue.</FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termsAndPrivacy.acceptPrivacy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I accept the Privacy Policy</FormLabel>
                <FormDescription>You must accept the Privacy Policy to continue.</FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
