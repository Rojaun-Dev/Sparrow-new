import { AlertTriangle } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function ErrorLogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
        <p className="text-muted-foreground">Monitor and troubleshoot platform errors and exceptions.</p>
      </div>

      <FeatureInProgress
        title="Error Logs Coming Soon"
        description="Our error logging and monitoring system is currently in development. It will provide detailed insights into platform errors, with advanced filtering, alerting, and troubleshooting tools."
        icon={<AlertTriangle className="h-8 w-8" />}
      />
    </div>
  )
}
