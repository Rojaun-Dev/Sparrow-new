import { Webhook } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function WebhookEventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhook Events</h1>
        <p className="text-muted-foreground">Monitor and troubleshoot webhook events and integrations.</p>
      </div>

      <FeatureInProgress
        title="Webhook Events Coming Soon"
        description="Our webhook event monitoring system is currently in development. It will provide detailed logs of all webhook events, with advanced filtering, replay capabilities, and integration testing tools."
        icon={<Webhook className="h-8 w-8" />}
      />
    </div>
  )
}
