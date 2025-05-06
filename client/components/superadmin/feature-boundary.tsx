"use client"

import type React from "react"

import { useEffect } from "react"
import { FeatureInProgress } from "@/components/ui/feature-in-progress"
import type { LucideIcon } from "lucide-react"

interface FeatureBoundaryProps {
  title?: string
  description?: string
  icon?: LucideIcon
  error?: Error & { digest?: string }
  reset?: () => void
  children: React.ReactNode
}

export function FeatureBoundary({
  title = "Coming Soon",
  description = "This feature is currently in development and will be available in a future update.",
  icon,
  error,
  reset,
  children,
}: FeatureBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    if (error) {
      console.error("Feature boundary caught error:", error)
    }
  }, [error])

  // If there's an error or the feature is explicitly marked as coming soon, show the FeatureInProgress component
  if (error) {
    return (
      <FeatureInProgress
        title={title}
        description={description || "We encountered an error while loading this feature. Our team is working on it."}
        icon={icon}
      />
    )
  }

  // Otherwise, render the children
  return <>{children}</>
}
