"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

interface FloatingPortalButtonProps {
  className?: string
}

export function FloatingPortalButton({ className }: FloatingPortalButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  // Show button only when user is authenticated
  useEffect(() => {
    setIsVisible(isAuthenticated && !!user)
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

  const handleClick = () => {
    const route = getPortalRoute()
    router.push(route)
  }

  if (!isVisible) return null

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={cn(
        "fixed bottom-6 right-6 z-[9999] h-14 px-6 shadow-lg hover:shadow-xl",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "transition-all duration-300 ease-in-out",
        "hover:scale-105 active:scale-95",
        "rounded-full group",
        "border-2 border-primary-foreground/20",
        className
      )}
      aria-label="Return to portal"
    >
      <Home className="h-5 w-5 mr-2 group-hover:animate-pulse" />
      <span className="font-medium">Portal</span>
      <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
    </Button>
  )
}