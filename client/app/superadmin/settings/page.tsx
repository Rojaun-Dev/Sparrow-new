import { Settings, User, PaintBucket, KeyRound, Server, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure global platform settings, integrations, and defaults.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-muted-foreground" />
              Profile
            </CardTitle>
            <CardDescription>
              Manage your personal information, security settings, and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/superadmin/settings/profile">
                Manage Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <PaintBucket className="mr-2 h-5 w-5 text-muted-foreground" />
              Branding
            </CardTitle>
            <CardDescription>
              Customize platform appearance, logos, and color schemes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/superadmin/settings/branding">
                Configure Branding
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-muted-foreground" />
              Auth0 Integration
            </CardTitle>
            <CardDescription>
              Configure authentication, organizations, and user management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/superadmin/settings/auth0">
                Configure Auth0
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5 text-muted-foreground" />
              Environment
            </CardTitle>
            <CardDescription>
              Manage server configurations, API keys, and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/superadmin/settings/environment">
                Configure Environment
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-muted-foreground" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Manage administrator accounts and permission levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/superadmin/users">
                Manage Admins
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-muted-foreground" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Configure system defaults, security policies, and platform behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
