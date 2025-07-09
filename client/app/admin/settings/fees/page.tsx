"use client";

import { useState } from "react";
import { useFees, useCreateFee, useUpdateFee, useDeleteFee } from "@/hooks/useFees";
import { useAuth } from "@/hooks/useAuth";
import { Fee, FeeType, CalculationMethod } from "@/lib/api/types";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription
} from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, HelpCircle } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const FEE_TYPES: FeeType[] = ["tax", "service", "shipping", "handling", "customs", "other", "threshold"];
const CALC_METHODS: CalculationMethod[] = [
  "fixed", "percentage", "per_weight", "per_item", "threshold", "timed" // TODO: Add dimensional and tiered when functionality is implemented.
];
const PERCENTAGE_BASES = ["subtotal", "customs", "handling", "other"]; // TODO: Add shipping when functionality is implemented. 
const PACKAGE_TAGS = [
  "general", "fragile", "urgent", "oversized", "perishable", "high value", "documents", "other"
];
const THRESHOLD_ATTRIBUTES = ["weight", "declaredValue", ...FEE_TYPES];
const THRESHOLD_APPLICATIONS = ["before", "during", "after"];
const TIMED_APPLICATIONS = ["before", "after"];

function FeeForm({
  initial, onSubmit, onCancel, loading
}: {
  initial?: Partial<Fee>;
  onSubmit: (data: Partial<Fee>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState<Partial<Fee>>({
    name: initial?.name || "",
    code: initial?.code || "",
    feeType: initial?.feeType || "tax",
    calculationMethod: initial?.calculationMethod || "fixed",
    amount: initial?.amount ?? 0,
    currency: initial?.currency || "USD",
    appliesTo: initial?.appliesTo || [],
    metadata: initial?.metadata || {},
    description: initial?.description || "",
    isActive: initial?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('metadata.')) {
      const metaField = field.split('.')[1];
      setForm(f => ({ ...f, metadata: { ...f.metadata, [metaField]: value } }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
    setErrors(e => {
      const newErrors = { ...e };
      delete newErrors[field as string];
      return newErrors;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!form.name || form.name.length < 2) errs.name = "Name must be at least 2 characters";
    if (!initial && (!form.code || form.code.length < 2)) errs.code = "Code must be at least 2 characters";
    if (form.code && !/^[A-Z0-9_]+$/.test(form.code)) errs.code = "Code must be uppercase letters, numbers, and underscores only";
    if (!form.feeType) errs.feeType = "Type is required";
    if (!form.calculationMethod) errs.calculationMethod = "Calculation method is required";
    if (form.amount === undefined || form.amount === null || isNaN(Number(form.amount)) || Number(form.amount) <= 0) errs.amount = "Amount must be a positive number";
    if (!form.currency || form.currency.length !== 3) errs.currency = "Currency must be a 3-letter code";
    if (form.calculationMethod === "percentage") {
      if (!form.metadata?.baseAttribute || form.metadata.baseAttribute.length < 2) errs["metadata.baseAttribute"] = "Select what this percentage is of";
    }
    if (form.calculationMethod === "tiered") {
      if (!form.metadata?.tiers || !Array.isArray(form.metadata.tiers) || form.metadata.tiers.length === 0) {
        errs["metadata.tiers"] = "At least one tier is required";
      } else {
        form.metadata.tiers.forEach((tier: any, idx: number) => {
          if (typeof tier.min !== 'number' || typeof tier.rate !== 'number') {
            errs[`metadata.tiers.${idx}`] = "Each tier must have min and rate";
          }
        });
      }
      if (!form.metadata?.tierAttribute || form.metadata.tierAttribute.length < 2) {
        errs["metadata.tierAttribute"] = "Tier attribute is required (e.g., weight)";
      }
    }
    if (form.calculationMethod === "threshold") {
      if (!form.metadata?.attribute) errs["metadata.attribute"] = "Attribute is required";
      if (form.metadata?.min === undefined || form.metadata?.min === null || isNaN(Number(form.metadata.min))) errs["metadata.min"] = "Min is required";
      if (!form.metadata?.application) errs["metadata.application"] = "Application is required";
    }
    if (form.calculationMethod === "timed") {
      if (form.metadata?.days === undefined || form.metadata?.days === null || isNaN(Number(form.metadata.days))) errs["metadata.days"] = "Number of days is required";
      if (!form.metadata?.application) errs["metadata.application"] = "Application is required";
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Name</label>
          <Input value={form.name} onChange={e => handleChange("name", e.target.value)} />
          {errors.name && <div className="text-xs text-red-600">{errors.name}</div>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Code</label>
          <Input value={form.code} onChange={e => handleChange("code", e.target.value)} />
          {errors.code && <div className="text-xs text-red-600">{errors.code}</div>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Type</label>
          <Select value={form.feeType} onValueChange={v => handleChange("feeType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FEE_TYPES.map(type => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.feeType && <div className="text-xs text-red-600">{errors.feeType}</div>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Calculation Method</label>
          <div className="flex items-center gap-2">
            <Select value={form.calculationMethod} onValueChange={v => handleChange("calculationMethod", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CALC_METHODS.map(method => <SelectItem key={method} value={method}>{method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.calculationMethod === "tiered" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-64 text-xs">Tiered: Apply different rates based on a package attribute (e.g., weight). Each tier defines a min/max and a rate. The rate is applied for the range of the tier.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {form.calculationMethod === "threshold" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-64 text-xs">Threshold: Apply a fee before, during, or after a value threshold for a package attribute (e.g., weight, declared value, or another fee type). You specify the range and when the fee applies.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {form.calculationMethod === "timed" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-64 text-xs">Timed: Apply a fee before or after a certain number of days (e.g., storage fees after 7 days). You specify the number of days and when the fee applies.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {errors.calculationMethod && <div className="text-xs text-red-600">{errors.calculationMethod}</div>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Amount</label>
          <Input type="number" value={form.amount} onChange={e => handleChange("amount", e.target.value === '' ? undefined : Number(e.target.value))} />
          {errors.amount && <div className="text-xs text-red-600">{errors.amount}</div>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Currency</label>
          <Input value={form.currency} onChange={e => handleChange("currency", e.target.value)} />
        </div>
        {form.calculationMethod === "percentage" && (
          <div>
            <label className="block text-xs font-medium mb-1">Percentage Of</label>
            <Select value={form.metadata?.baseAttribute || ""} onValueChange={v => handleChange("metadata.baseAttribute", v)}>
              <SelectTrigger><SelectValue /> </SelectTrigger>
              <SelectContent>
                {PERCENTAGE_BASES.map(base => <SelectItem key={base} value={base}>{base.charAt(0).toUpperCase() + base.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors["metadata.baseAttribute"] && <div className="text-xs text-red-600">{errors["metadata.baseAttribute"]}</div>}
          </div>
        )}
        {form.calculationMethod === "tiered" && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Tiered Rates</label>
            {(form.metadata?.tiers || []).map((tier: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <Input type="number" placeholder="Min" value={tier.min} onChange={e => {
                  const tiers = [...(form.metadata?.tiers || [])];
                  tiers[idx] = { ...tiers[idx], min: Number(e.target.value) };
                  handleChange("metadata.tiers", tiers);
                }} className="w-20" />
                <Input type="number" placeholder="Max" value={tier.max ?? ''} onChange={e => {
                  const tiers = [...(form.metadata?.tiers || [])];
                  tiers[idx] = { ...tiers[idx], max: e.target.value === '' ? null : Number(e.target.value) };
                  handleChange("metadata.tiers", tiers);
                }} className="w-20" />
                <Input type="number" placeholder="Rate" value={tier.rate} onChange={e => {
                  const tiers = [...(form.metadata?.tiers || [])];
                  tiers[idx] = { ...tiers[idx], rate: Number(e.target.value) };
                  handleChange("metadata.tiers", tiers);
                }} className="w-20" />
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => {
                    const tiers = [...(form.metadata?.tiers || [])];
                    tiers.splice(idx, 1);
                    handleChange("metadata.tiers", tiers);
                  }}
                  className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add Attribute*/}


            
            <div className="flex items-center gap-2 mt-2">
              <Button type="button" size="sm" onClick={() => {
                const tiers = [...(form.metadata?.tiers || [])];
                tiers.push({ min: 0, max: null, rate: 0 });
                handleChange("metadata.tiers", tiers);
              }}>Add Tiered Rate</Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-64 text-xs">A tier is a threshold for the attribute selected below. The rate is applied for the range of the tier</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {errors["metadata.tiers"] && <div className="text-xs text-red-600">{errors["metadata.tiers"]}</div>}
            <div className="mt-2">
              <label className="block text-xs font-medium mb-1">Tier Attribute</label>
              <Select value={form.metadata?.tierAttribute || ""} onValueChange={v => handleChange("metadata.tierAttribute", v)}>
                <SelectTrigger><SelectValue placeholder="Select attribute" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="itemCount">Item Count</SelectItem>
                  <SelectItem value="customsDuty">Customs Duty</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  {form.metadata?.tierAttribute && !["weight","itemCount","customsDuty","date"].includes(form.metadata.tierAttribute) && (
                    <SelectItem value={form.metadata.tierAttribute} disabled>
                      {form.metadata.tierAttribute} (legacy/custom)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors["metadata.tierAttribute"] && <div className="text-xs text-red-600">{errors["metadata.tierAttribute"]}</div>}
            </div>
          </div>
        )}
        {form.calculationMethod === "threshold" && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Threshold Attribute</label>
            <Select value={form.metadata?.attribute || ""} onValueChange={v => handleChange("metadata.attribute", v)}>
              <SelectTrigger><SelectValue placeholder="Select attribute" /></SelectTrigger>
              <SelectContent>
                {THRESHOLD_ATTRIBUTES.map(attr => (
                  <SelectItem key={attr} value={attr}>{attr.charAt(0).toUpperCase() + attr.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-2">
              <div>
                <label className="block text-xs font-medium mb-1">Min</label>
                <Input type="number" value={form.metadata?.min ?? ''} onChange={e => handleChange("metadata.min", e.target.value === '' ? undefined : Number(e.target.value))} className="w-24" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Max</label>
                <Input type="number" value={form.metadata?.max ?? ''} onChange={e => handleChange("metadata.max", e.target.value === '' ? null : Number(e.target.value))} className="w-24" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Application</label>
                <Select value={form.metadata?.application || ""} onValueChange={v => handleChange("metadata.application", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {THRESHOLD_APPLICATIONS.map(app => (
                      <SelectItem key={app} value={app}>{app.charAt(0).toUpperCase() + app.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errors["metadata.attribute"] && <div className="text-xs text-red-600">{errors["metadata.attribute"]}</div>}
            {errors["metadata.min"] && <div className="text-xs text-red-600">{errors["metadata.min"]}</div>}
            {errors["metadata.application"] && <div className="text-xs text-red-600">{errors["metadata.application"]}</div>}
          </div>
        )}
        {form.calculationMethod === "timed" && (
          <div className="md:col-span-2">
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs font-medium mb-1">Number of Days</label>
                <Input type="number" value={form.metadata?.days ?? ''} onChange={e => handleChange("metadata.days", e.target.value === '' ? undefined : Number(e.target.value))} className="w-24" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Application</label>
                <Select value={form.metadata?.application || ""} onValueChange={v => handleChange("metadata.application", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {TIMED_APPLICATIONS.map(app => (
                      <SelectItem key={app} value={app}>{app.charAt(0).toUpperCase() + app.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errors["metadata.days"] && <div className="text-xs text-red-600">{errors["metadata.days"]}</div>}
            {errors["metadata.application"] && <div className="text-xs text-red-600">{errors["metadata.application"]}</div>}
          </div>
        )}
        <div className="md:col-span-2">
          <div className="flex items-center gap-1 mb-1">
            <label className="block text-xs font-medium">Applies To Tags</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  If no tags are added, this fee will be applied to all packages regardless of their tags.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-wrap gap-2 mb-1">
            {form.appliesTo?.map((tag: string) => (
              <Badge key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                {tag}
                <button type="button" className="ml-1 text-xs text-red-500 hover:text-red-700" onClick={() => {
                  const newTags = (form.appliesTo || []).filter((t: string) => t !== tag);
                  handleChange("appliesTo", newTags);
                }}>&times;</button>
              </Badge>
            ))}
          </div>
          <Select
            onValueChange={(tag) => {
              if (tag && !(form.appliesTo || []).includes(tag)) {
                handleChange("appliesTo", [...(form.appliesTo || []), tag]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add tag..." />
            </SelectTrigger>
            <SelectContent>
              {PACKAGE_TAGS.filter(tag => !(form.appliesTo || []).includes(tag)).map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.appliesTo && <div className="text-xs text-red-600">{errors.appliesTo}</div>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium mb-1">Description</label>
          <Textarea value={form.description} onChange={e => handleChange("description", e.target.value)} />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={form.isActive} onChange={e => handleChange("isActive", e.target.checked)} id="isActive" />
          <label htmlFor="isActive" className="text-xs">Active</label>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Fee"}</Button>
      </DialogFooter>
    </form>
  );
}

export default function FeesManagementPage() {
  const { user } = useAuth();
  const isAdminL2 = user?.role === "admin_l2";
  const { data: fees, isLoading, error } = useFees();
  const createFee = useCreateFee();
  const updateFee = useUpdateFee();
  const deleteFee = useDeleteFee();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Fee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (fee: Fee) => {
    setEditing(fee);
    setModalOpen(true);
  };
  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleFormSubmit = (data: Partial<Fee>) => {
    // Defensive: always coerce to number
    const amount = typeof data.amount === "number"
      ? data.amount
      : data.amount === undefined
        ? undefined
        : Number(data.amount);

    if (typeof amount !== "number" || isNaN(amount)) {
      // Optionally show error
      return;
    }

    // Only include percentageOf if calculationMethod is 'percentage'
    const payload = {
      ...data,
      amount,
      metadata: {
        ...data.metadata,
        baseAttribute: data.calculationMethod === "percentage" ? data.metadata?.baseAttribute : undefined,
        tiers: data.calculationMethod === "tiered" ? data.metadata?.tiers : undefined,
        tierAttribute: data.calculationMethod === "tiered" ? data.metadata?.tierAttribute : undefined,
        attribute: data.calculationMethod === "threshold" ? data.metadata?.attribute : undefined,
        min: data.calculationMethod === "threshold" ? data.metadata?.min : undefined,
        max: data.calculationMethod === "threshold" ? data.metadata?.max : undefined,
        application: ["threshold", "timed"].includes(data.calculationMethod as string) ? data.metadata?.application : undefined,
        days: data.calculationMethod === "timed" ? data.metadata?.days : undefined,
      },
    };

    // log for debugging
    console.log("Submitting fee payload:", payload);

    if (editing) {
      updateFee.mutate({ id: editing.id, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createFee.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Fee Management</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Company Fees</CardTitle>
            <CardDescription>Manage all fees for your company</CardDescription>
          </div>
          {isAdminL2 && (
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add Fee
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">Failed to load fees</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Calculation Details</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdminL2 && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees && fees.length > 0 ? fees.map(fee => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.name}</TableCell>
                      <TableCell>{fee.code}</TableCell>
                      <TableCell><Badge>{fee.feeType}</Badge></TableCell>
                      <TableCell>{fee.calculationMethod.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{fee.amount}</TableCell>
                      <TableCell>{fee.currency}</TableCell>
                      <TableCell>{fee.calculationMethod === "percentage"
                        ? fee.metadata?.baseAttribute
                        : fee.calculationMethod === "tiered"
                          ? (fee.metadata?.tiers ? fee.metadata.tiers.map((t: any) => `${t.min}-${t.max ?? '∞'}: ${t.rate}`).join(", ") : "-")
                          : fee.calculationMethod === "threshold"
                            ? `${fee.metadata?.attribute ?? ''} ${fee.metadata?.application ?? ''} [${fee.metadata?.min ?? ''} - ${fee.metadata?.max ?? '∞'}]`
                            : fee.calculationMethod === "timed"
                              ? `${fee.metadata?.application ?? ''} ${fee.metadata?.days ?? ''} days`
                              : "-"}</TableCell>
                      <TableCell>{fee.appliesTo?.join(", ")}</TableCell>
                      <TableCell>
                        <Badge variant={fee.isActive ? "success" : "secondary"}>{fee.isActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      {isAdminL2 && (
                        <TableCell className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(fee)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(fee.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No fees found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Calculation Details Legend */}
              <div className="mt-2 text-xs text-muted-foreground">
                <strong>Calculation Details:</strong> For percentage fees, shows the base attribute. For tiered fees, shows the tier structure. For threshold fees, shows the attribute, application, and range.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Fee Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Fee" : "Add Fee"}</DialogTitle>
          </DialogHeader>
          <FeeForm
            initial={editing || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setModalOpen(false)}
            loading={createFee.isPending || updateFee.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this fee? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteId) deleteFee.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
            }} disabled={deleteFee.isPending}>
              {deleteFee.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 