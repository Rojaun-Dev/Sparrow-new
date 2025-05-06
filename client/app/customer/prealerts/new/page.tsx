"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Gift, Info, Package, PlusCircle, Truck } from "lucide-react"

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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function CreatePreAlertPage() {
  const [formStep, setFormStep] = useState(1)
  
  // Example courier options
  const couriers = [
    { value: "usps", label: "USPS" },
    { value: "fedex", label: "FedEx" },
    { value: "ups", label: "UPS" },
    { value: "dhl", label: "DHL" },
    { value: "amazon", label: "Amazon Logistics" },
    { value: "other", label: "Other" },
  ]

  const handleNextStep = () => {
    setFormStep(formStep + 1)
  }

  const handlePreviousStep = () => {
    setFormStep(formStep - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the form data to an API
    alert("Pre-alert created successfully!")
    // Redirect to pre-alerts list
    window.location.href = "/customer/prealerts"
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/customer/prealerts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Create Pre-Alert</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pre-Alert Details</CardTitle>
                    <CardDescription>
                      Provide information about your incoming package.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="px-3">
                    Step {formStep} of 3
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {formStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tracking_number">
                          Tracking Number <span className="text-red-500">*</span>
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80 text-xs">
                                Enter the tracking number provided by the sender or courier. 
                                This helps us identify your package when it arrives.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input 
                        id="tracking_number" 
                        placeholder="Enter tracking number" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="courier">
                        Courier <span className="text-red-500">*</span>
                      </Label>
                      <Select required>
                        <SelectTrigger id="courier">
                          <SelectValue placeholder="Select courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {couriers.map((courier) => (
                            <SelectItem key={courier.value} value={courier.value}>
                              {courier.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="estimated_arrival">Estimated Arrival Date</Label>
                      <Input 
                        id="estimated_arrival" 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: Add the expected delivery date if known.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="invoice_upload">Upload Invoice or Receipt</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80 text-xs">
                                Upload an invoice or receipt for your package. This helps us verify the contents and value of your shipment.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="invoice_upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <PlusCircle className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PDF, PNG, JPG or JPEG (max. 5MB)</p>
                          </div>
                          <Input 
                            id="invoice_upload" 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.png,.jpg,.jpeg"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optional: Providing an invoice helps with customs clearance.
                      </p>
                    </div>
                  </div>
                )}
                
                {formStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Package Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea 
                        id="description" 
                        placeholder="Describe the contents of your package" 
                        required
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Be as specific as possible. This helps us identify your package.
                      </p>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="estimated_weight">
                          Estimated Weight (lbs)
                        </Label>
                        <Input 
                          id="estimated_weight" 
                          type="number" 
                          placeholder="0.0" 
                          step="0.1"
                          min="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="value">
                          Declared Value ($)
                        </Label>
                        <Input 
                          id="value" 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sender">Sender Information</Label>
                      <Input 
                        id="sender" 
                        placeholder="Retailer or sender name" 
                      />
                    </div>
                  </div>
                )}
                
                {formStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Special Handling Instructions</Label>
                      <Textarea 
                        placeholder="Optional: Add any special handling instructions" 
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Let us know if your package requires any special handling or care.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="rounded-md bg-muted p-4">
                      <div className="font-medium">Pre-Alert Summary</div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        By submitting this pre-alert, you're notifying us of an incoming package. 
                        We'll match it with your account when it arrives at our warehouse.
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        You'll receive notifications as your package moves through our system.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                {formStep > 1 ? (
                  <Button variant="outline" onClick={handlePreviousStep}>
                    Back
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link href="/customer/prealerts">Cancel</Link>
                  </Button>
                )}
                
                {formStep < 3 ? (
                  <Button onClick={handleNextStep}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Pre-Alert
                  </Button>
                )}
              </CardFooter>
            </Card>
          </form>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tracking Tips</CardTitle>
              <CardDescription>
                How to find your tracking number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Truck className="mr-2 h-4 w-4" />
                      <span>USPS Tracking</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      USPS tracking numbers typically start with 9 and are 22 characters long.
                      Example: 9400 1000 0000 0000 0000 00
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Truck className="mr-2 h-4 w-4" />
                      <span>FedEx Tracking</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      FedEx tracking numbers are usually 12 or 15 digits long.
                      Express: 123456789012
                      Ground: 123456789012345
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Truck className="mr-2 h-4 w-4" />
                      <span>UPS Tracking</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      UPS tracking numbers are 18 characters long and typically start with "1Z".
                      Example: 1Z 999 AA1 01 2345 6784
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Truck className="mr-2 h-4 w-4" />
                      <span>DHL Tracking</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      DHL tracking numbers are 10 digits long.
                      Example: 1234567890
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                If you're having trouble creating a pre-alert or don't have all the information, 
                please contact our customer support team.
              </p>
              <Button variant="outline" className="w-full justify-start mt-4">
                <Info className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 