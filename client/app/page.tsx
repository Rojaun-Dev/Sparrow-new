"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ArrowRight, Check, AlertCircle, Eye, EyeOff } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import apiClient from "@/lib/api-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { FormFieldFeedback } from "@/components/ui/form-field-feedback"
import { cn } from "@/lib/utils"

// Import the login schema
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const { login, error, clearError } = useAuth()

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onChange",
  })

  // Manual form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      const values = form.getValues()
      
      // Direct API call to bypass TypeScript errors
      const response = await fetch(`${apiClient.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      })
      
      const result = await response.json()
      
      if (response.ok && result.token) {
        // Store token
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', result.token)
        }
        
        // Get user data
        const userResponse = await fetch(`${apiClient.API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${result.token}`
          }
        })
        
        if (userResponse.ok) {
          router.push('/dashboard')
        } else {
          setFormError('Failed to fetch user data after login')
        }
      } else {
        setFormError(result.message || 'Login failed')
      }
    } catch (error) {
      console.error("Login error:", error)
      setFormError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Clear any auth provider errors when form changes
  useEffect(() => {
    if (error) clearError()
    if (formError) setFormError(null)
  }, [form.formState.isDirty, error, clearError, formError])

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - Branding */}
      <div className="flex flex-col justify-between bg-primary p-8 text-white md:w-1/2 lg:p-12">
        <div>
          <div className="mb-8 w-48">
            <Image
              src="/placeholder.svg?key=e5zuj"
              alt="SparrowX Logo"
              width={180}
              height={60}
              className="h-auto w-full"
            />
          </div>
          <h1 className="mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
            Welcome to <span className="text-primary-foreground">SparrowX</span>
          </h1>
          <p className="mb-6 max-w-md text-lg text-primary-foreground/90">
            Your trusted package forwarding service. Login to track your shipments, manage pre-alerts, and more.
          </p>
        </div>
        <div className="hidden md:block">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} SparrowX. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 md:w-1/2 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Login to your account</h2>
            <p className="text-sm text-muted-foreground">Enter your email and password to access your dashboard</p>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot your password?
                      </Link>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          autoComplete="current-password"
                          className={cn(
                            "pr-10",
                            field.value &&
                              field.value.length >= 8 &&
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

                    <FormFieldFeedback
                      isDirty={!!field.value}
                      isValid={!!field.value && field.value.length >= 8}
                      errorMessage={
                        field.value && field.value.length > 0 && field.value.length < 8
                          ? "Password must be at least 8 characters"
                          : undefined
                      }
                      successMessage="Password meets requirements"
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked || false)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">Remember me for 30 days</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse">Signing in...</span>
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Show form errors */}
              {formError && (
                <div className="text-sm text-red-500 text-center">
                  {formError}
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

          <div className="flex justify-center">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/register">
                Create an account
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Sign up
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
