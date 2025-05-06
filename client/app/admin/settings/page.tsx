import { Settings } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure global platform settings, integrations, and defaults.</p>
      </div>

      <FeatureInProgress
        title="Settings Dashboard Coming Soon"
        description="Our comprehensive settings dashboard is currently in development. It will provide advanced configuration options for Auth0 integration, platform branding, and environment settings."
        icon={<Settings className="h-8 w-8" />}
      />
    </div>
  )
}
