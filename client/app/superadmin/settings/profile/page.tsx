"use client"

import { useState } from "react"
import { 
  Bell, 
  Globe, 
  Key, 
  Lock, 
  LogOut, 
  Mail, 
  Phone, 
  Save, 
  Settings, 
  Shield, 
  User,
  Users,
  Database,
  KeySquare,
  Eye,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

export default function SuperadminProfilePage() {
  const [saving, setSaving] = useState(false)

  // Example superadmin profile data
  const user = {
    id: "admin-001",
    firstName: "Admin",
    lastName: "User",
    email: "admin@sparrowx.io",
    phone: "+1 (555) 987-6543",
    role: "Super Administrator",
    department: "IT Operations",
    jobTitle: "System Administrator",
    lastLogin: "October 28, 2023 at 10:45 AM",
    ipAddress: "192.168.1.1",
    twoFactorEnabled: true,
    avatar: "/placeholder.svg?key=admin",
    accessLevel: "Full Access"
  }

  const handleSave = () => {
    setSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSaving(false)
      alert("Profile updated successfully!")
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-muted-foreground">Manage your account and security settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {user.role}
          </Badge>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" defaultValue={user.firstName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" defaultValue={user.lastName} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue={user.phone} />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" defaultValue={user.department} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input id="job-title" defaultValue={user.jobTitle} />
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 pt-4">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Security Settings</CardTitle>
              <CardDescription>
                Manage your password and advanced security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>

              <div className="rounded-md bg-muted p-4">
                <div className="flex gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Admin Password Requirements:</span>
                </div>
                <ul className="mt-2 ml-6 text-xs text-muted-foreground list-disc">
                  <li>Minimum 12 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                  <li>Password must be changed every 90 days</li>
                  <li>Cannot reuse the last 5 passwords</li>
                </ul>
              </div>


            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Settings</CardTitle>
              <CardDescription>
                Manage your system access levels and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">Current Access Level</h3>
                    <p className="text-sm text-muted-foreground">Your current system access level</p>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    {user.accessLevel}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">As a Super Administrator, you have:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Ability to create and manage tenant companies</li>
                    <li>Access to system-wide metrics and logs</li>
                    <li>Permission to configure global settings</li>
                    <li>Ability to deativate or delete any tenant company</li>
                    <li>Ability deactivate or delete any user account</li>
                  </ul>
                </div>
              </div>




            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>
                Configure your interface and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">System Notifications</h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="system-email">Email Alerts</Label>
                    </div>
                    <Switch id="system-email" disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="system-dashboard">Dashboard Alerts</Label>
                    </div>
                    <Switch id="system-dashboard" disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="critical-alerts">Critical Alerts (24/7)</Label>
                    </div>
                    <Switch id="critical-alerts" disabled />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Interface Preferences</h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                    </div>
                    <Switch id="dark-mode" disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="compact-view">Compact View</Label>
                    </div>
                    <Switch id="compact-view" disabled />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Quick access to admin functions</CardDescription>
        </CardHeader>
        <CardContent className="pb-2 space-y-3">
          <div className="grid gap-3">
            <Button variant="outline" className="justify-start">
                <Users className="mr-2 h-4 w-4 text-muted-foreground inline" />
              <Link href="/superadmin/users" className="inline">
                User Management
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
              Security Audit Log (Coming Soon)
            </Button>
            <Button variant="outline" className="justify-start text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 