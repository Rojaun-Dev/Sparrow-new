"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { packageService } from "@/lib/api/packageService";
import { usersService } from "@/lib/api/customerService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { dutyFeeService, DUTY_FEE_TYPES, CreateDutyFeeRequest } from "@/lib/api/dutyFeeService";

const PREDEFINED_TAGS = [
  "fragile", "urgent", "oversized", "perishable", "high value", "documents", "general", "other"
];

const packageSchema = z.object({
  userId: z.string().uuid({ message: "Customer is required" }),
  trackingNumber: z.string().min(3, "Tracking number is required"),
  weight: z.coerce.number().positive("Weight must be positive"),
  status: z.enum(["received", "processed", "ready_for_pickup", "delivered", "returned", "pre_alert"], { message: "Status is required" }),
  description: z.string().optional(),
  dimensions: z.object({
    length: z.coerce.number().optional(),
    width: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
  }).partial().optional(),
  declaredValue: z.coerce.number().nonnegative("Declared value must be 0 or more").optional(),
  senderInfo: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
  }).partial().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});
type PackageFormValues = z.infer<typeof packageSchema>;

export default function RegisterPackagePage() {
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [dutyFees, setDutyFees] = useState<CreateDutyFeeRequest[]>([]);
  const router = useRouter();

  const defaultValues: Partial<PackageFormValues> = {
    userId: undefined,
    trackingNumber: "",
    weight: undefined,
    status: "received",
    description: "",
    dimensions: { length: undefined, width: undefined, height: undefined },
    declaredValue: undefined,
    senderInfo: { name: "", address: "", phone: "" },
    tags: "",
    notes: "",
  };

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues,
  });

  // Fetch all customers on mount
  useEffect(() => {
    setCustomerLoading(true);
    usersService.getUsers(undefined, { role: "customer", limit: 1000 })
      .then(users => setCustomerOptions(users))
      .catch(() => setCustomerOptions([]))
      .finally(() => setCustomerLoading(false));
  }, []);

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const filteredCustomers = customerQuery
    ? customerOptions.filter(u =>
        (`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(customerQuery.toLowerCase()))
      )
    : customerOptions;
  const selectedCustomer = customerOptions.find(u => u.id === watch("userId"));

  const handleTagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tag = e.target.value;
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    e.target.value = "";
  };
  const handleCustomTagAdd = () => {
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setCustomTag("");
    }
  };
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // Duty fee management functions
  const handleAddDutyFee = () => {
    setDutyFees([...dutyFees, {
      packageId: '', // Will be set after package creation
      feeType: 'Electronics',
      amount: 0,
      currency: 'USD',
      description: ''
    }]);
  };

  const handleUpdateDutyFee = (index: number, field: keyof CreateDutyFeeRequest, value: any) => {
    const updatedFees = [...dutyFees];
    (updatedFees[index] as any)[field] = value;
    setDutyFees(updatedFees);
  };

  const handleRemoveDutyFee = (index: number) => {
    setDutyFees(dutyFees.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async (data: PackageFormValues) => {
      const tagsArray = selectedTags.length > 0 ? selectedTags : undefined;
      const senderInfo = data.senderInfo && Object.values(data.senderInfo).some(Boolean) ? data.senderInfo : undefined;
      const dimensions = data.dimensions && Object.values(data.dimensions).some(v => v !== undefined && v !== null) ? data.dimensions : undefined;
      
      // Create the package first
      const newPackage = await packageService.createPackage({
        ...data,
        tags: tagsArray,
        senderInfo,
        dimensions,
        declaredValue: data.declaredValue === undefined || isNaN(data.declaredValue) ? undefined : data.declaredValue,
      });

      // Create duty fees if any exist
      if (dutyFees.length > 0) {
        const dutyFeePromises = dutyFees.map(fee => 
          dutyFeeService.createDutyFee({
            ...fee,
            packageId: newPackage.id
          })
        );
        await Promise.all(dutyFeePromises);
      }

      return newPackage;
    },
    onSuccess: () => {
      toast({ title: "Package registered", description: "Package and duty fees have been registered successfully." });
      reset(defaultValues);
      setSelectedTags([]);
      setCustomTag("");
      setDutyFees([]);
      setValue("userId", "");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to register package", variant: "destructive" });
    },
  });

  const onSubmit = (data: PackageFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <Button variant="outline" type="button" onClick={() => router.back()} className="mb-6 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold mb-6">Register Package</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Customer</label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full h-10 border border-gray-300 rounded-md px-3 text-left bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  onClick={() => setCustomerDropdownOpen(v => !v)}
                >
                  {selectedCustomer
                    ? `${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.email})`
                    : customerLoading ? "Loading..." : "Search and select customer...(optional)"}
                </button>
                {customerDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                    <Command>
                      <CommandInput
                        placeholder="Search customer by name or email..."
                        value={customerQuery}
                        onValueChange={setCustomerQuery}
                        autoFocus
                      />
                      <CommandList>
                        {customerLoading && <div className="p-2 text-sm text-gray-500">Loading...</div>}
                        <CommandEmpty>No customers found.</CommandEmpty>
                        {filteredCustomers.map(u => (
                          <CommandItem
                            key={u.id}
                            value={`${u.firstName} ${u.lastName} ${u.email}`}
                            onSelect={() => {
                              setValue("userId", u.id);
                              setCustomerDropdownOpen(false);
                            }}
                          >
                            {u.firstName} {u.lastName} <span className="text-gray-500 ml-1">({u.email})</span>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>
              <input type="hidden" {...register("userId")}/>
              {errors.userId && <div className="text-red-600 text-sm mt-1">{errors.userId.message}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tracking Number</label>
                <Input {...register("trackingNumber")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                {errors.trackingNumber && <div className="text-red-600 text-sm mt-1">{errors.trackingNumber.message}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                <Input type="number" step="0.01" min="0" {...register("weight")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                {errors.weight && <div className="text-red-600 text-sm mt-1">{errors.weight.message}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select {...register("status")} className="border border-gray-300 rounded-md px-3 py-2 w-full h-10 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <option value="received">Received</option>
                  <option value="processed">Processed</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                  <option value="pre_alert">Pre-Alert</option>
                </select>
                {errors.status && <div className="text-red-600 text-sm mt-1">{errors.status.message}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Declared Value ($)</label>
                <Input type="number" step="0.01" min="0" {...register("declaredValue")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                {errors.declaredValue && <div className="text-red-600 text-sm mt-1">{errors.declaredValue.message}</div>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input {...register("description")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
              {errors.description && <div className="text-red-600 text-sm mt-1">{errors.description.message}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Dimensions (cm)</label>
                <div className="flex gap-3">
                  <Input type="number" step="0.01" min="0" placeholder="Length" {...register("dimensions.length")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                  <Input type="number" step="0.01" min="0" placeholder="Width" {...register("dimensions.width")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                  <Input type="number" step="0.01" min="0" placeholder="Height" {...register("dimensions.height")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                </div>
                {(errors.dimensions?.length || errors.dimensions?.width || errors.dimensions?.height) && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.dimensions?.length?.message || errors.dimensions?.width?.message || errors.dimensions?.height?.message}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sender Info</label>
                <div className="space-y-3">
                  <Input placeholder="Name" {...register("senderInfo.name")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                  <Input placeholder="Address" {...register("senderInfo.address")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                  <Input placeholder="Phone" {...register("senderInfo.phone")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
                </div>
                {(errors.senderInfo?.name || errors.senderInfo?.address || errors.senderInfo?.phone) && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.senderInfo?.name?.message || errors.senderInfo?.address?.message || errors.senderInfo?.phone?.message}
                  </div>
                )}
              </div>
            </div>

            {/* Tags section */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map(tag => (
                  <Badge key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                    {tag}
                    <button type="button" className="ml-1 text-sm text-red-500 hover:text-red-700" onClick={() => handleRemoveTag(tag)}>&times;</button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3 items-center">
                <select onChange={handleTagSelect} className="border border-gray-300 rounded-md px-3 py-2 h-10 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <option value="">Add tag...</option>
                  {PREDEFINED_TAGS.filter(tag => !selectedTags.includes(tag)).map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <Input
                  placeholder="Custom tag"
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  className="h-10 w-40 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCustomTagAdd(); } }}
                />
                <Button type="button" size="sm" onClick={handleCustomTagAdd} className="h-10 px-4">Add</Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Input {...register("notes")} className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
              {errors.notes && <div className="text-red-600 text-sm mt-1">{errors.notes.message}</div>}
            </div>

            {/* Duty Fees Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">Duty Fees</label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddDutyFee} className="h-8 px-3">
                  Add Duty Fee
                </Button>
              </div>
              
              {dutyFees.length === 0 && (
                <p className="text-gray-500 text-sm">No duty fees added.</p>
              )}

              <div className="space-y-4">
                {dutyFees.map((fee, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Fee Type</label>
                        <select 
                          value={fee.feeType}
                          onChange={(e) => handleUpdateDutyFee(index, 'feeType', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 h-10 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        >
                          {DUTY_FEE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      {fee.feeType === 'Other' && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Custom Fee Type</label>
                          <Input 
                            value={fee.customFeeType || ''}
                            onChange={(e) => handleUpdateDutyFee(index, 'customFeeType', e.target.value)}
                            placeholder="Enter custom fee type"
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={fee.amount}
                          onChange={(e) => handleUpdateDutyFee(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Currency</label>
                        <select 
                          value={fee.currency}
                          onChange={(e) => handleUpdateDutyFee(index, 'currency', e.target.value as 'USD' | 'JMD')}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 h-10 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        >
                          <option value="USD">USD</option>
                          <option value="JMD">JMD</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                        <Input 
                          value={fee.description || ''}
                          onChange={(e) => handleUpdateDutyFee(index, 'description', e.target.value)}
                          placeholder="Additional details about this fee"
                          className="h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveDutyFee(index)}
                        className="h-8 px-3 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {mutation.isError && <div className="text-red-600 text-sm">{(mutation.error as any)?.message || "Failed to register package"}</div>}
            
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button type="submit" disabled={isSubmitting || mutation.isPending} className="px-6">
                {mutation.isPending ? "Registering..." : "Register Package"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 