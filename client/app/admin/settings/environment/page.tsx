import { Server } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function EnvironmentInfoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Environment Information</h1>
        <p className="text-muted-foreground">View and manage platform environment settings and configuration.</p>
      </div>

      <FeatureInProgress
        title="Environment Information Coming Soon"
        description="Our environment information dashboard is currently in development. It will provide detailed insights into the platform's configuration, environment variables, and system health metrics."
        icon={<Server className="h-8 w-8" />}
      />
    </div>
  )
}
