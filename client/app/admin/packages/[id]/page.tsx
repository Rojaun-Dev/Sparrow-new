"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { usePackage, useUpdatePackageStatus, useAssignUserToPackage } from "@/hooks/usePackages"
import { useInvoiceByPackageId } from "@/hooks/useInvoices"
import { usePreAlertsByPackageId } from "@/hooks/usePreAlerts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PackageStatus } from "@/lib/api/types"
import { toast } from "@/components/ui/use-toast"
import { Pencil, UserPlus, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCurrency } from "@/hooks/useCurrency"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AssignUserModal } from "@/components/packages/AssignUserModal"
import { QuickInvoiceDialog } from "@/components/invoices/QuickInvoiceDialog"
import { useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUsers"
import { DutyFeeModal } from "@/components/duty-fee-modal"
import { useQuery, useMutation } from "@tanstack/react-query"
import { dutyFeeService } from "@/lib/api/dutyFeeService"

const PACKAGE_STATUS_OPTIONS: PackageStatus[] = [
  "pre_alert",
  "received",
  "processed",
  "ready_for_pickup",
  "delivered",
  "returned"
];

// Predefined tags for dropdown
const PREDEFINED_TAGS = [
  "general",
  "fragile",
  "express",
  "electronics",
  "clothing",
  "documents",
  "oversized",
  "hazardous",
  "priority"
];

export default function AdminPackageDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [editMode, setEditMode] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [sendNotification, setSendNotification] = useState(false);
  const { data: packageData, isLoading, isError, error } = usePackage(id);
  const { data: relatedInvoice, isLoading: isLoadingInvoice, isError: isInvoiceError, error: invoiceError } = useInvoiceByPackageId(id);
  const { data: prealerts, isLoading: isLoadingPrealerts } = usePreAlertsByPackageId(id);

  // Currency conversion
  const { convertAndFormatInvoiceTotal } = useCurrency();

  // Fetch user data if packageData.userId is available
  const { data: userData, isLoading: isUserLoading } = useUser(
    packageData?.userId || undefined
  );
  
  const updateStatusMutation = useUpdatePackageStatus();
  const [form, setForm] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const tagsArray = form?.tags ? form.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [];
  const router = useRouter();
  const [showQuickInvoice, setShowQuickInvoice] = useState(false);
  const queryClient = useQueryClient();
  
  // Add state for assign user modal
  const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);
  
  // Add state for duty fee modal
  const [dutyFeeModalOpen, setDutyFeeModalOpen] = useState(false);
  
  // Add state for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<any>(null);
  
  // Fetch duty fees for this package
  const { data: dutyFees, isLoading: isDutyFeesLoading } = useQuery({
    queryKey: ['duty-fees', id],
    queryFn: () => dutyFeeService.getDutyFeesByPackageId(id),
    enabled: !!id,
  });

  // Delete duty fee mutation
  const deleteDutyFeeMutation = useMutation({
    mutationFn: (feeId: string) => dutyFeeService.deleteDutyFee(feeId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Duty fee has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['duty-fees', id] });
      setDeleteConfirmOpen(false);
      setFeeToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove duty fee.",
        variant: "destructive",
      });
    },
  });

  if (!packageData) {
    return null;
  }

  // When entering edit mode, initialize form state
  const startEdit = () => {
    setForm({
      status: packageData.status,
      description: packageData.description,
      weight: packageData.weight || "",
      dimensions: packageData.dimensions || { length: "", width: "", height: "" },
      declaredValue: packageData.declaredValue || "",
      senderInfo: packageData.senderInfo || { name: "", address: "", phone: "" },
      tags: packageData.tags ? packageData.tags.join(", ") : "",
      trackingNumber: packageData.trackingNumber,
    });
    setEditMode(true);
  };

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handle save
  const handleSave = () => {
    setShowNotificationPrompt(true);
  };

  // Confirm save and send mutation
  const handleConfirmSave = (notify: boolean) => {
    updateStatusMutation.mutate({
      id: packageData.id,
      status: form.status,
      sendNotification: notify,
      // TODO: Add other fields to update mutation if supported by backend
    }, {
      onSuccess: () => {
        toast({ title: "Package updated" });
        setEditMode(false);
        setShowNotificationPrompt(false);
      },
      onError: () => {
        toast({ title: "Failed to update package", variant: "destructive" });
      }
    });
  };

  // Photos
  const packagePhotos = packageData.photos || [];

  // Tag helpers for edit mode
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!tagsArray.includes(tagInput.trim())) {
        handleFormChange("tags", [...tagsArray, tagInput.trim()].join(", "));
      }
      setTagInput("");
    }
  };
  const handleRemoveTag = (tag: string) => {
    handleFormChange("tags", tagsArray.filter((t: string) => t !== tag).join(", "));
  };

  // Handle opening the assign user modal
  const handleAssignUser = () => {
    setAssignUserModalOpen(true);
  };

  // Handle successful user assignment
  const handleAssignSuccess = () => {
    toast({
      title: "Success",
      description: "Customer assigned to package successfully",
    });
    // Refresh package data
    queryClient.invalidateQueries({ queryKey: ['packages', 'detail', id] });
  };

  // Handle delete fee button click
  const handleDeleteFee = (fee: any) => {
    setFeeToDelete(fee);
    setDeleteConfirmOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (feeToDelete) {
      deleteDutyFeeMutation.mutate(feeToDelete.id);
    }
  };

  // Check if package status allows fee modifications
  const restrictedStatuses = ['ready_for_pickup', 'delivered'];
  const hasInvoice = relatedInvoice && !isInvoiceError;
  const canModifyFees = !restrictedStatuses.includes(packageData?.status || '') && !hasInvoice;

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (isError) {
    // Only show a fatal error if it's not a 404 for invoice
    const errorStatus = typeof error === 'object' && error !== null && 'status' in error ? (error as any).status : undefined;
    if (!error || errorStatus !== 404) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <h3 className="text-xl font-semibold mb-2">Error Loading Package</h3>
          <p className="text-muted-foreground mb-4">{error?.message || "Failed to load package details"}</p>
          <Button asChild variant="outline">
            <Link href="/admin/packages">Return to Packages</Link>
          </Button>
        </div>
      );
    }
    // else, allow page to load (404 for invoice is not fatal)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/packages">Back</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Package Details </h1>
          <Badge>{packageData.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 ">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Information</CardTitle>
              <CardDescription>Details about this package and its current status.</CardDescription>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select value={form.status} onValueChange={v => handleFormChange("status", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGE_STATUS_OPTIONS.map(status => (
                          <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea value={form.description} onChange={e => handleFormChange("description", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Weight</label>
                    <Input type="number" value={form.weight} onChange={e => handleFormChange("weight", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dimensions (L × W × H)</label>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Length" value={form.dimensions.length} onChange={e => handleFormChange("dimensions", { ...form.dimensions, length: e.target.value })} />
                      <Input type="number" placeholder="Width" value={form.dimensions.width} onChange={e => handleFormChange("dimensions", { ...form.dimensions, width: e.target.value })} />
                      <Input type="number" placeholder="Height" value={form.dimensions.height} onChange={e => handleFormChange("dimensions", { ...form.dimensions, height: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Declared Value</label>
                    <Input type="number" value={form.declaredValue} onChange={e => handleFormChange("declaredValue", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sender Name</label>
                    <Input value={form.senderInfo.name} onChange={e => handleFormChange("senderInfo", { ...form.senderInfo, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sender Address</label>
                    <Input value={form.senderInfo.address} onChange={e => handleFormChange("senderInfo", { ...form.senderInfo, address: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sender Phone</label>
                    <Input value={form.senderInfo.phone} onChange={e => handleFormChange("senderInfo", { ...form.senderInfo, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tagsArray.map((tag: string) => (
                        <Badge key={tag} className="flex items-center gap-1 px-2 py-1">
                          {tag}
                          <button
                            type="button"
                            className="ml-1 text-xs text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveTag(tag)}
                            aria-label={`Remove tag ${tag}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Type a tag and press Enter or comma"
                        className="flex-1"
                      />
                      <Select
                        onValueChange={tag => {
                          if (!tagsArray.includes(tag)) {
                            handleFormChange("tags", [...tagsArray, tag].join(", "));
                          }
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Add tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {PREDEFINED_TAGS.filter(tag => !tagsArray.includes(tag)).map(tag => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tracking Number</label>
                    <Input value={form.trackingNumber} onChange={e => handleFormChange("trackingNumber", e.target.value)} />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Tracking Number</h3>
                        <p className="text-base font-medium">{packageData.trackingNumber}</p>
                      </div>
                      {packageData.internalTrackingId && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Internal ID</h3>
                          <p className="text-base">{packageData.internalTrackingId}</p>
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                        <p className="text-base">{packageData.description}</p>
                      </div>
                      {packageData.weight && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Weight</h3>
                          <p className="text-base">{packageData.weight}</p>
                        </div>
                      )}
                      {packageData.dimensions && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Dimensions</h3>
                          <p className="text-base">
                            {packageData.dimensions.length} × {packageData.dimensions.width} × {packageData.dimensions.height}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {packageData.declaredValue && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Declared Value</h3>
                          <p className="text-base">{packageData.declaredValue}</p>
                        </div>
                      )}
                      {packageData.senderInfo && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Sender</h3>
                          <p className="text-base">{packageData.senderInfo.name}</p>
                          <p className="text-sm text-muted-foreground">{packageData.senderInfo.address}</p>
                        </div>
                      )}
                      {packageData.receivedDate && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Received Date</h3>
                          <p className="text-base">{new Date(packageData.receivedDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {/* Customer Information Section */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Customer</h3>
                        <div className="bg-muted/30 p-3 rounded-md">
                          {packageData.userId ? (
                            <div className="flex items-center justify-between">
                              <div>
                                {isUserLoading ? (
                                  <Skeleton className="h-10 w-48" />
                                ) : userData ? (
                                  <>
                                    <p className="font-medium">
                                      {userData.firstName} {userData.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {userData.email}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-muted-foreground">Customer information unavailable</p>
                                )}
                              </div>
                              <Link href={`/admin/customers/${packageData.userId}`}>
                                <Button size="sm" variant="outline">View Customer</Button>
                              </Link>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <p className="text-muted-foreground">No customer assigned</p>
                              <Button 
                                size="sm" 
                                onClick={handleAssignUser}
                                className="flex items-center gap-1"
                              >
                                <UserPlus className="h-4 w-4" />
                                Assign Customer
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {packageData.notes && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                        <div className="rounded-md bg-muted p-4 text-sm">
                          {packageData.notes}
                        </div>
                      </div>
                    </>
                  )}
          <Button 
            className="mt-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" 
            variant="outline" 
            size="sm" 
            onClick={startEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Related Prealerts, Duty Fees, and Related Invoice */}
          <Tabs defaultValue="prealerts" className="w-full mt-4">
            <TabsList className="mb-2">
              <TabsTrigger value="prealerts">Related Prealerts</TabsTrigger>
              <TabsTrigger value="duty-fees">Duty Fees</TabsTrigger>
              <TabsTrigger value="invoice">Related Invoice</TabsTrigger>
            </TabsList>
            <TabsContent value="prealerts">
              <Card>
                <CardHeader>
                  <CardTitle>Related Prealerts</CardTitle>
                  <CardDescription>Show all prealerts linked to this package.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPrealerts ? (
                    <Skeleton className="h-8 w-full" />
                  ) : prealerts && prealerts.length > 0 ? (
                    <ul className="space-y-2">
                      {prealerts.map((prealert: any) => (
                        <li key={prealert.id} className="border rounded p-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <span className="font-medium">{prealert.trackingNumber}</span>
                            <span className="block text-xs text-muted-foreground">{prealert.description}</span>
                            <span className="block text-xs">Status: {prealert.status}</span>
                          </div>
                          <Button
                            variant="outline"
                            className="mt-2 md:mt-0"
                            asChild
                          >
                            <Link href={`/admin/pre-alerts/${prealert.id}`}>
                              View
                            </Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-muted-foreground">No related prealerts found.</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        asChild
                      >
                        <Link href={`/admin/pre-alerts?search=${packageData.trackingNumber}`}>
                        Match Prealert
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="duty-fees">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Duty Fees</CardTitle>
                    <CardDescription>Fees associated with this package for customs and duties.</CardDescription>
                  </div>
                  {canModifyFees && (
                    <Button
                      size="sm"
                      onClick={() => setDutyFeeModalOpen(true)}
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      variant="outline"
                    >
                      Add Duty Fee
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isDutyFeesLoading ? (
                    <Skeleton className="h-8 w-full" />
                  ) : dutyFees && dutyFees.length > 0 ? (
                    <div className="space-y-3">
                      {dutyFees.map((fee: any) => (
                        <div key={fee.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">
                                  {fee.feeType === 'Other' && fee.customFeeType ? fee.customFeeType : fee.feeType}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {fee.currency} {parseFloat(fee.amount).toFixed(2)}
                                </span>
                              </div>
                              {fee.description && (
                                <p className="text-sm text-gray-600">{fee.description}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Added on {new Date(fee.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {fee.currency} {parseFloat(fee.amount).toFixed(2)}
                              </Badge>
                              {canModifyFees && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteFee(fee)}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total USD:</span>
                          <span>
                            ${dutyFees
                              .filter((fee: any) => fee.currency === 'USD')
                              .reduce((sum: number, fee: any) => sum + parseFloat(fee.amount), 0)
                              .toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total JMD:</span>
                          <span>
                            J${dutyFees
                              .filter((fee: any) => fee.currency === 'JMD')
                              .reduce((sum: number, fee: any) => sum + parseFloat(fee.amount), 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {!canModifyFees && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-500 text-center">
                            {hasInvoice 
                              ? "Cannot modify duty fees - package has an associated invoice."
                              : "Cannot modify duty fees - package is ready for pickup or delivered."
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <p className="text-muted-foreground">No duty fees have been added to this package.</p>
                      {canModifyFees ? (
                        <Button
                          size="sm"
                          onClick={() => setDutyFeeModalOpen(true)}
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          variant="outline"
                        >
                          Add Duty Fee
                        </Button>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {hasInvoice 
                            ? "Cannot modify duty fees - package has an associated invoice."
                            : "Cannot modify duty fees - package is ready for pickup or delivered."
                          }
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="invoice">
              {isLoadingInvoice ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ) : isInvoiceError && typeof invoiceError === 'object' && invoiceError !== null && 'status' in invoiceError && (invoiceError as any).status === 404 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Related Invoice</CardTitle>
                    <CardDescription>No invoice found for this package.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          onClick={() => setShowQuickInvoice(true)}
                          >
                            Quick Invoice
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Generate invoice for this item only</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            onClick={() => router.push(`/admin/invoices/create?customerId=${packageData.userId}&packageId=${packageData.id}`)}
                          >
                            Create Invoice
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Manually create invoice for customer</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              ) : relatedInvoice ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Related Invoice</CardTitle>
                    <CardDescription>Billing information for this package</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                          <p className="text-base font-medium">{relatedInvoice.invoiceNumber}</p>
                        </div>
                        <Badge>{relatedInvoice.status}</Badge>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                        <p className="text-base font-medium">
                          {convertAndFormatInvoiceTotal(Number(relatedInvoice.totalAmount))}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                          <p className="text-base">{new Date(relatedInvoice.dueDate).toLocaleDateString()}</p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/invoices/${relatedInvoice.id}`}>
                            View Invoice
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-6">
          {/* Notification Prompt */}
          {showNotificationPrompt && (
            <Dialog open={showNotificationPrompt} onOpenChange={setShowNotificationPrompt}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Notification?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Would you like to notify the customer about these changes?</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleConfirmSave(true)}>Yes, Send Notification</Button>
                    <Button variant="outline" onClick={() => handleConfirmSave(false)}>No, Don't Send</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      {/* Quick Invoice Dialog */}
      <QuickInvoiceDialog
        open={showQuickInvoice}
        onOpenChange={setShowQuickInvoice}
        packageId={packageData?.id || null}
        userId={packageData?.userId || null}
      />
      {/* Add the AssignUserModal at the end of the component */}
      <AssignUserModal
        open={assignUserModalOpen}
        onOpenChange={setAssignUserModalOpen}
        packageId={id}
        onSuccess={handleAssignSuccess}
        companyId={packageData?.companyId}
      />
      
      {/* Add the DutyFeeModal at the end of the component */}
      <DutyFeeModal
        isOpen={dutyFeeModalOpen}
        onClose={() => setDutyFeeModalOpen(false)}
        packageId={id}
        packageStatus={packageData?.status || ''}
        hasInvoice={hasInvoice}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Duty Fee</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove this duty fee? This action cannot be undone.
            </p>
            {feeToDelete && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="font-medium">
                  {feeToDelete.feeType === 'Other' && feeToDelete.customFeeType 
                    ? feeToDelete.customFeeType 
                    : feeToDelete.feeType}
                </div>
                <div className="text-sm text-gray-500">
                  {feeToDelete.currency} {parseFloat(feeToDelete.amount).toFixed(2)}
                </div>
                {feeToDelete.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {feeToDelete.description}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteDutyFeeMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteDutyFeeMutation.isPending}
            >
              {deleteDutyFeeMutation.isPending ? "Removing..." : "Remove Fee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 