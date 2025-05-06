import { Palette } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function PlatformBrandingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Branding</h1>
        <p className="text-muted-foreground">Configure global branding settings for the platform.</p>
      </div>

      <FeatureInProgress
        title="Platform Branding Coming Soon"
        description="Our platform branding dashboard is currently in development. It will provide advanced settings for customizing the platform's appearance, including logos, colors, and themes across all tenants."
        icon={<Palette className="h-8 w-8" />}
      />
    </div>
  )
}
