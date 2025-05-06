import { CreditCard } from "lucide-react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"

export default function PaymentGatewaysPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Gateways</h1>
        <p className="text-muted-foreground">Configure and manage payment gateway integrations for the platform.</p>
      </div>

      <FeatureInProgress
        title="Payment Gateways Coming Soon"
        description="Our payment gateway integration feature is currently in development. It will allow you to configure and manage multiple payment providers for seamless billing across all tenants."
        icon={<CreditCard className="h-8 w-8" />}
      />
    </div>
  )
}
