'use client';

import { useState } from 'react';
import { useForm, FormProvider, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define form schema for each step
const userInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const companyInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  website: z.string().url('Invalid website URL').optional(),
  locations: z.array(z.string()).optional(),
  bankInfo: z.string().optional()
});

// Combine schemas
const registrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  website: z.string().url('Invalid website URL').optional(),
  locations: z.array(z.string()).default([]),
  bankInfo: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface MultiStepCompanyRegistrationProps {
  onSubmit: (data: RegistrationFormValues) => void;
  email?: string;
  isSubmitting?: boolean;
  readOnlyEmail?: boolean;
}

const steps = [
  { id: 'user', label: 'User Information' },
  { id: 'basic', label: 'Basic Company Info' },
  { id: 'contact', label: 'Contact Details' },
  { id: 'locations', label: 'Company Locations' },
  { id: 'banking', label: 'Banking Information' },
  { id: 'review', label: 'Review & Submit' }
];

export default function MultiStepCompanyRegistration({
  onSubmit,
  email,
  isSubmitting = false,
  readOnlyEmail = false
}: MultiStepCompanyRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: email || '',
      password: '',
      confirmPassword: '',
      companyName: '',
      subdomain: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
      website: '',
      locations: [],
      bankInfo: ''
    },
    mode: 'onChange'
  });

  const handleStepChange = async (newStep: number) => {
    if (newStep > currentStep) {
      // Validate current step before proceeding
      const currentStepFields = getStepFields(currentStep);
      const isValid = await form.trigger(currentStepFields);
      if (!isValid) return;
    }
    setCurrentStep(newStep);
  };

  const getStepFields = (step: number): (keyof RegistrationFormValues)[] => {
    switch (step) {
      case 0: // User Info
        return ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
      case 1: // Basic Company Info
        return ['companyName', 'subdomain', 'website'];
      case 2: // Contact Details
        return ['addressLine1', 'city', 'state', 'postalCode', 'country', 'phone'];
      case 3: // Locations
        return ['locations'];
      case 4: // Banking
        return ['bankInfo'];
      default:
        return [];
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      const updatedLocations = [...locations, newLocation.trim()];
      setLocations(updatedLocations);
      form.setValue('locations', updatedLocations);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (index: number) => {
    const updatedLocations = locations.filter((_, i) => i !== index);
    setLocations(updatedLocations);
    form.setValue('locations', updatedLocations);
  };

  const handleSubmit = (data: RegistrationFormValues) => {
    onSubmit(data);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (currentStep === steps.length - 1) { // Only submit on the last step
      form.handleSubmit(handleSubmit)(e);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // User Information
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      {...field} 
                      readOnly={readOnlyEmail}
                      disabled={readOnlyEmail}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        );

      case 1: // Basic Company Info
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain</FormLabel>
                  <FormControl>
                    <Input placeholder="acme" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.acme.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2: // Contact Details
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Business St." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Suite 456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="United States" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3: // Locations
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter location (e.g., New York Office)"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <Button type="button" onClick={handleAddLocation}>
                Add Location
              </Button>
            </div>
            <div className="space-y-2">
              {locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                  <span>{location}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLocation(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 4: // Banking Information
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="bankInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Information</FormLabel>
                  <FormControl>
                    <Input placeholder="Account number, routing number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 5: // Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review Your Information</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">User Information</h4>
                  <p>Name: {form.getValues('firstName')} {form.getValues('lastName')}</p>
                  <p>Email: {form.getValues('email')}</p>
                </div>
                <div>
                  <h4 className="font-medium">Company Information</h4>
                  <p>Company: {form.getValues('companyName')}</p>
                  <p>Subdomain: {form.getValues('subdomain')}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium">Contact Information</h4>
                <p>Address: {form.getValues('addressLine1')}</p>
                <p>City: {form.getValues('city')}</p>
                <p>State: {form.getValues('state')}</p>
                <p>Country: {form.getValues('country')}</p>
                <p>Phone: {form.getValues('phone')}</p>
              </div>
              <div>
                <h4 className="font-medium">Locations</h4>
                <ul className="list-disc list-inside">
                  {locations.map((location, index) => (
                    <li key={index}>{location}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Company Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-center text-muted-foreground">
            {steps[currentStep].label}
          </div>
        </div>

        <FormProvider {...form}>
          {renderStep()}
        </FormProvider>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleStepChange(currentStep - 1)}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            onClick={() => handleStepChange(currentStep + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 