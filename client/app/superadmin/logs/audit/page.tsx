import { ClipboardList } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

// Config to prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AuditLogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          View and analyze audit trails for all actions performed on the platform.
        </p>
      </div>

      <FeatureInProgress
        title="Audit Logs Coming Soon"
        description="Our comprehensive audit logging system is currently in development. It will provide detailed records of all actions performed on the platform, with advanced filtering and search capabilities."
        icon={<ClipboardList className="h-8 w-8" />}
      />
    </div>
  )
}
