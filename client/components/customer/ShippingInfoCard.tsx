import { MapPin, Copy, Check, AlertCircle, Package, Info } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useCompanyShipping, formatShippingAddress } from "@/hooks/useCompanyShipping";
import { useToast } from "@/hooks/use-toast";
import { copyTextWithFeedback } from "@/lib/utils/copy";

export function ShippingInfoCard() {
  const { data: shippingData, isLoading, error } = useCompanyShipping();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!shippingData) return;

    const formattedAddress = formatShippingAddress(shippingData);
    
    const result = await copyTextWithFeedback(formattedAddress);
    
    if (result.success) {
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
    
    toast({
      title: result.title,
      description: result.description,
      variant: result.variant,
    });
  };
// cleanup
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Shipping Information</CardTitle>
              <CardDescription className="text-sm">Loading shipping address...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded-md" />
            <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded-md w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Shipping Information</CardTitle>
              <CardDescription className="text-sm">Unable to load shipping address</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please contact support if you need your shipping address.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formattedAddress = formatShippingAddress(shippingData);
  const hasAddress = shippingData?.company.shipping_info.address_line1;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasAddress ? 'bg-primary/10' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
            <MapPin className={`h-5 w-5 ${hasAddress ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Shipping Information</CardTitle>
              {hasAddress ? (
                <Badge variant="success" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Setup Required
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm">
              {hasAddress 
                ? "Use this address when sending packages to us"
                : "Shipping address needs to be configured"
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasAddress ? (
          <>
            <div className="relative">
              <div className="bg-muted/50 rounded-lg p-4 border border-muted/50">
                <div className="whitespace-pre-line text-sm font-mono leading-relaxed text-foreground">
                  {formattedAddress}
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm hidden sm:flex">
                  <Info className="h-3 w-3 mr-1" />
                  Shipping Address
                </Badge>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-medium">
                    Your Shipping ID
                  </Badge>
                  <span className="text-sm font-mono font-semibold text-primary">
                    {shippingData?.user.prefId}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Make sure to include this on your packages
                </p>
              </div>
              
              <Button
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopyAddress}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  copied 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'hover:bg-primary hover:text-primary-foreground'
                }`}
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
          </>
        ) : (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Your shipping address has not been configured yet. Please contact your administrator to set up the shipping information.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 