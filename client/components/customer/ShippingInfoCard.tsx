import { MapPin, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCompanyShipping, formatShippingAddress } from "@/hooks/useCompanyShipping";
import { useToast } from "@/hooks/use-toast";

export function ShippingInfoCard() {
  const { data: shippingData, isLoading, error } = useCompanyShipping();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!shippingData) return;

    const formattedAddress = formatShippingAddress(shippingData);
    
    try {
      await navigator.clipboard.writeText(formattedAddress);
      setCopied(true);
      toast({
        title: "Address copied",
        description: "Shipping address has been copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Information
          </CardTitle>
          <CardDescription>Loading shipping address...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Information
          </CardTitle>
          <CardDescription>Unable to load shipping address</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please contact support if you need your shipping address.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formattedAddress = formatShippingAddress(shippingData);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shipping Information
        </CardTitle>
        <CardDescription>
          Use this address when sending packages to us
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="whitespace-pre-line text-sm font-mono">
            {formattedAddress}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <p>Your PrefID: <span className="font-semibold">{shippingData?.user.prefId}</span></p>
            <p>Make sure to include this on your packages</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAddress}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Address
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 