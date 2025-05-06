import { Building2 } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function CompanyMetricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Metrics</h1>
        <p className="text-muted-foreground">Analyze performance and usage statistics for individual companies.</p>
      </div>

      <FeatureInProgress
        title="Company Metrics Coming Soon"
        description="Our company-specific metrics dashboard is currently in development. It will provide detailed insights into individual tenant performance, user activity, and business metrics."
        icon={<Building2 className="h-8 w-8" />}
      />
    </div>
  )
}
