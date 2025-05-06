"use client"

import { useFormContext } from "react-hook-form"
import type { CompanyRegistrationFormValues } from "@/lib/validations/company-registration"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export function LegalInfoStep() {
  const form = useFormContext<CompanyRegistrationFormValues>()
  const skipLegalInfo = form.watch("legalInfo.skipLegalInfo")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Legal Information</h2>
        <p className="text-muted-foreground">Provide your company's legal and tax information.</p>
      </div>

      <FormField
        control={form.control}
        name="legalInfo.skipLegalInfo"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Skip legal information</FormLabel>
              <FormDescription>Check this box if you want to provide legal information later.</FormDescription>
            </div>
          </FormItem>
        )}
      />

      {skipLegalInfo && (
        <Alert variant="info" className="bg-blue-50 border-blue-200 text-blue-800 mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            You've chosen to skip the legal information section. You can add this information later in your company
            settings.
          </AlertDescription>
        </Alert>
      )}

      {!skipLegalInfo && (
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="legalInfo.taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tax ID / EIN
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80">
                          Your company's Tax Identification Number or Employer Identification Number.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input placeholder="12-3456789" {...field} />
                </FormControl>
                <FormDescription>Your company's tax identification number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legalInfo.registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Business Registration Number
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80">Your company's official registration or incorporation number.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input placeholder="ABC123456" {...field} />
                </FormControl>
                <FormDescription>Your company's business registration number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legalInfo.incorporationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incorporation Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>The date your company was legally established.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legalInfo.legalEntity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Entity Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>The legal structure of your company.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  )
}
