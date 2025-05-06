"use client"

import type React from "react"

import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { createContext, useContext, useCallback } from "react"

type FeedbackType = "success" | "error" | "warning" | "info"

interface FeedbackContextType {
  showFeedback: (message: string, type: FeedbackType, title?: string, duration?: number) => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()

  const showFeedback = useCallback(
    (message: string, type: FeedbackType, title?: string, duration = 5000) => {
      toast({
        title: title || type.charAt(0).toUpperCase() + type.slice(1),
        description: message,
        variant: type === "success" ? "default" : type === "error" ? "destructive" : "outline",
        duration: duration,
      })
    },
    [toast],
  )

  return (
    <FeedbackContext.Provider value={{ showFeedback }}>
      {children}
      <Toaster />
    </FeedbackContext.Provider>
  )
}

export const useFeedback = () => {
  const context = useContext(FeedbackContext)
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}
