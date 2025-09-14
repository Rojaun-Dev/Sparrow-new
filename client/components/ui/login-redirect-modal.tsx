"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal
} from "@/components/ui/dialog"
import { ArrowRight, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { isIOSMobileInIframe, redirectIOSMobileToMainApp } from "@/lib/utils/iframe-detection"

interface LoginRedirectModalProps {
  className?: string
  onOpenChange?: (open: boolean) => void
}

export function LoginRedirectModal({ className, onOpenChange }: LoginRedirectModalProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Show modal when user is authenticated
  useEffect(() => {
    const shouldOpen = isAuthenticated && user
    setOpen(shouldOpen)
    onOpenChange?.(shouldOpen)
  }, [isAuthenticated, user, onOpenChange])

  // Get portal route based on user role
  const getPortalRoute = (): string => {
    if (!user?.role) return '/'
    
    switch (user.role) {
      case 'customer':
        return '/customer'
      case 'admin_l1':
      case 'admin_l2':
        return '/admin'
      case 'super_admin':
        return '/superadmin'
      default:
        return '/'
    }
  }

  const handleGoToPortal = () => {
    const route = getPortalRoute()
    setOpen(false)
    onOpenChange?.(false)

    // Check if this is iOS mobile in iframe - use redirection to main app
    if (isIOSMobileInIframe()) {
      console.log('iOS mobile iframe detected - redirecting modal to main app')
      redirectIOSMobileToMainApp(route)
    } else {
      // Normal navigation for other devices/contexts
      router.push(route)
    }
  }

  const handleStayHere = () => {
    setOpen(false)
    onOpenChange?.(false)
  }

  // Don't render if user is not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        {/* Custom blurred backdrop overlay */}
        <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <DialogContent 
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-2 border-border/30 bg-background/95 backdrop-blur-sm p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl"
          hideCloseButton={true}
        >
          <DialogHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center ">
              <img
                src="/logo-background.png?key=e5zuj"
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            
            <DialogTitle className="text-2xl font-bold text-primary">
              Hello {user.firstName}!
            </DialogTitle>
            
            <DialogDescription className="text-base text-muted-foreground leading-relaxed px-2">
              We see you're already logged in. Would you like to return to your portal?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleGoToPortal}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
              size="lg"
            >
              Yes, take me to my portal
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button 
              onClick={handleStayHere}
              variant="outline"
              className="w-full border-2 hover:bg-muted/50 font-medium transition-all duration-200"
              size="lg"
            >
              Stay here
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}