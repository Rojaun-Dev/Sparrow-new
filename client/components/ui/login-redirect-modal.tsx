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
  DialogFooter
} from "@/components/ui/dialog"
import { Home, ArrowRight, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { isIOSMobileInIframe, redirectIOSMobileToMainApp } from "@/lib/utils/iframe-detection"

interface LoginRedirectModalProps {
  className?: string
}

export function LoginRedirectModal({ className }: LoginRedirectModalProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Show modal when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [isAuthenticated, user])

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
  }

  // Don't render if user is not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="sm:max-w-md"
        hideCloseButton={true}
      >
        {/* Custom styled backdrop with blur effect */}
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          
          <DialogTitle className="text-xl font-semibold">
            Hello {user.firstName}!
          </DialogTitle>
          
          <DialogDescription className="text-base text-muted-foreground">
            We see you're already logged in. Would you like to return to your portal?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-col space-y-2 sm:space-y-2 sm:space-x-0">
          <Button 
            onClick={handleGoToPortal}
            className="w-full"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Yes, take me to my portal
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            onClick={handleStayHere}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Stay here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}