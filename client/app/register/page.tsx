"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ArrowRight, Check, AlertCircle, Eye, EyeOff } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { FormFieldFeedback } from "@/components/ui/form-field-feedback"
import { cn } from "@/lib/utils"

// Import the registration schema
import { registrationSchema, type RegistrationFormValues } from "@/lib/validations/auth"

interface CompanyData {
  id: string;
  name?: string;
  logo?: string | null;
  banner?: string | null;
  [key: string]: any;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyBanner, setCompanyBanner] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, error, clearError } = useAuth()

  // Check for company ID in the URL (from iframe redirect)
  useEffect(() => {
    const slug = searchParams.get('company')
    if (slug) {
      // Fetch company information using the ID
      const fetchCompanyInfo = async () => {
        try {
          const response = await fetch(`/api/company/by-subdomain/${slug}`)
          if (response.ok) {
            const companyData: CompanyData = await response.json()
            console.log('Fetched company data:', companyData)
            
            // Always use any data available, with fallbacks
            setCompanyName(companyData.name || 'SparrowX')
            setCompanyLogo(companyData.logo || null)
            setCompanyBanner(companyData.banner || null)
            setCompanyId(companyData.id)
            
            // Log what we're setting for debugging
            console.log('Setting company display data:', {
              name: companyData.name || 'SparrowX',
              logo: companyData.logo ? 'Found' : 'Not found',
              banner: companyData.banner ? 'Found' : 'Not found'
            })
          }
        } catch (err) {
          console.error("Error fetching company info:", err)
        }
      }
      fetchCompanyInfo()
    }
  }, [searchParams])

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      trn: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onChange", // Enable validation as fields change
  })

  // Form submission handler
  const onSubmit = async (data: RegistrationFormValues) => {
    setIsSubmitting(true)
    
    try {
      // Include companyId in registration data if available
      const registrationData = {
        ...data,
        companyId: companyId || undefined
      }
      
      const result = await register(registrationData)
      if (result.success) {
        // Redirect to login page with success message
        router.push('/login?registered=true')
      } else {
        form.setError("root", { 
          type: "manual",
          message: result.message || "Registration failed" 
        })
      }
    } catch (error) {
      console.error("Registration error:", error)
      form.setError("root", { 
        type: "manual",
        message: "An unexpected error occurred" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Clear any auth provider errors when form changes
  useEffect(() => {
    if (error) clearError()
  }, [form.formState.isDirty, error, clearError])

  // Check if password meets all requirements
  const passwordValue = form.watch("password")
  const hasLowercase = /[a-z]/.test(passwordValue)
  const hasUppercase = /[A-Z]/.test(passwordValue)
  const hasNumber = /[0-9]/.test(passwordValue)
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(passwordValue)
  const isLongEnough = passwordValue.length >= 8

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - Branding */}
      <div 
        className={`flex flex-col justify-between bg-primary p-8 text-white md:w-1/2 lg:p-12 ${companyBanner ? 'relative' : ''}`}
      >
        {companyBanner && (
          <div className="absolute inset-0 z-0">
            <Image
              src={companyBanner}
              alt={`${companyName} banner`}
              fill
              style={{objectFit: 'cover'}}
              className="opacity-20"
            />
          </div>
        )}
        <div className="relative z-10">
          <div className="mb-8 w-48">
            <Image
              src={companyLogo || "/placeholder.svg?key=e5zuj"}
              alt={companyName ? `${companyName} Logo` : "SparrowX Logo"}
              width={180}
              height={60}
              className="h-auto w-full"
            />
          </div>
          <h1 className="mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
            Join <span className="text-primary-foreground">{companyName || "SparrowX"}</span>
          </h1>
          <p className="mb-6 max-w-md text-lg text-primary-foreground/90">
            Create your account to start tracking packages, manage pre-alerts, and access our full range of forwarding
            services.
          </p>
        </div>
        <div className="hidden md:block">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} {companyName ? `${companyName} | ` : ''}
            <span className="text-primary-foreground">Powered by SparrowX</span>
          </p>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 md:w-1/2 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
            <p className="text-sm text-muted-foreground">Enter your details below to create your account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name Field */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="John"
                            {...field}
                            autoComplete="given-name"
                            className={cn(
                              "pr-10",
                              form.formState.dirtyFields.firstName &&
                                !form.formState.errors.firstName &&
                                "border-green-500 focus-visible:ring-green-500",
                              form.formState.errors.firstName && "border-red-500 focus-visible:ring-red-500",
                            )}
                          />
                        </FormControl>
                        {form.formState.dirtyFields.firstName && !form.formState.errors.firstName && (
                          <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
                        )}
                        {form.formState.errors.firstName && (
                          <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                        )}
                      </div>
                      <FormMessage className="flex items-center gap-1 text-red-500">
                        {form.formState.errors.firstName && <AlertCircle className="h-3.5 w-3.5" />}
                        {form.formState.errors.firstName?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                {/* Last Name Field */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            {...field}
                            autoComplete="family-name"
                            className={cn(
                              "pr-10",
                              form.formState.dirtyFields.lastName &&
                                !form.formState.errors.lastName &&
                                "border-green-500 focus-visible:ring-green-500",
                              form.formState.errors.lastName && "border-red-500 focus-visible:ring-red-500",
                            )}
                          />
                        </FormControl>
                        {form.formState.dirtyFields.lastName && !form.formState.errors.lastName && (
                          <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
                        )}
                        {form.formState.errors.lastName && (
                          <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                        )}
                      </div>
                      <FormMessage className="flex items-center gap-1 text-red-500">
                        {form.formState.errors.lastName && <AlertCircle className="h-3.5 w-3.5" />}
                        {form.formState.errors.lastName?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="name@company.com"
                          {...field}
                          type="email"
                          autoComplete="email"
                          className={cn(
                            "pr-10",
                            form.formState.dirtyFields.email &&
                              !form.formState.errors.email &&
                              "border-green-500 focus-visible:ring-green-500",
                            form.formState.errors.email && "border-red-500 focus-visible:ring-red-500",
                          )}
                        />
                      </FormControl>
                      {form.formState.dirtyFields.email && !form.formState.errors.email && (
                        <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
                      )}
                      {form.formState.errors.email && (
                        <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                      )}
                    </div>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.email && <AlertCircle className="h-3.5 w-3.5" />}
                      {form.formState.errors.email?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Registration Number (TRN)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="123456789"
                          {...field}
                          className={cn(
                            "pr-10",
                            form.formState.dirtyFields.trn &&
                              !form.formState.errors.trn &&
                              "border-green-500 focus-visible:ring-green-500",
                            form.formState.errors.trn && "border-red-500 focus-visible:ring-red-500",
                          )}
                        />
                      </FormControl>
                      {form.formState.dirtyFields.trn && !form.formState.errors.trn && (
                        <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
                      )}
                      {form.formState.errors.trn && (
                        <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                      )}
                    </div>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.trn && <AlertCircle className="h-3.5 w-3.5" />}
                      {form.formState.errors.trn?.message}
                    </FormMessage>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your Tax Registration Number is required for customs processing.
                    </p>
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          autoComplete="new-password"
                          className={cn(
                            "pr-10",
                            passwordValue &&
                              isLongEnough &&
                              hasLowercase &&
                              hasUppercase &&
                              hasNumber &&
                              hasSpecialChar &&
                              !form.formState.errors.password &&
                              "border-green-500 focus-visible:ring-green-500",
                            form.formState.errors.password && "border-red-500 focus-visible:ring-red-500",
                          )}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.password && <AlertCircle className="h-3.5 w-3.5" />}
                      {form.formState.errors.password?.message}
                    </FormMessage>

                    {/* Password requirements checklist */}
                    {passwordValue && (
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="font-medium">Password must contain:</p>
                        <ul className="space-y-1">
                          <li
                            className={cn(
                              "flex items-center gap-1",
                              isLongEnough ? "text-green-600" : "text-muted-foreground",
                            )}
                          >
                            {isLongEnough ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            At least 8 characters
                          </li>
                          <li
                            className={cn(
                              "flex items-center gap-1",
                              hasLowercase ? "text-green-600" : "text-muted-foreground",
                            )}
                          >
                            {hasLowercase ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            One lowercase letter
                          </li>
                          <li
                            className={cn(
                              "flex items-center gap-1",
                              hasUppercase ? "text-green-600" : "text-muted-foreground",
                            )}
                          >
                            {hasUppercase ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            One uppercase letter
                          </li>
                          <li
                            className={cn(
                              "flex items-center gap-1",
                              hasNumber ? "text-green-600" : "text-muted-foreground",
                            )}
                          >
                            {hasNumber ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            One number
                          </li>
                          <li
                            className={cn(
                              "flex items-center gap-1",
                              hasSpecialChar ? "text-green-600" : "text-muted-foreground",
                            )}
                          >
                            {hasSpecialChar ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            One special character
                          </li>
                        </ul>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          {...field}
                          autoComplete="new-password"
                          className={cn(
                            "pr-10",
                            field.value &&
                              field.value === passwordValue &&
                              !form.formState.errors.confirmPassword &&
                              "border-green-500 focus-visible:ring-green-500",
                            form.formState.errors.confirmPassword && "border-red-500 focus-visible:ring-red-500",
                          )}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.confirmPassword && <AlertCircle className="h-3.5 w-3.5" />}
                      {form.formState.errors.confirmPassword?.message}
                    </FormMessage>

                    <FormFieldFeedback
                      isDirty={!!field.value}
                      isValid={!!field.value && field.value === passwordValue}
                      errorMessage={field.value && field.value !== passwordValue ? "Passwords do not match" : undefined}
                      successMessage="Passwords match"
                    />
                  </FormItem>
                )}
              />

              {/* Terms and Conditions */}
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        className={cn(form.formState.errors.terms && "border-red-500")}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          terms of service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          privacy policy
                        </Link>
                      </FormLabel>
                      {form.formState.errors.terms && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {form.formState.errors.terms.message}
                        </p>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse">Creating account...</span>
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Show form errors */}
              {form.formState.errors.root && (
                <div className="text-sm text-red-500 text-center mt-2">
                  {form.formState.errors.root.message}
                </div>
              )}
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>


          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground md:hidden">
          © {new Date().getFullYear()} SparrowX. All rights reserved.
        </div>
      </div>
    </div>
  )
}
