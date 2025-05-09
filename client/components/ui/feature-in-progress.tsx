'use client'

import type React from "react"
import { Construction } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureInProgressProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  className?: string
}

export function FeatureInProgress({
  title = "Coming Soon",
  description = "This feature is currently in development and will be available in a future update.",
  icon = <Construction className="h-8 w-8" />,
  className,
}: FeatureInProgressProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed p-8 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
