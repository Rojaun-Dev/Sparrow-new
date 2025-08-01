"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Key,
  Lock,
  LogOut,
  Mail,
  Phone,
  Save,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser, useUpdateProfile, useUpdatePassword, useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordChangeSchema } from "@/lib/validations/auth";
import { NotificationPreferences } from "@/lib/api/types";
import { useAuth } from "@/hooks/useAuth";

const ProfileSkeleton = () => (
  <Card>
    <CardHeader className="pb-4">
      <div className="h-6 w-1/3 mb-2 bg-gray-200 animate-pulse rounded" />
      <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="h-4 w-16 mb-2 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 mb-2 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="h-4 w-16 mb-2 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 mb-2 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-between border-t px-6 pt-4">
      <div className="h-10 w-24 bg-gray-200 animate-pulse rounded" />
      <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
    </CardFooter>
  </Card>
);

export default function AdminProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: updateProfile, isPending: saving } = useUpdateProfile();
  const { mutate: updatePassword, isPending: changingPassword } = useUpdatePassword();
  const { data: notificationPrefs } = useNotificationPreferences();
  const { mutate: updateNotificationPrefs, isPending: savingPrefs } = useUpdateNotificationPreferences();
  const { toast } = useToast();
  const { logout } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    trn: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        trn: user.trn || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSavePersonalInfo = () => {
    updateProfile(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        trn: formData.trn,
      },
      {
        onSuccess: () => {
          toast({
            title: "Profile updated",
            description: "Your personal information has been updated successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Failed to update",
            description: "There was a problem updating your profile. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Password change form
  const passwordForm = useForm<z.infer<typeof PasswordChangeSchema>>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handler for password change
  const handlePasswordChange = (values: z.infer<typeof PasswordChangeSchema>) => {
    updatePassword(values, {
      onSuccess: () => {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });
        passwordForm.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Failed to update password",
          description: error.message || "There was a problem updating your password. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // Handler for notification preferences
  const handleNotificationChange = (type: string, channel: string, value: boolean) => {
    if (!notificationPrefs) return;
    const updatedPrefs = JSON.parse(JSON.stringify(notificationPrefs)) as NotificationPreferences;
    if (type === "general") {
      (updatedPrefs as any)[channel] = value;
    } else {
      const categoryKey = `${type}Updates` as keyof NotificationPreferences;
      if (!updatedPrefs[categoryKey]) {
        (updatedPrefs as any)[categoryKey] = {
          email: false,
          sms: false,
          push: false,
        };
      }
      const category = (updatedPrefs as any)[categoryKey];
      if (category) {
        category[channel] = value;
      }
    }
    updateNotificationPrefs(updatedPrefs, {
      onSuccess: () => {
        toast({
          title: "Preferences updated",
          description: "Your notification preferences have been updated.",
        });
      },
      onError: () => {
        toast({
          title: "Failed to update",
          description: "There was a problem updating your preferences. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          <div className="mt-6 space-y-6">
            <ProfileSkeleton />
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and security settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trn">TRN (Tax Registration Number)</Label>
                <Input id="trn" value={formData.trn} onChange={handleChange} />
                <p className="text-xs text-muted-foreground">To update your TRN, please contact support.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 pt-4">
              <div />
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
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
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
                          <Input type="password" placeholder="Enter your current password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter new password" {...field} />
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
                          <Input type="password" placeholder="Confirm new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 text-sm font-medium">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span>Password Requirements:</span>
                  </div>
                  <ul className="mt-2 ml-6 text-xs text-muted-foreground list-disc">
                    <li>Minimum 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one number</li>
                    <li>At least one special character</li>
                  </ul>
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">General Notifications</h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="general-email">Email Notifications</Label>
                    </div>
                    <Switch
                      id="general-email"
                      checked={notificationPrefs?.email ?? true}
                      onCheckedChange={(checked) => handleNotificationChange("general", "email", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="general-sms">SMS Notifications</Label>
                    </div>
                    <Switch
                      id="general-sms"
                      checked={notificationPrefs?.sms ?? false}
                      onCheckedChange={(checked) => handleNotificationChange("general", "sms", checked)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="general-push">Push Notifications</Label>
                  </div>
                  <Switch
                    id="general-push"
                    checked={notificationPrefs?.push ?? false}
                    onCheckedChange={(checked) => handleNotificationChange("general", "push", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end">
        <Button variant="destructive" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
} 