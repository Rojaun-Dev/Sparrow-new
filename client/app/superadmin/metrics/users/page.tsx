import { Users } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function UserMetricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Analytics</h1>
        <p className="text-muted-foreground">
          Analyze user engagement, activity patterns, and behavior across the platform.
        </p>
      </div>

      <FeatureInProgress
        title="User Analytics Coming Soon"
        description="Our comprehensive user analytics dashboard is currently in development. It will provide detailed insights into user behavior, engagement patterns, and activity trends across all tenants."
        icon={<Users className="h-8 w-8" />}
      />
    </div>
  )
}
