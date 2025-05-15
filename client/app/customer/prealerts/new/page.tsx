"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { FileUpload } from "@/components/ui/file-upload"
import { useCreatePreAlertWithDocuments } from "@/hooks"
import { useToast } from "@/components/ui/use-toast"

export default function CreatePreAlertPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formStep, setFormStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documents, setDocuments] = useState<File[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    trackingNumber: '',
    courier: '',
    estimatedArrival: '',
    description: '',
    estimatedWeight: 0,
    declaredValue: 0,
    sender: '',
  })
  
  // Example courier options
  const couriers = [
    { value: "usps", label: "USPS" },
    { value: "fedex", label: "FedEx" },
    { value: "ups", label: "UPS" },
    { value: "dhl", label: "DHL" },
    { value: "amazon", label: "Amazon Logistics" },
    { value: "other", label: "Other" },
  ]

  // Create pre-alert mutation
  const createPreAlert = useCreatePreAlertWithDocuments()

  const handleNextStep = () => {
    // Validate current step before moving to next
    if (formStep === 1) {
      if (!formData.trackingNumber || !formData.courier) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }
    }
    
    setFormStep(formStep + 1)
  }

  const handlePreviousStep = () => {
    setFormStep(formStep - 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: id === 'estimatedWeight' || id === 'declaredValue' 
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate final step
    if (!formData.description) {
      toast({
        title: "Missing information",
        description: "Please provide a description for your package.",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await createPreAlert.mutateAsync({
        preAlert: {
          trackingNumber: formData.trackingNumber,
          courier: formData.courier,
          description: formData.description,
          weight: formData.estimatedWeight > 0 ? formData.estimatedWeight : undefined,
          estimatedArrival: formData.estimatedArrival ? formData.estimatedArrival : undefined,
        },
        files: documents
      })
      
      toast({
        title: "Success!",
        description: "Your pre-alert has been successfully created. We will notify you when it arrives.",
        variant: "default",
      })
      
      // Redirect to pre-alerts list
      router.push("/customer/prealerts")
    } catch (error) {
      console.error('Failed to create pre-alert:', error)
      
      toast({
        title: "Error",
        description: "Failed to create pre-alert. Please check your information and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
                        <Label htmlFor="trackingNumber">
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
                        id="trackingNumber" 
                        value={formData.trackingNumber}
                        onChange={handleInputChange}
                        placeholder="Enter tracking number" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="courier">
                        Courier <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.courier}
                        onValueChange={(value) => handleSelectChange('courier', value)}
                        required
                      >
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
                      <Label htmlFor="estimatedArrival">Estimated Arrival Date</Label>
                      <Input 
                        id="estimatedArrival" 
                        type="date" 
                        value={formData.estimatedArrival}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: Add the expected delivery date if known.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Upload Invoice or Receipt</Label>
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
                      <FileUpload 
                        onFilesChange={setDocuments}
                        value={documents}
                        maxFiles={5}
                        disabled={isSubmitting}
                        uploading={isSubmitting}
                        label="Upload documents"
                        description="Drag & drop or click to upload (PDF, JPG, PNG)"
                      />
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
                        value={formData.description}
                        onChange={handleInputChange}
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
                        <Label htmlFor="estimatedWeight">
                          Estimated Weight (lbs)
                        </Label>
                        <Input 
                          id="estimatedWeight" 
                          type="number" 
                          value={formData.estimatedWeight || ''}
                          onChange={handleInputChange}
                          placeholder="0.0" 
                          step="0.1"
                          min="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="declaredValue">
                          Declared Value ($)
                        </Label>
                        <Input 
                          id="declaredValue" 
                          type="number" 
                          value={formData.declaredValue || ''}
                          onChange={handleInputChange}
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
                        value={formData.sender}
                        onChange={handleInputChange}
                        placeholder="Name, address, or other details about the sender" 
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: Providing sender information helps with package identification.
                      </p>
                    </div>
                  </div>
                )}
                
                {formStep === 3 && (
                  <div className="space-y-6">
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium">Shipment Summary</h3>
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                            <p>{formData.trackingNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Courier</p>
                            <p>{couriers.find(c => c.value === formData.courier)?.label || formData.courier}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p>{formData.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Estimated Weight</p>
                            <p>{formData.estimatedWeight > 0 ? `${formData.estimatedWeight} lbs` : 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Declared Value</p>
                            <p>{formData.declaredValue > 0 ? `$${formData.declaredValue.toFixed(2)}` : 'Not provided'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Estimated Arrival</p>
                          <p>{formData.estimatedArrival ? new Date(formData.estimatedArrival).toLocaleDateString() : 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Attached Documents</p>
                          <p>{documents.length > 0 ? `${documents.length} document(s) attached` : 'No documents attached'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                      <div className="flex items-start gap-3">
                        <Info className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                        <div>
                          <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Important Information</h3>
                          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                            By submitting this pre-alert, you confirm that all provided information is accurate. 
                            This helps us process your package more efficiently when it arrives.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                {formStep > 1 ? (
                  <Button variant="outline" onClick={handlePreviousStep} disabled={isSubmitting}>
                    Back
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link href="/customer/prealerts">Cancel</Link>
                  </Button>
                )}
                
                {formStep < 3 ? (
                  <Button onClick={handleNextStep} disabled={isSubmitting}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Pre-Alert'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </form>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Pre-Alert Guide</CardTitle>
              <CardDescription>Tips for submitting a pre-alert</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is a pre-alert?</AccordionTrigger>
                  <AccordionContent>
                    A pre-alert is a notification about an incoming package. By providing details in advance, 
                    we can process your package more quickly when it arrives at our facility.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Why should I submit a pre-alert?</AccordionTrigger>
                  <AccordionContent>
                    Pre-alerts help us identify your package faster, reducing processing time. 
                    This means you'll receive your package sooner after it arrives at our facility.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>What information do I need?</AccordionTrigger>
                  <AccordionContent>
                    At minimum, you'll need the tracking number and courier. Additional information like 
                    package description, weight, and value helps us process your shipment more efficiently.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>When should I send a pre-alert?</AccordionTrigger>
                  <AccordionContent>
                    Ideally, submit your pre-alert as soon as you have the tracking information for your package, 
                    before it arrives at our facility.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/customer/help/pre-alerts">
                  Learn More About Pre-Alerts
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 