import type { Metadata } from "next"
import { MultiStepForm } from "@/components/company-registration/multi-step-form"

export const metadata: Metadata = {
  title: "Company Registration | SparrowX",
  description: "Register your company with SparrowX package forwarding platform",
}

export default function CompanyRegistrationPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Company Registration</h1>
        <p className="mt-2 text-muted-foreground">
          Register your company with SparrowX to start using our package forwarding services.
        </p>
      </div>

      <MultiStepForm />
    </div>
  )
}
