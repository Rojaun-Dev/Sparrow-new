"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CheckIcon, UploadCloud, Trash2, User } from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useCompanySettings } from "@/hooks/useCompanySettings"
import { useCompanyAssets } from "@/hooks/useCompanyAssets"
import { useAuth } from "@/hooks/useAuth"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api/apiClient"

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const isAdminL2 = user?.role === "admin_l2";
  const { company, isLoading, updateCompany, updateLocations } = useCompanySettings();
  const { assets, getAssetByType, uploadAsset, deleteAsset } = useCompanyAssets();
  
  const [companyData, setCompanyData] = useState({
    id: "",
    name: "",
    subdomain: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    locations: [] as string[],
    bankInfo: "",
    paymentSettings: {} as any,
  });
  
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<{
    logo: File | null;
    favicon: File | null;
    banner: File | null;
  }>({
    logo: null,
    favicon: null,
    banner: null,
  });
  const [colors, setColors] = useState({
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
  });
  
  // Load company data when available
  useEffect(() => {
    if (company) {
      setCompanyData(prev => {
        // Only update if values are different to prevent unnecessary re-renders
        if (
          prev.name === company.name &&
          prev.subdomain === company.subdomain &&
          prev.email === company.email &&
          prev.phone === company.phone &&
          prev.address === company.address &&
          prev.website === company.website &&
          prev.bankInfo === company.bankInfo &&
          JSON.stringify(prev.locations) === JSON.stringify(company.locations || []) &&
          JSON.stringify(prev.paymentSettings) === JSON.stringify(company.paymentSettings || {})
        ) {
          return prev;
        }
        
        return {
          id: company.id || "",
          name: company.name || "",
          subdomain: company.subdomain || "",
          email: company.email || "",
          phone: company.phone || "",
          address: company.address || "",
          website: company.website || "",
          locations: company.locations || [],
          bankInfo: company.bankInfo || "",
          paymentSettings: company.paymentSettings || {},
        };
      });
    }
  }, [company]);
  
  // Separate useEffect for colors to prevent unnecessary re-renders
  useEffect(() => {
    const themeAsset = getAssetByType("logo");
    if (themeAsset?.metadata) {
      setColors(prev => {
        if (
          prev.primaryColor === (themeAsset.metadata.primaryColor || "#3b82f6") &&
          prev.secondaryColor === (themeAsset.metadata.secondaryColor || "#10b981")
        ) {
          return prev;
        }
        
        return {
          primaryColor: themeAsset.metadata.primaryColor || "#3b82f6",
          secondaryColor: themeAsset.metadata.secondaryColor || "#10b981",
        };
      });
    }
  }, [getAssetByType]);
  
  useEffect(() => {
    async function fetchCompanySettings() {
      try {
        const settings: any = await apiClient.get('/company-settings');
        if (settings?.paymentSettings) {
          setCompanyData(prev => ({
            ...prev,
            paymentSettings: settings.paymentSettings
          }));
        }
      } catch (err) {
        // Optionally handle error
        console.error('Failed to load company settings:', err);
      }
    }
    fetchCompanySettings();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCompanyData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [name]: value }))
  }

  const handleLocationChange = (index: number, value: string) => {
    const updatedLocations = [...companyData.locations]
    updatedLocations[index] = value
    setCompanyData(prev => ({ ...prev, locations: updatedLocations }))
  }

  const addLocation = () => {
    setCompanyData(prev => ({ ...prev, locations: [...prev.locations, ""] }))
  }

  const removeLocation = (index: number) => {
    const updatedLocations = [...companyData.locations]
    updatedLocations.splice(index, 1)
    setCompanyData(prev => ({ ...prev, locations: updatedLocations }))
  }

  const handleSave = async () => {
    if (!isAdminL2) {
      alert("Only admin_l2 can make changes to company settings");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Update company general information
      if (activeTab === "general") {
        await updateCompany.mutateAsync({
          name: companyData.name,
          subdomain: companyData.subdomain,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          website: companyData.website,
          bankInfo: companyData.bankInfo,
        });
      }
      
      // Update company locations
      if (activeTab === "locations") {
        await updateLocations.mutateAsync(companyData.locations);
      }
      
      // Update company branding
      if (activeTab === "branding") {
        // Update logo if selected
        if (selectedFiles.logo) {
          await uploadAsset.mutateAsync({
            type: "logo",
            file: selectedFiles.logo,
            metadata: colors // Store colors with the logo asset
          });
        } else if (!getAssetByType("logo") && colors) {
          // If no logo exists yet but we have colors, create an asset with just metadata
          await uploadAsset.mutateAsync({
            type: "logo",
            file: null,
            metadata: colors
          });
        }
        
        // Update favicon if selected
        if (selectedFiles.favicon) {
          await uploadAsset.mutateAsync({
            type: "favicon",
            file: selectedFiles.favicon
          });
        }
        
        // Update banner if selected
        if (selectedFiles.banner) {
          await uploadAsset.mutateAsync({
            type: "banner",
            file: selectedFiles.banner
          });
        }
        
        // Reset selected files after upload
        setSelectedFiles({
          logo: null,
          favicon: null,
          banner: null,
        });
      }
      
      // Update payment settings
      if (activeTab === "payment") {
        const response = await apiClient.put(`/company-settings/payment`, companyData.paymentSettings);
        console.log("Payment settings updated:", response);
      }
      
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving company settings:", error);
    } finally {
      setIsSaving(false);
    }
  }

  const handleFileChange = (type: 'logo' | 'favicon' | 'banner', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles(prev => ({
        ...prev,
        [type]: e.target.files![0]
      }));
    }
  };

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor', value: string) => {
    setColors(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  if (isLoading) {
    return <div className="py-8">Loading company settings...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Company Settings</h1>
        <Button onClick={handleSave} disabled={isSaving || !isAdminL2}>
          {isSaving ? "Saving..." : "Save Changes"}
          {saveSuccess && <CheckIcon className="ml-2 h-4 w-4" />}
        </Button>
      </div>
      {/* Profile Card */}
      <div className="mb-6">
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
              <Link href="/admin/settings/profile">
                Manage Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader className="sm:flex-row sm:items-center">
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Manage your company's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={companyData.name} 
                    onChange={handleInputChange} 
                    disabled={!isAdminL2}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex flex-col sm:flex-row">
                    <Input 
                      id="subdomain" 
                      name="subdomain" 
                      value={companyData.subdomain} 
                      onChange={handleInputChange} 
                      disabled={!isAdminL2}
                      className="w-full"
                    />
                    <span className="flex items-center px-3 text-muted-foreground whitespace-nowrap mt-2 sm:mt-0">
                      .sparrowx.com
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Support Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={companyData.email} 
                    onChange={handleInputChange} 
                    disabled={!isAdminL2}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={companyData.phone} 
                    onChange={handleInputChange} 
                    disabled={!isAdminL2}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea 
                  id="address" 
                  name="address" 
                  value={companyData.address} 
                  onChange={handleInputChange} 
                  disabled={!isAdminL2}
                  className="w-full min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  name="website" 
                  type="url" 
                  value={companyData.website} 
                  onChange={handleInputChange} 
                  disabled={!isAdminL2}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankInfo">Banking Information</Label>
                <Textarea 
                  id="bankInfo" 
                  name="bankInfo" 
                  value={companyData.bankInfo} 
                  onChange={handleInputChange} 
                  disabled={!isAdminL2}
                  className="w-full min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This information will appear on invoices and is used for payment processing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Branding</CardTitle>
              <CardDescription>
                Customize your customer-facing portal with your brand assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="border rounded-md p-4 text-center">
                    <div className="mb-3 flex justify-center">
                      {getAssetByType("logo")?.imageData ? (
                        <img 
                          src={getAssetByType("logo")?.imageData} 
                          alt="Company Logo" 
                          className="h-16 object-contain" 
                        />
                      ) : (
                        <div className="h-16 w-full flex items-center justify-center bg-gray-100 text-gray-400">
                          No logo
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full gap-1" 
                        disabled={!isAdminL2}
                        onClick={() => document.getElementById('logoUpload')?.click()}
                      >
                        <UploadCloud className="h-4 w-4" />
                        {selectedFiles.logo ? selectedFiles.logo.name.substring(0, 15) + '...' : "Upload Logo"}
                      </Button>
                      <input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('logo', e)}
                        disabled={!isAdminL2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 200x60px
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="border rounded-md p-4 text-center">
                    <div className="mb-3 flex justify-center">
                      {getAssetByType("favicon")?.imageData ? (
                        <img 
                          src={getAssetByType("favicon")?.imageData} 
                          alt="Favicon" 
                          className="h-16 w-16 object-contain" 
                        />
                      ) : (
                        <div className="h-16 w-16 flex items-center justify-center bg-gray-100 text-gray-400 mx-auto">
                          No favicon
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full gap-1" 
                        disabled={!isAdminL2}
                        onClick={() => document.getElementById('faviconUpload')?.click()}
                      >
                        <UploadCloud className="h-4 w-4" />
                        {selectedFiles.favicon ? selectedFiles.favicon.name.substring(0, 15) + '...' : "Upload Favicon"}
                      </Button>
                      <input
                        id="faviconUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('favicon', e)}
                        disabled={!isAdminL2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Required size: 32x32px
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <div className="border rounded-md p-4 text-center">
                    <div className="mb-3 flex justify-center">
                      {getAssetByType("banner")?.imageData ? (
                        <img 
                          src={getAssetByType("banner")?.imageData} 
                          alt="Banner" 
                          className="h-16 w-full object-cover" 
                        />
                      ) : (
                        <div className="h-16 w-full flex items-center justify-center bg-gray-100 text-gray-400">
                          No banner
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full gap-1" 
                        disabled={!isAdminL2}
                        onClick={() => document.getElementById('bannerUpload')?.click()}
                      >
                        <UploadCloud className="h-4 w-4" />
                        {selectedFiles.banner ? selectedFiles.banner.name.substring(0, 15) + '...' : "Upload Banner"}
                      </Button>
                      <input
                        id="bannerUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('banner', e)}
                        disabled={!isAdminL2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 1200x300px
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Tooltips for unavailable color feature */}
              <div className="space-y-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input 
                          type="color" 
                          className="w-16 h-10" 
                          value={colors.primaryColor} 
                          onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                          disabled
                          style={{ cursor: "not-allowed" }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>This feature is not available yet.</span>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input 
                          value={colors.primaryColor} 
                          className="w-32"
                          onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                          disabled
                          style={{ cursor: "not-allowed" }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>This feature is not available yet.</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input 
                          type="color" 
                          className="w-16 h-10" 
                          value={colors.secondaryColor}
                          onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                          disabled
                          style={{ cursor: "not-allowed" }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>This feature is not available yet.</span>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input 
                          value={colors.secondaryColor} 
                          className="w-32"
                          onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                          disabled
                          style={{ cursor: "not-allowed" }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>This feature is not available yet.</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pickup Locations</CardTitle>
              <CardDescription>
                Manage locations where customers can pick up their packages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyData.locations.map((location, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Input
                    value={location}
                    onChange={(e) => handleLocationChange(index, e.target.value)}
                    placeholder="Location name and address"
                    disabled={!isAdminL2}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLocation(index)}
                    disabled={companyData.locations.length <= 1 || !isAdminL2}
                    className="mt-2 sm:mt-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" onClick={addLocation} className="mt-4" disabled={!isAdminL2}>
                Add Location
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage client API, portal instances, and iframe integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-muted-foreground">
                        API configuration will be implemented in the next phase.
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This feature is coming soon!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment methods and processing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* WiPay Integration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">WiPay Integration</h3>
                  <Switch 
                    checked={companyData.paymentSettings?.wipay?.enabled || false}
                    onCheckedChange={(checked) => {
                      setCompanyData(prev => ({
                        ...prev,
                        paymentSettings: {
                          ...prev.paymentSettings || {},
                          wipay: {
                            ...(prev.paymentSettings?.wipay || {}),
                            enabled: checked
                          }
                        }
                      }));
                    }}
                    disabled={!isAdminL2}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable WiPay payment gateway to accept online payments from your customers
                </p>
                
                <Separator />
                
                {companyData.paymentSettings?.wipay?.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input 
                          id="accountNumber"
                          value={companyData.paymentSettings?.wipay?.accountNumber || ''}
                          onChange={(e) => {
                            setCompanyData(prev => ({
                              ...prev,
                              paymentSettings: {
                                ...prev.paymentSettings || {},
                                wipay: {
                                  ...(prev.paymentSettings?.wipay || {}),
                                  accountNumber: e.target.value
                                }
                              }
                            }));
                          }}
                          disabled={!isAdminL2}
                          placeholder="Your WiPay account number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input 
                          id="apiKey"
                          type="password"
                          value={companyData.paymentSettings?.wipay?.apiKey || ''}
                          onChange={(e) => {
                            setCompanyData(prev => ({
                              ...prev,
                              paymentSettings: {
                                ...prev.paymentSettings || {},
                                wipay: {
                                  ...(prev.paymentSettings?.wipay || {}),
                                  apiKey: e.target.value
                                }
                              }
                            }));
                          }}
                          disabled={!isAdminL2}
                          placeholder="Your WiPay API key"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="countryCode">Country Code</Label>
                        <Select 
                          value={companyData.paymentSettings?.wipay?.countryCode || 'TT'}
                          onValueChange={(value) => {
                            setCompanyData(prev => ({
                              ...prev,
                              paymentSettings: {
                                ...prev.paymentSettings || {},
                                wipay: {
                                  ...(prev.paymentSettings?.wipay || {}),
                                  countryCode: value
                                }
                              }
                            }));
                          }}
                          disabled={!isAdminL2}
                        >
                          <SelectTrigger id="countryCode">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TT">Trinidad and Tobago (TT)</SelectItem>
                            <SelectItem value="BB">Barbados (BB)</SelectItem>
                            <SelectItem value="JM">Jamaica (JM)</SelectItem>
                            <SelectItem value="GY">Guyana (GY)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select 
                          value={companyData.paymentSettings?.wipay?.currency || 'TTD'}
                          onValueChange={(value) => {
                            setCompanyData(prev => ({
                              ...prev,
                              paymentSettings: {
                                ...prev.paymentSettings || {},
                                wipay: {
                                  ...(prev.paymentSettings?.wipay || {}),
                                  currency: value
                                }
                              }
                            }));
                          }}
                          disabled={!isAdminL2}
                        >
                          <SelectTrigger id="currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TTD">Trinidad and Tobago Dollar (TTD)</SelectItem>
                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                            <SelectItem value="JMD">Jamaican Dollar (JMD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="environment">Environment</Label>
                        <Select 
                          value={companyData.paymentSettings?.wipay?.environment || 'sandbox'}
                          onValueChange={(value) => {
                            setCompanyData(prev => ({
                              ...prev,
                              paymentSettings: {
                                ...prev.paymentSettings || {},
                                wipay: {
                                  ...(prev.paymentSettings?.wipay || {}),
                                  environment: value as 'sandbox' | 'live'
                                }
                              }
                            }));
                          }}
                          disabled={!isAdminL2}
                        >
                          <SelectTrigger id="environment">
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                            <SelectItem value="live">Live (Production)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="feeStructure">Fee Structure</Label>
                        <Select 
                          value={companyData.paymentSettings?.wipay?.feeStructure || 'customer_pay'}
                          onValueChange={(value) => {
                            setCompanyData(prev => ({
                              ...prev,
                              paymentSettings: {
                                ...prev.paymentSettings || {},
                                wipay: {
                                  ...(prev.paymentSettings?.wipay || {}),
                                  feeStructure: value as 'customer_pay' | 'merchant_absorb' | 'split'
                                }
                              }
                            }));
                          }}
                          disabled={!isAdminL2}
                        >
                          <SelectTrigger id="feeStructure">
                            <SelectValue placeholder="Select fee structure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer_pay">Customer Pays Fees</SelectItem>
                            <SelectItem value="merchant_absorb">Merchant Absorbs Fees</SelectItem>
                            <SelectItem value="split">Split Fees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        Make sure your WiPay account is properly set up and verified before enabling online payments.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="font-medium mb-2">Fee Structure Information</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Choose how payment processing fees are handled:
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li><strong>Customer Pays Fees:</strong> Processing fees are added to the customer's total.</li>
                        <li><strong>Merchant Absorbs Fees:</strong> Your business covers all processing fees.</li>
                        <li><strong>Split Fees:</strong> Processing fees are shared between customer and merchant.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
} 