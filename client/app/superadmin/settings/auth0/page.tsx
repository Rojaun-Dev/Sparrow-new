import { Lock } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function Auth0ConfigPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auth0 Configuration</h1>
        <p className="text-muted-foreground">Configure Auth0 integration settings for the platform.</p>
      </div>

      <FeatureInProgress
        title="Auth0 Configuration Coming Soon"
        description="Our Auth0 configuration dashboard is currently in development. It will provide advanced settings for managing Auth0 Organizations, roles, and authentication flows across all tenants."
        icon={<Lock className="h-8 w-8" />}
      />
    </div>
  )
}
