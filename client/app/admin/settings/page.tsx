"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CheckIcon, UploadCloud, Trash2 } from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock company data
const COMPANY_DATA = {
  id: "comp-1234",
  name: "FastShip Jamaica",
  subdomain: "fastship",
  email: "support@fastship.jm",
  phone: "+1 (876) 555-7890",
  address: "123 Shipping Lane, Kingston, Jamaica",
  website: "https://fastship.jm",
  locations: ["Kingston Main Office", "Montego Bay Branch"],
  bankInfo: "National Commercial Bank, Acc #: 12345678",
  logo: "/placeholder-logo.png",
  banner: "/placeholder-banner.png",
  favicon: "/placeholder-favicon.ico",
}

export default function CompanySettingsPage() {
  const [company, setCompany] = useState(COMPANY_DATA)
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCompany(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setCompany(prev => ({ ...prev, [name]: value }))
  }

  const handleLocationChange = (index: number, value: string) => {
    const updatedLocations = [...company.locations]
    updatedLocations[index] = value
    setCompany(prev => ({ ...prev, locations: updatedLocations }))
  }

  const addLocation = () => {
    setCompany(prev => ({ ...prev, locations: [...prev.locations, ""] }))
  }

  const removeLocation = (index: number) => {
    const updatedLocations = [...company.locations]
    updatedLocations.splice(index, 1)
    setCompany(prev => ({ ...prev, locations: updatedLocations }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In a real app, this would call an API to save the company settings
    console.log("Saving company settings:", company)
    
    setSaveSuccess(true)
    setIsSaving(false)
    
    // Reset success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Company Settings</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
          {saveSuccess && <CheckIcon className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="shipping-rates">Shipping Rates</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
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
                    value={company.name} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex">
                    <Input 
                      id="subdomain" 
                      name="subdomain" 
                      value={company.subdomain} 
                      onChange={handleInputChange} 
                    />
                    <span className="flex items-center px-3 text-muted-foreground whitespace-nowrap">
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
                    value={company.email} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={company.phone} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea 
                  id="address" 
                  name="address" 
                  value={company.address} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  name="website" 
                  type="url" 
                  value={company.website} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankInfo">Banking Information</Label>
                <Textarea 
                  id="bankInfo" 
                  name="bankInfo" 
                  value={company.bankInfo} 
                  onChange={handleInputChange} 
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="border rounded-md p-4 text-center">
                    <div className="mb-3 flex justify-center">
                      <img src={company.logo} alt="Company Logo" className="h-16 object-contain" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full gap-1">
                        <UploadCloud className="h-4 w-4" />
                        Upload Logo
                      </Button>
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
                      <img src={company.favicon} alt="Favicon" className="h-16 w-16 object-contain" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full gap-1">
                        <UploadCloud className="h-4 w-4" />
                        Upload Favicon
                      </Button>
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
                      <img src={company.banner} alt="Banner" className="h-16 w-full object-cover" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full gap-1">
                        <UploadCloud className="h-4 w-4" />
                        Upload Banner
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 1200x300px
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input type="color" className="w-16 h-10" value="#3b82f6" />
                    <Input value="#3b82f6" className="w-32" />
                  </div>
                </div>
                
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input type="color" className="w-16 h-10" value="#10b981" />
                    <Input value="#10b981" className="w-32" />
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
              {company.locations.map((location, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={location}
                    onChange={(e) => handleLocationChange(index, e.target.value)}
                    placeholder="Location name and address"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLocation(index)}
                    disabled={company.locations.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" onClick={addLocation} className="mt-2">
                Add Location
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shipping-rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Rate Configuration</CardTitle>
              <CardDescription>
                Configure shipping rates based on weight and destination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Shipping rate configuration will be implemented in the next phase.
                </p>
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
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Payment configuration will be implemented in the next phase.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
} 