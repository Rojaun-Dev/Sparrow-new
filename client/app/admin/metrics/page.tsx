import { BarChart3 } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function MetricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Metrics</h1>
        <p className="text-muted-foreground">Analyze platform performance and usage statistics across all tenants.</p>
      </div>

      <FeatureInProgress
        title="Metrics Dashboard Coming Soon"
        description="Our comprehensive metrics dashboard is currently in development. It will provide detailed insights into platform usage, user activity, and business performance."
        icon={<BarChart3 className="h-8 w-8" />}
      />
    </div>
  )
}
