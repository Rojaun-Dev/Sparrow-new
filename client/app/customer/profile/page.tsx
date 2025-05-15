"use client"

import { useState, useEffect } from "react"
import { 
  Bell, 
  Globe, 
  Key, 
  Lock, 
  LogOut, 
  Mail, 
  MapPin, 
  Phone, 
  Save, 
  Settings, 
  Shield, 
  User 
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
import { useCurrentUser, useUpdateProfile, useUpdatePassword, useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useProfile"
import { useToast } from "@/hooks/use-toast"
import { PickupLocationModal } from "@/components/customer/pickup-location-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PasswordChangeSchema } from "@/lib/validations/auth"
import { Badge } from "@/components/ui/badge"
import { NotificationPreferences } from "@/lib/api/types"

// Custom type for category updates
type CategoryUpdates = {
  email: boolean;
  sms: boolean;
  push: boolean;
};

// Skeleton loader component for profile cards
const ProfileSkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  )
}

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser()
  const { mutate: updateProfile, isPending: saving } = useUpdateProfile()
  const { mutate: updatePassword, isPending: changingPassword } = useUpdatePassword()
  const { data: notificationPrefs, isLoading: loadingPrefs } = useNotificationPreferences()
  const { mutate: updateNotificationPrefs, isPending: savingPrefs } = useUpdateNotificationPreferences()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    trn: ""
  })

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      const address = user.address?.split(',') || []
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: address[0] || "",
        city: address[1]?.trim() || "",
        state: address[2]?.trim() || "Jamaica",
        postalCode: address[3]?.trim() || "",
        trn: user.trn || ""
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  const handleSelectChange = (value: string, field: string) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  const handleSavePersonalInfo = () => {
    updateProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      trn: formData.trn
    }, {
      onSuccess: () => {
        toast({
          title: "Profile updated",
          description: "Your personal information has been updated successfully.",
        })
      },
      onError: () => {
        toast({
          title: "Failed to update",
          description: "There was a problem updating your profile. Please try again.",
          variant: "destructive"
        })
      }
    })
  }

  const handleSaveAddress = () => {
    const formattedAddress = `${formData.address}, ${formData.city}, ${formData.state}, ${formData.postalCode}`
    updateProfile({
      address: formattedAddress
    }, {
      onSuccess: () => {
        toast({
          title: "Address updated",
          description: "Your address has been updated successfully.",
        })
      },
      onError: () => {
        toast({
          title: "Failed to update",
          description: "There was a problem updating your address. Please try again.",
          variant: "destructive"
        })
      }
    })
  }

  // Password change form
  const passwordForm = useForm<z.infer<typeof PasswordChangeSchema>>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  })

  // Handler for password change
  const handlePasswordChange = (values: z.infer<typeof PasswordChangeSchema>) => {
    updatePassword(values, {
      onSuccess: () => {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        })
        passwordForm.reset()
      },
      onError: (error: any) => {
        toast({
          title: "Failed to update password",
          description: error.message || "There was a problem updating your password. Please try again.",
          variant: "destructive"
        })
      }
    })
  }

  // Handler for notification preferences
  const handleNotificationChange = (type: string, channel: string, value: boolean) => {
    if (!notificationPrefs) return

    // Create a deep copy of the notification preferences
    const updatedPrefs = JSON.parse(JSON.stringify(notificationPrefs)) as NotificationPreferences
    
    if (type === 'general') {
      // Update general preference
      (updatedPrefs as any)[channel] = value
    } else {
      // Update specific category preference
      const categoryKey = `${type}Updates` as keyof NotificationPreferences
      
      // Make sure the category exists
      if (!updatedPrefs[categoryKey]) {
        const newCategoryUpdate = {
          email: type === 'package' || type === 'billing',
          sms: false,
          push: false
        }
        // Use type assertion to bypass type checking for the specific update
        (updatedPrefs as any)[categoryKey] = newCategoryUpdate
      }
      
      // Update the specific channel in the category
      const category = (updatedPrefs as any)[categoryKey]
      if (category) {
        category[channel] = value
      }
    }
    
    updateNotificationPrefs(updatedPrefs, {
      onSuccess: () => {
        toast({
          title: "Preferences updated",
          description: "Your notification preferences have been updated.",
        })
      },
      onError: (error: Error) => {
        toast({
          title: "Failed to update",
          description: "There was a problem updating your preferences. Please try again.",
          variant: "destructive"
        })
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 space-y-6">
            <ProfileSkeleton />
          </div>
        </Tabs>
        
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="pb-2 space-y-3">
            <div className="grid gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
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
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trn">TRN (Tax Registration Number)</Label>
                <Input 
                  id="trn" 
                  value={formData.trn}
                  onChange={handleChange}
                  disabled={true}
                />
                <p className="text-xs text-muted-foreground">
                  To update your TRN, please contact support or visit one of our stores.
                </p>
              </div>

            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 pt-4">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSavePersonalInfo} disabled={saving}>
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

        <TabsContent value="address" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
              <CardDescription>
                Update your shipping address for package deliveries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea 
                  id="address" 
                  value={formData.address}
                  onChange={handleChange}
                  className="min-h-20" 
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Parish</Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => handleSelectChange(value, 'state')}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select parish" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jamaica">Jamaica</SelectItem>
                      <SelectItem value="Kingston">Kingston</SelectItem>
                      <SelectItem value="St. Andrew">St. Andrew</SelectItem>
                      <SelectItem value="St. Catherine">St. Catherine</SelectItem>
                      <SelectItem value="Clarendon">Clarendon</SelectItem>
                      <SelectItem value="Manchester">Manchester</SelectItem>
                      <SelectItem value="St. Elizabeth">St. Elizabeth</SelectItem>
                      <SelectItem value="Westmoreland">Westmoreland</SelectItem>
                      <SelectItem value="Hanover">Hanover</SelectItem>
                      <SelectItem value="St. James">St. James</SelectItem>
                      <SelectItem value="Trelawny">Trelawny</SelectItem>
                      <SelectItem value="St. Ann">St. Ann</SelectItem>
                      <SelectItem value="St. Mary">St. Mary</SelectItem>
                      <SelectItem value="Portland">Portland</SelectItem>
                      <SelectItem value="St. Thomas">St. Thomas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input 
                    id="postalCode" 
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 pt-4">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSaveAddress} disabled={saving}>
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Address
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your current password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter new password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm new password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-md bg-muted p-4">
                    <div className="flex gap-2 text-sm font-medium">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Password Requirements:</span>
                    </div>
                    <ul className="mt-2 ml-6 text-xs text-muted-foreground list-disc">
                      <li>Minimum 8 characters</li>
                      <li>At least one uppercase letter</li>
                      <li>At least one number</li>
                      <li>At least one special character</li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? (
                        <>Updating...</>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              <Separator />

              <div className="space-y-4">
                <div className="font-medium">Multi-Factor Authentication</div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Authenticator App</div>
                    <div className="text-xs text-muted-foreground">
                      Use an authenticator app to generate one-time codes.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Coming Soon</Badge>
                    <Button variant="outline" disabled>Set Up</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">SMS Verification</div>
                    <div className="text-xs text-muted-foreground">
                      Receive a code via SMS to verify your identity.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Coming Soon</Badge>
                    <Button variant="outline" disabled>Set Up</Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 pt-4">
              <AlertDialog>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will log you out of all devices where you are currently signed in. You will need to log in again on each device.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Package Updates</h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="package-email">Email Notifications</Label>
                    </div>
                    <Switch 
                      id="package-email" 
                      checked={notificationPrefs?.packageUpdates?.email ?? true}
                      onCheckedChange={(checked) => handleNotificationChange('package', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="package-sms">SMS Notifications</Label>
                      <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                    </div>
                    <Switch 
                      id="package-sms" 
                      disabled 
                      checked={notificationPrefs?.packageUpdates?.sms ?? false}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="package-push">Push Notifications</Label>
                      <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                    </div>
                    <Switch 
                      id="package-push" 
                      disabled 
                      checked={notificationPrefs?.packageUpdates?.push ?? false}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Billing & Payments</h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="billing-email">Email Notifications</Label>
                    </div>
                    <Switch 
                      id="billing-email" 
                      checked={notificationPrefs?.billingUpdates?.email ?? true}
                      onCheckedChange={(checked) => handleNotificationChange('billing', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="billing-sms">SMS Notifications</Label>
                      <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                    </div>
                    <Switch 
                      id="billing-sms" 
                      disabled 
                      checked={notificationPrefs?.billingUpdates?.sms ?? false}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Marketing & Offers</h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="marketing-email">Email Newsletter</Label>
                    </div>
                    <Switch 
                      id="marketing-email" 
                      checked={notificationPrefs?.marketingUpdates?.email ?? false}
                      onCheckedChange={(checked) => handleNotificationChange('marketing', 'email', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="pb-2 space-y-3">
          <div className="grid gap-3">
            <PickupLocationModal />
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