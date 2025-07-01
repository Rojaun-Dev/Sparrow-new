"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CheckIcon, UploadCloud, Trash2, User, CopyIcon } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"
import { useApiKey } from "@/hooks/useApiKey"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const isAdminL2 = user?.role === "admin_l2";
  const { company, settings, isLoading, updateCompany, updateLocations, updateIntegrationSettings, updateInternalPrefix } = useCompanySettings();
  const { assets, getAssetByType, uploadAsset, deleteAsset } = useCompanyAssets();
  const { generateApiKey, isGenerating, apiKey } = useApiKey();
  
  const [companyData, setCompanyData] = useState({
    id: "",
    name: "",
    subdomain: "",
    email: "",
    phone: "",
    address: "",
    shipping_info: {
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      country: ""
    },
    website: "",
    locations: [] as string[],
    bankInfo: "",
    paymentSettings: {} as any,
    integrationSettings: {
      apiKey: "",
      allowedOrigins: [] as string[],
      redirectIntegration: {
        enabled: false,
        allowedDomains: [] as string[],
      },
      iframeIntegration: {
        enabled: false,
        allowedDomains: [] as string[],
      },
      magayaIntegration: {
        enabled: false,
        username: "",
        password: "",
        networkId: "",
        dateRangePreference: "this_week" as "today" | "this_week" | "this_month",
        autoImportEnabled: false,
        lastImportDate: "",
        cronEnabled: false,
        cronInterval: 24,
      },
    },
    internalPrefix: "SPX",
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
  
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [iframeCodeCopied, setIframeCodeCopied] = useState(false);
  const [domainInputValue, setDomainInputValue] = useState('');
  const [originInputValue, setOriginInputValue] = useState('');
  
  // Add new state for internal prefix
  const [internalPrefixValue, setInternalPrefixValue] = useState("");
  
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
          JSON.stringify(prev.shipping_info) === JSON.stringify(company.shipping_info || {}) &&
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
          shipping_info: company.shipping_info || {
            address_line1: "",
            address_line2: "",
            city: "",
            state: "",
            zip: "",
            country: ""
          },
          website: company.website || "",
          locations: company.locations || [],
          bankInfo: company.bankInfo || "",
          paymentSettings: company.paymentSettings || {},
          integrationSettings: {
            apiKey: "",
            allowedOrigins: [],
            redirectIntegration: {
              enabled: false,
              allowedDomains: [],
            },
            iframeIntegration: {
              enabled: false,
              allowedDomains: [],
            },
            magayaIntegration: {
              enabled: false,
              username: "",
              password: "",
              networkId: "",
              dateRangePreference: "this_week" as "today" | "this_week" | "this_month",
              autoImportEnabled: false,
              lastImportDate: "",
              cronEnabled: false,
              cronInterval: 24,
            },
          },
          internalPrefix: "SPX",
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
            paymentSettings: settings.paymentSettings,
            internalPrefix: settings.internalPrefix || "SPX",
          }));
        }
        
        // Also fetch integration settings
        try {
          const integrationSettings: any = await apiClient.get('/company-settings/integration');
          setCompanyData(prev => ({
            ...prev,
            integrationSettings: {
              apiKey: integrationSettings?.apiKey || "",
              allowedOrigins: integrationSettings?.allowedOrigins || [],
              redirectIntegration: {
                enabled: integrationSettings?.redirectIntegration?.enabled || false,
                allowedDomains: integrationSettings?.redirectIntegration?.allowedDomains || [],
              },
              iframeIntegration: {
                enabled: integrationSettings?.iframeIntegration?.enabled || false,
                allowedDomains: integrationSettings?.iframeIntegration?.allowedDomains || [],
              },
              magayaIntegration: {
                enabled: integrationSettings?.magayaIntegration?.enabled || false,
                username: integrationSettings?.magayaIntegration?.username || "",
                password: integrationSettings?.magayaIntegration?.password || "",
                networkId: integrationSettings?.magayaIntegration?.networkId || "",
                dateRangePreference: integrationSettings?.magayaIntegration?.dateRangePreference || "this_week" as "today" | "this_week" | "this_month",
                autoImportEnabled: integrationSettings?.magayaIntegration?.autoImportEnabled || false,
                lastImportDate: integrationSettings?.magayaIntegration?.lastImportDate || "",
                cronEnabled: integrationSettings?.magayaIntegration?.cronEnabled || false,
                cronInterval: integrationSettings?.magayaIntegration?.cronInterval || 24,
              },
            },
            internalPrefix: settings?.internalPrefix || prev.internalPrefix,
          }));
        } catch (err) {
          console.error('Failed to load integration settings:', err);
        }
      } catch (err) {
        // Optionally handle error
        console.error('Failed to load company settings:', err);
      }
    }
    fetchCompanySettings();
  }, []);
  
  // Update company data when API key is generated
  useEffect(() => {
    if (apiKey && companyData) {
      setCompanyData(prev => ({
        ...prev,
        integrationSettings: {
          ...prev.integrationSettings,
          apiKey,
        },
      }));
    }
  }, [apiKey]);
  
  // Update internal prefix when settings are loaded
  useEffect(() => {
    if (settings?.internalPrefix) {
      setInternalPrefixValue(settings.internalPrefix);
    }
  }, [settings]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Handle nested properties like shipping_info.address_line1
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setCompanyData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setCompanyData(prev => ({ ...prev, [name]: value }))
    }
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
          shipping_info: companyData.shipping_info,
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
      
      // Update integration settings (API and Magaya together)
      if (activeTab === "integrations") {
        console.log("Saving integration settings using the dedicated mutation:", companyData.integrationSettings);
        await updateIntegrationSettings.mutateAsync(companyData.integrationSettings);
        console.log("Integration settings updated successfully");
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
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
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

  // Add allowed domain for redirects or iframe
  const addAllowedDomain = (integrationType: 'redirect' | 'iframe') => {
    if (!domainInputValue.trim()) return;
    
    setCompanyData(prev => {
      const integration = prev.integrationSettings[`${integrationType}Integration`];
      
      // Check if domain already exists
      if (integration.allowedDomains?.includes(domainInputValue)) {
        return prev;
      }
      
      // Add new domain
      return {
        ...prev,
        integrationSettings: {
          ...prev.integrationSettings,
          [`${integrationType}Integration`]: {
            ...integration,
            allowedDomains: [...(integration.allowedDomains || []), domainInputValue],
          },
        },
      };
    });
    
    setDomainInputValue('');
  };

  // Remove allowed domain
  const removeAllowedDomain = (domain: string, integrationType: 'redirect' | 'iframe') => {
    setCompanyData(prev => {
      const integration = prev.integrationSettings[`${integrationType}Integration`];
      return {
        ...prev,
        integrationSettings: {
          ...prev.integrationSettings,
          [`${integrationType}Integration`]: {
            ...integration,
            allowedDomains: integration.allowedDomains?.filter(d => d !== domain),
          },
        },
      };
    });
  };

  // Add allowed origin for API
  const addAllowedOrigin = () => {
    if (!originInputValue.trim()) return;
    
    if (!companyData.integrationSettings.allowedOrigins?.includes(originInputValue)) {
      setCompanyData(prev => ({
        ...prev,
        integrationSettings: {
          ...prev.integrationSettings,
          allowedOrigins: [...(prev.integrationSettings.allowedOrigins || []), originInputValue],
        },
      }));
    }
    setOriginInputValue('');
  };

  // Remove allowed origin
  const removeAllowedOrigin = (origin: string) => {
    setCompanyData(prev => ({
      ...prev,
      integrationSettings: {
        ...prev.integrationSettings,
        allowedOrigins: prev.integrationSettings.allowedOrigins?.filter(o => o !== origin),
      },
    }));
  };

  // Toggle redirect or iframe integration
  const toggleIntegration = (integrationType: 'redirect' | 'iframe', enabled: boolean) => {
    setCompanyData(prev => ({
      ...prev,
      integrationSettings: {
        ...prev.integrationSettings,
        [`${integrationType}Integration`]: {
          ...prev.integrationSettings[`${integrationType}Integration`],
          enabled,
        },
      },
    }));
  };

  // Copy API key to clipboard
  const copyApiKey = async () => {
    if (companyData.integrationSettings.apiKey) {
      await navigator.clipboard.writeText(companyData.integrationSettings.apiKey);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    }
  };

  // Generate iframe code
  const getIframeCode = () => {
    if (!companyData.integrationSettings.apiKey) return '';
    
    const iframeCode = `<iframe 
  src="${window.location.origin}/embed?api_key=${companyData.integrationSettings.apiKey}" 
  width="100%" 
  height="600px" 
  frameborder="0" 
  allow="payment" 
  title="SparrowX">
</iframe>`;
    
    return iframeCode;
  };

  // Copy iframe code to clipboard
  const copyIframeCode = async () => {
    const code = getIframeCode();
    if (code) {
      await navigator.clipboard.writeText(code);
      setIframeCodeCopied(true);
      setTimeout(() => setIframeCodeCopied(false), 2000);
    }
  };

  // Add a handler for updating the internal prefix
  const handleUpdateInternalPrefix = async () => {
    if (!internalPrefixValue || internalPrefixValue.length < 2 || internalPrefixValue.length > 5) {
      toast({
        title: "Invalid prefix",
        description: "Internal prefix must be between 2 and 5 characters",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      await updateInternalPrefix.mutateAsync(internalPrefixValue);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update internal prefix:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Company Information Card Skeleton */}
        <div className="border rounded-lg shadow-sm p-6 bg-card">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Integration Settings Card Skeleton */}
        <div className="border rounded-lg shadow-sm p-6 bg-card">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <div className="space-y-6">
              {/* API Key Section */}
              <div className="space-y-2 border-b pb-6">
                <Skeleton className="h-5 w-1/3" />
                <div className="flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              {/* Allowed Origins Section */}
              <div className="space-y-2 border-b pb-6">
                <Skeleton className="h-5 w-1/3" />
                <div className="flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              {/* Integration Options Section */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-sm" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-sm" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Branding Card Skeleton */}
        <div className="border rounded-lg shadow-sm p-6 bg-card">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
        <TabsList className="grid w-full md:w-auto grid-cols-4 md:grid-cols-4 h-auto gap-2">
          <TabsTrigger className="px-3" value="general" onClick={() => setActiveTab("general")}>General</TabsTrigger>
          <TabsTrigger className="px-3" value="locations" onClick={() => setActiveTab("locations")}>Locations</TabsTrigger>
          <TabsTrigger className="px-3" value="branding" onClick={() => setActiveTab("branding")}>Branding</TabsTrigger>
          <TabsTrigger className="px-3" value="integrations" onClick={() => setActiveTab("integrations")}>Integrations</TabsTrigger>
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
                <p className="text-xs text-muted-foreground mb-2">This is the address clients will use to ship their purchases to.</p>
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
                <Label htmlFor="shippingInfo">Shipping Information</Label>
                <p className="text-xs text-muted-foreground mb-2">This is the address clients will use to ship their purchases to.</p>
                <div className="border rounded-md p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="shipping_info_address_line1">Address Line 1</Label>
                      <Input 
                        id="shipping_info_address_line1" 
                        name="shipping_info.address_line1" 
                        value={companyData.shipping_info?.address_line1 || ''} 
                        onChange={handleInputChange} 
                        disabled={!isAdminL2}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_info_address_line2">Address Line 2</Label>
                      <Input 
                        id="shipping_info_address_line2" 
                        name="shipping_info.address_line2" 
                        value={companyData.shipping_info?.address_line2 || ''} 
                        onChange={handleInputChange} 
                        disabled={!isAdminL2}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="shipping_info_city">City</Label>
                      <Input 
                        id="shipping_info_city" 
                        name="shipping_info.city" 
                        value={companyData.shipping_info?.city || ''} 
                        onChange={handleInputChange} 
                        disabled={!isAdminL2}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_info_state">State/Province</Label>
                      <Input 
                        id="shipping_info_state" 
                        name="shipping_info.state" 
                        value={companyData.shipping_info?.state || ''} 
                        onChange={handleInputChange} 
                        disabled={!isAdminL2}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_info_zip">ZIP/Postal Code</Label>
                      <Input 
                        id="shipping_info_zip" 
                        name="shipping_info.zip" 
                        value={companyData.shipping_info?.zip || ''} 
                        onChange={handleInputChange} 
                        disabled={!isAdminL2}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_info_country">Country</Label>
                    <Input 
                      id="shipping_info_country" 
                      name="shipping_info.country" 
                      value={companyData.shipping_info?.country || ''} 
                      onChange={handleInputChange} 
                      disabled={!isAdminL2}
                      className="w-full"
                    />
                  </div>
                </div>
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

              {/* Internal Prefix Section - Only visible to admin_l2 users */}
              {isAdminL2 && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Internal Prefix Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        This prefix is used for internal tracking IDs and customer reference numbers.
                        Changing this will affect all new packages and users.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="internalPrefix">Internal Prefix</Label>
                        <Input
                          id="internalPrefix"
                          name="internalPrefix"
                          value={internalPrefixValue}
                          onChange={(e) => setInternalPrefixValue(e.target.value.toUpperCase())}
                          placeholder="SPX"
                          className="mt-1"
                          maxLength={5}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          2-5 characters, uppercase letters recommended
                        </p>
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={handleUpdateInternalPrefix}
                          disabled={isSaving || !internalPrefixValue || internalPrefixValue === settings?.internalPrefix}
                          className="mb-1"
                        >
                          {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                          Update Prefix
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm">
                        <strong>Example:</strong> With prefix "{internalPrefixValue || 'SPX'}", tracking IDs will look like:
                        <code className="ml-2 bg-muted px-2 py-1 rounded">{internalPrefixValue || 'SPX'}-23-05-ABC123</code>
                      </p>
                    </div>
                  </div>
                </>
              )}
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
        
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage client API, portal instances, and iframe integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                {/* API Key Section */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">API Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate API keys to authenticate your requests to the SparrowX API.
                  </p>
                  <div className="flex items-center gap-4">
                    {isGenerating ? (
                      <Skeleton className="h-10 flex-1" />
                    ) : (
                      <Input 
                        type="text" 
                        value={companyData?.integrationSettings?.apiKey || ''}
                        readOnly 
                        placeholder="No API key generated yet" 
                      />
                    )}
                    <Button 
                      onClick={() => generateApiKey()} 
                      disabled={!isAdminL2 || isGenerating}
                      variant="outline"
                    >
                      {isGenerating ? (
                        <><Spinner size="sm" className="mr-2" /> Generating...</>
                      ) : (
                        'Generate API Key'
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Use this API key for iframe integration. Warning: Regenerating will invalidate the previous key.
                  </p>
                </div>

                <Separator />

                {/* Allowed Origins Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Allowed Origins (CORS)</h3>
                  <p className="text-sm text-muted-foreground">
                    Specify domains that can make API requests to your SparrowX account.
                  </p>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="https://example.com"
                      value={originInputValue}
                      onChange={(e) => setOriginInputValue(e.target.value)}
                      className="flex-1"
                      disabled={!isAdminL2}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={addAllowedOrigin}
                      disabled={!isAdminL2}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    {companyData.integrationSettings.allowedOrigins?.length ? (
                      <ul className="space-y-2">
                        {companyData.integrationSettings.allowedOrigins.map((origin) => (
                          <li key={origin} className="flex justify-between items-center">
                            <span>{origin}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeAllowedOrigin(origin)}
                              disabled={!isAdminL2}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No origins added. Add domains to allow cross-origin requests.</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Redirect Integration Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Redirect Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure how users are redirected from your website to SparrowX.
                      </p>
                    </div>
                    <Switch 
                      checked={companyData.integrationSettings.redirectIntegration?.enabled || false}
                      onCheckedChange={(enabled) => toggleIntegration('redirect', enabled)}
                      disabled={!isAdminL2}
                    />
                  </div>

                  {companyData.integrationSettings.redirectIntegration?.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Redirect URL Example</Label>
                        <div className="bg-muted p-4 rounded-lg font-mono text-xs break-all">
                          {window.location.origin}?company={companyData.subdomain}
                        </div>
                      </div>

                      <div>
                        <Label>Allowed Domains for Redirects</Label>
                        <div className="flex space-x-2 mt-2">
                          <Input
                            placeholder="example.com"
                            value={domainInputValue}
                            onChange={(e) => setDomainInputValue(e.target.value)}
                            className="flex-1"
                            disabled={!isAdminL2}
                          />
                          <Button 
                            variant="secondary" 
                            onClick={() => addAllowedDomain('redirect')}
                            disabled={!isAdminL2}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="bg-muted p-4 rounded-lg mt-2">
                          {companyData.integrationSettings.redirectIntegration?.allowedDomains?.length ? (
                            <ul className="space-y-2">
                              {companyData.integrationSettings.redirectIntegration.allowedDomains.map((domain) => (
                                <li key={domain} className="flex justify-between items-center">
                                  <span>{domain}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeAllowedDomain(domain, 'redirect')}
                                    disabled={!isAdminL2}
                                  >
                                    Remove
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground">
                              No domains added. Add domains to allow redirects from these websites.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* iFrame Integration Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">iFrame Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Embed SparrowX directly into your website using an iframe.
                      </p>
                    </div>
                    <Switch 
                      checked={companyData.integrationSettings.iframeIntegration?.enabled || false}
                      onCheckedChange={(enabled) => toggleIntegration('iframe', enabled)}
                      disabled={!isAdminL2}
                    />
                  </div>

                  {companyData.integrationSettings.iframeIntegration?.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>iFrame Embed Code</Label>
                        <div className="relative">
                          <Textarea
                            readOnly
                            value={getIframeCode()}
                            rows={6}
                            className="font-mono text-xs"
                            disabled={!companyData.integrationSettings.apiKey}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-2 right-2"
                            onClick={copyIframeCode}
                            disabled={!companyData.integrationSettings.apiKey}
                          >
                            {iframeCodeCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Allowed Domains for iFrame Embedding</Label>
                        <div className="flex space-x-2 mt-2">
                          <Input
                            placeholder="example.com"
                            value={domainInputValue}
                            onChange={(e) => setDomainInputValue(e.target.value)}
                            className="flex-1"
                            disabled={!isAdminL2}
                          />
                          <Button 
                            variant="secondary" 
                            onClick={() => addAllowedDomain('iframe')}
                            disabled={!isAdminL2}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="bg-muted p-4 rounded-lg mt-2">
                          {companyData.integrationSettings.iframeIntegration?.allowedDomains?.length ? (
                            <ul className="space-y-2">
                              {companyData.integrationSettings.iframeIntegration.allowedDomains.map((domain) => (
                                <li key={domain} className="flex justify-between items-center">
                                  <span>{domain}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeAllowedDomain(domain, 'iframe')}
                                    disabled={!isAdminL2}
                                  >
                                    Remove
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground">
                              No domains added. Add domains to allow embedding in these websites.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Note:</strong> Your website must be hosted on HTTPS to embed our application in an iframe.
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <Separator />

                {/* Magaya Integration Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Magaya Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure automatic imports from Magaya LiveTrack
                      </p>
                    </div>
                    <Switch
                      id="magaya-integration-enabled"
                      checked={companyData.integrationSettings?.magayaIntegration?.enabled || false}
                      disabled={!isAdminL2 || isSaving}
                      onCheckedChange={(checked) => {
                        setCompanyData((prev) => ({
                          ...prev,
                          integrationSettings: {
                            ...prev.integrationSettings,
                            magayaIntegration: {
                              ...(prev.integrationSettings?.magayaIntegration || {}),
                              enabled: checked,
                            },
                          },
                        }));
                      }}
                    />
                  </div>

                  {companyData.integrationSettings?.magayaIntegration?.enabled && (
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="magaya-username">Magaya Username</Label>
                          <Input
                            id="magaya-username"
                            placeholder="Enter Magaya username"
                            value={companyData.integrationSettings?.magayaIntegration?.username || ""}
                            disabled={!isAdminL2 || isSaving}
                            onChange={(e) => {
                              setCompanyData((prev) => ({
                                ...prev,
                                integrationSettings: {
                                  ...prev.integrationSettings,
                                  magayaIntegration: {
                                    ...(prev.integrationSettings?.magayaIntegration || {}),
                                    username: e.target.value,
                                  },
                                },
                              }));
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Username for your Magaya LiveTrack account
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="magaya-password">Magaya Password</Label>
                          <Input
                            id="magaya-password"
                            type="password"
                            placeholder="Enter Magaya password"
                            value={companyData.integrationSettings?.magayaIntegration?.password || ""}
                            disabled={!isAdminL2 || isSaving}
                            onChange={(e) => {
                              setCompanyData((prev) => ({
                                ...prev,
                                integrationSettings: {
                                  ...prev.integrationSettings,
                                  magayaIntegration: {
                                    ...(prev.integrationSettings?.magayaIntegration || {}),
                                    password: e.target.value,
                                  },
                                },
                              }));
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Password for your Magaya LiveTrack account
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="magaya-network-id">Magaya Network ID</Label>
                        <Input
                          id="magaya-network-id"
                          placeholder="Enter Magaya Network ID"
                          value={companyData.integrationSettings?.magayaIntegration?.networkId || ""}
                          disabled={!isAdminL2 || isSaving}
                          onChange={(e) => {
                            setCompanyData((prev) => ({
                              ...prev,
                              integrationSettings: {
                                ...prev.integrationSettings,
                                magayaIntegration: {
                                  ...(prev.integrationSettings?.magayaIntegration || {}),
                                  networkId: e.target.value,
                                },
                              },
                            }));
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          Network ID for your Magaya LiveTrack account (required for login)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date-range-preference">Date Range Preference</Label>
                        <Select
                          value={companyData.integrationSettings?.magayaIntegration?.dateRangePreference || "this_week"}
                          disabled={!isAdminL2 || isSaving}
                          onValueChange={(value) => {
                            setCompanyData((prev) => ({
                              ...prev,
                              integrationSettings: {
                                ...prev.integrationSettings,
                                magayaIntegration: {
                                  ...(prev.integrationSettings?.magayaIntegration || {}),
                                  dateRangePreference: value as "today" | "this_week" | "this_month",
                                },
                              },
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select date range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="this_week">This Week to Date</SelectItem>
                            <SelectItem value="this_month">This Month to Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Date range to use when exporting data from Magaya
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-import-enabled"
                          checked={companyData.integrationSettings?.magayaIntegration?.autoImportEnabled || false}
                          disabled={!isAdminL2 || isSaving}
                          onCheckedChange={(checked) => {
                            setCompanyData((prev) => ({
                              ...prev,
                              integrationSettings: {
                                ...prev.integrationSettings,
                                magayaIntegration: {
                                  ...(prev.integrationSettings?.magayaIntegration || {}),
                                  autoImportEnabled: checked,
                                },
                              },
                            }));
                          }}
                        />
                        <Label htmlFor="auto-import-enabled">Enable Auto Import</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        When enabled, the system will display an Auto Import button that can automate the import process from Magaya
                      </p>

                      {companyData.integrationSettings?.magayaIntegration?.lastImportDate && (
                        <div className="text-sm text-muted-foreground mt-4">
                          Last import: {new Date(companyData.integrationSettings.magayaIntegration.lastImportDate).toLocaleString()}
                        </div>
                      )}

                      {companyData.integrationSettings?.magayaIntegration?.enabled && companyData.integrationSettings?.magayaIntegration?.autoImportEnabled && (
                        <div className="space-y-4 pt-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="auto-import-cron-enabled"
                              checked={companyData.integrationSettings?.magayaIntegration?.cronEnabled || false}
                              disabled={!isAdminL2 || isSaving}
                              onCheckedChange={(checked) => {
                                setCompanyData((prev) => ({
                                  ...prev,
                                  integrationSettings: {
                                    ...prev.integrationSettings,
                                    magayaIntegration: {
                                      ...(prev.integrationSettings?.magayaIntegration || {}),
                                      cronEnabled: checked,
                                    },
                                  },
                                }));
                              }}
                            />
                            <Label htmlFor="auto-import-cron-enabled">Enable Scheduled Auto Import</Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            When enabled, the system will automatically run imports on a regular schedule without manual intervention.
                          </p>

                          {companyData.integrationSettings?.magayaIntegration?.cronEnabled && (
                            <div className="space-y-2">
                              <Label htmlFor="cron-interval">Import Frequency</Label>
                              <Select
                                value={String(companyData.integrationSettings?.magayaIntegration?.cronInterval || 24)}
                                disabled={!isAdminL2 || isSaving}
                                onValueChange={(value) => {
                                  setCompanyData((prev) => ({
                                    ...prev,
                                    integrationSettings: {
                                      ...prev.integrationSettings,
                                      magayaIntegration: {
                                        ...(prev.integrationSettings?.magayaIntegration || {}),
                                        cronInterval: parseInt(value, 10),
                                      },
                                    },
                                  }));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="8">Every 8 hours</SelectItem>
                                  <SelectItem value="12">Every 12 hours</SelectItem>
                                  <SelectItem value="24">Every 24 hours (Daily)</SelectItem>
                                  <SelectItem value="48">Every 48 hours (2 days)</SelectItem>
                                  <SelectItem value="72">Every 72 hours (3 days)</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-muted-foreground">
                                Choose how often the system should automatically import data from Magaya.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        

      </Tabs>
    </>
  )
} 