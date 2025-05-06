"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { companyRegistrationSchema, type CompanyRegistrationFormValues } from "@/lib/validations/company-registration"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Import step components
import { BasicInfoStep } from "./steps/basic-info-step"
import { ContactInfoStep } from "./steps/contact-info-step"
import { LegalInfoStep } from "./steps/legal-info-step"
import { AdminInfoStep } from "./steps/admin-info-step"
import { TermsAndPrivacyStep } from "./steps/terms-and-privacy-step"
import { ReviewStep } from "./steps/review-step"

const steps = [
  { id: "basic-info", label: "Basic Info" },
  { id: "contact-info", label: "Contact Info" },
  { id: "legal-info", label: "Legal Info" },
  { id: "admin-info", label: "Admin Info" },
  { id: "terms-and-privacy", label: "Terms & Privacy" },
  { id: "review", label: "Review" },
]

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Initialize form with default values
  const form = useForm<CompanyRegistrationFormValues>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: {
      basicInfo: {
        name: "",
        legalName: "",
        subdomain: "",
        website: "",
        industry: "",
        companySize: "1-10",
      },
      contactInfo: {
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      legalInfo: {
        skipLegalInfo: false,
        taxId: "",
        registrationNumber: "",
        incorporationDate: "",
        legalEntity: "LLC",
      },
      adminInfo: {
        firstName: "",
        lastName: "",
        email: "",
        jobTitle: "",
        phone: "",
      },
      termsAndPrivacy: {
        acceptTerms: false,
        acceptPrivacy: false,
      },
    },
    mode: "onChange",
  })

  // Get form state
  const { formState, watch } = form
  const { isValid } = formState
  const skipLegalInfo = watch("legalInfo.skipLegalInfo")

  // Check if current step is valid
  const isCurrentStepValid = () => {
    const currentStepId = steps[currentStep].id

    switch (currentStepId) {
      case "basic-info":
        return Object.keys(formState.errors.basicInfo || {}).length === 0
      case "contact-info":
        return Object.keys(formState.errors.contactInfo || {}).length === 0
      case "legal-info":
        // If skipLegalInfo is true, consider the step valid
        return skipLegalInfo || Object.keys(formState.errors.legalInfo || {}).length === 0
      case "admin-info":
        return Object.keys(formState.errors.adminInfo || {}).length === 0
      case "terms-and-privacy":
        return Object.keys(formState.errors.termsAndPrivacy || {}).length === 0
      case "review":
        return true
      default:
        return false
    }
  }

  // Handle next step
  const handleNext = async () => {
    const currentStepId = steps[currentStep].id

    // Validate current step
    let isStepValid = false

    switch (currentStepId) {
      case "basic-info":
        isStepValid = await form.trigger("basicInfo", { shouldFocus: true })
        break
      case "contact-info":
        isStepValid = await form.trigger("contactInfo", { shouldFocus: true })
        break
      case "legal-info":
        // If skipLegalInfo is true, consider the step valid without validation
        if (skipLegalInfo) {
          isStepValid = true
        } else {
          isStepValid = await form.trigger("legalInfo", { shouldFocus: true })
        }
        break
      case "admin-info":
        isStepValid = await form.trigger("adminInfo", { shouldFocus: true })
        break
      case "terms-and-privacy":
        isStepValid = await form.trigger("termsAndPrivacy", { shouldFocus: true })
        break
      case "review":
        isStepValid = true
        break
    }

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  // Handle form submission
  const onSubmit = async (data: CompanyRegistrationFormValues) => {
    setIsSubmitting(true)

    try {
      // If legal info is skipped, set default values or remove the section
      if (data.legalInfo.skipLegalInfo) {
        // You can either set default values
        data.legalInfo = {
          ...data.legalInfo,
          taxId: "N/A",
          registrationNumber: "N/A",
          incorporationDate: "N/A",
          legalEntity: "Other",
        }

        // Or you could remove the section entirely if your backend supports it
        // delete data.legalInfo;
      }

      // Simulate API call
      console.log("Form submitted:", data)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Set success state
      setIsSuccess(true)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render current step
  const renderStep = () => {
    const currentStepId = steps[currentStep].id

    switch (currentStepId) {
      case "basic-info":
        return <BasicInfoStep />
      case "contact-info":
        return <ContactInfoStep />
      case "legal-info":
        return <LegalInfoStep />
      case "admin-info":
        return <AdminInfoStep />
      case "terms-and-privacy":
        return <TermsAndPrivacyStep />
      case "review":
        return <ReviewStep />
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border",
                  index < currentStep
                    ? "bg-green-100 border-green-500 text-green-700"
                    : index === currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  index === currentStep ? "text-primary" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 h-1 bg-muted w-full rounded-full" />
          <div
            className="absolute top-0 left-0 h-1 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <Card className="w-full">
        <CardContent className="pt-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Your company registration has been submitted successfully. You will receive a confirmation email
                shortly.
              </p>
              <Button asChild>
                <a href="/">Return to Home</a>
              </Button>
            </div>
          ) : (
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {renderStep()}

                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || isSubmitting}
                  >
                    Previous
                  </Button>

                  {currentStep === steps.length - 1 ? (
                    <Button type="submit" disabled={!isValid || isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Registration"
                      )}
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleNext} disabled={!isCurrentStepValid() || isSubmitting}>
                      Next
                    </Button>
                  )}
                </div>
              </form>
            </FormProvider>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
