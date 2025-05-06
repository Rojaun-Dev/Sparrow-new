import { ScrollText } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground">View and analyze system logs, audit trails, and platform events.</p>
      </div>

      <FeatureInProgress
        title="System Logs Coming Soon"
        description="Our advanced logging system is currently in development. It will provide comprehensive audit trails, error tracking, and event monitoring across the platform."
        icon={<ScrollText className="h-8 w-8" />}
      />
    </div>
  )
}
