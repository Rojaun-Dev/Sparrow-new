import { BarChart3 } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function BillingReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing Reports</h1>
        <p className="text-muted-foreground">
          View and analyze billing reports and revenue metrics across all tenants.
        </p>
      </div>

      <FeatureInProgress
        title="Billing Reports Coming Soon"
        description="Our comprehensive billing reports feature is currently in development. It will provide detailed insights into revenue, invoices, and payment trends across all tenants."
        icon={<BarChart3 className="h-8 w-8" />}
      />
    </div>
  )
}
