"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { packageService } from "@/lib/api/packageService";
import { usersService } from "@/lib/api/customerService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
    length: z.coerce.number().positive("Length must be positive").optional(),
    width: z.coerce.number().positive("Width must be positive").optional(),
    height: z.coerce.number().positive("Height must be positive").optional(),
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
  const router = useRouter();

  const defaultValues: Partial<PackageFormValues> = {
    userId: "",
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

  const mutation = useMutation({
    mutationFn: (data: PackageFormValues) => {
      const tagsArray = selectedTags.length > 0 ? selectedTags : undefined;
      const senderInfo = data.senderInfo && Object.values(data.senderInfo).some(Boolean) ? data.senderInfo : undefined;
      const dimensions = data.dimensions && Object.values(data.dimensions).some(v => v !== undefined && v !== null) ? data.dimensions : undefined;
      return packageService.createPackage({
        ...data,
        tags: tagsArray,
        senderInfo,
        dimensions,
        declaredValue: data.declaredValue === undefined || isNaN(data.declaredValue) ? undefined : data.declaredValue,
      });
    },
    onSuccess: () => {
      toast({ title: "Package registered", description: "A new package was registered." });
      reset(defaultValues);
      setSelectedTags([]);
      setCustomTag("");
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
    <div className="bg-background py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-10 w-full max-w-4xl ">
        <Button variant="outline" type="button" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold mb-6">Register Package</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 text-sm">
          <div className="mb-2">
            <label className="block text-xs font-medium mb-1">Customer</label>
            <div className="relative">
              <button
                type="button"
                className="w-full h-8 border rounded px-2 text-left bg-white"
                onClick={() => setCustomerDropdownOpen(v => !v)}
              >
                {selectedCustomer
                  ? `${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.email})`
                  : customerLoading ? "Loading..." : "Search and select customer..."}
              </button>
              {customerDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg">
                  <Command>
                    <CommandInput
                      placeholder="Search customer by name or email..."
                      value={customerQuery}
                      onValueChange={setCustomerQuery}
                      autoFocus
                    />
                    <CommandList>
                      {customerLoading && <div className="p-2 text-xs text-muted-foreground">Loading...</div>}
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
                          {u.firstName} {u.lastName} <span className="text-muted-foreground ml-1">({u.email})</span>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            <input type="hidden" {...register("userId")}/>
            {errors.userId && <div className="text-red-600 text-xs">{errors.userId.message}</div>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tracking Number</label>
              <Input {...register("trackingNumber")} className="h-8"/>
              {errors.trackingNumber && <div className="text-red-600 text-xs">{errors.trackingNumber.message}</div>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Weight (kg)</label>
              <Input type="number" step="0.01" min="0" {...register("weight") } className="h-8"/>
              {errors.weight && <div className="text-red-600 text-xs">{errors.weight.message}</div>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select {...register("status")} className="border rounded px-2 py-1 w-full h-8">
                <option value="received">Received</option>
                <option value="processed">Processed</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="delivered">Delivered</option>
                <option value="returned">Returned</option>
                <option value="pre_alert">Pre-Alert</option>
              </select>
              {errors.status && <div className="text-red-600 text-xs">{errors.status.message}</div>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Declared Value ($)</label>
              <Input type="number" step="0.01" min="0" {...register("declaredValue")} className="h-8"/>
              {errors.declaredValue && <div className="text-red-600 text-xs">{errors.declaredValue.message}</div>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <Input {...register("description")} className="h-8"/>
              {errors.description && <div className="text-red-600 text-xs">{errors.description.message}</div>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Dimensions (cm)</label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" min="0" placeholder="Length" {...register("dimensions.length")} className="h-8 w-1/3"/>
                <Input type="number" step="0.01" min="0" placeholder="Width" {...register("dimensions.width")} className="h-8 w-1/3"/>
                <Input type="number" step="0.01" min="0" placeholder="Height" {...register("dimensions.height")} className="h-8 w-1/3"/>
              </div>
              {(errors.dimensions?.length || errors.dimensions?.width || errors.dimensions?.height) && (
                <div className="text-red-600 text-xs">
                  {errors.dimensions?.length?.message || errors.dimensions?.width?.message || errors.dimensions?.height?.message}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Sender Info</label>
              <div className="flex flex-col gap-2">
                <Input placeholder="Name" {...register("senderInfo.name")} className="h-8"/>
                <Input placeholder="Address" {...register("senderInfo.address")} className="h-8"/>
                <Input placeholder="Phone" {...register("senderInfo.phone")} className="h-8"/>
              </div>
              {(errors.senderInfo?.name || errors.senderInfo?.address || errors.senderInfo?.phone) && (
                <div className="text-red-600 text-xs">
                  {errors.senderInfo?.name?.message || errors.senderInfo?.address?.message || errors.senderInfo?.phone?.message}
                </div>
              )}
            </div>
          </div>
          {/* Tags section */}
          <div>
            <label className="block text-xs font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-1">
              {selectedTags.map(tag => (
                <Badge key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                  {tag}
                  <button type="button" className="ml-1 text-xs text-red-500 hover:text-red-700" onClick={() => handleRemoveTag(tag)}>&times;</button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <select onChange={handleTagSelect} className="border rounded px-2 py-1 h-8">
                <option value="">Add tag...</option>
                {PREDEFINED_TAGS.filter(tag => !selectedTags.includes(tag)).map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <Input
                placeholder="Custom tag"
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                className="h-8 w-32"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCustomTagAdd(); } }}
              />
              <Button type="button" size="sm" onClick={handleCustomTagAdd} className="h-8">Add</Button>
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1">Notes</label>
            <Input {...register("notes")} className="h-8"/>
            {errors.notes && <div className="text-red-600 text-xs">{errors.notes.message}</div>}
          </div>
          {mutation.isError && <div className="text-red-600 text-xs">{(mutation.error as any)?.message || "Failed to register package"}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? "Registering..." : "Register Package"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 