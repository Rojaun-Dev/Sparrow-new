"use client"

import type React from "react"

import { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ConfirmationDialogProps {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  onConfirm: () => Promise<void> | void
  trigger: React.ReactNode
}

export function ConfirmationDialog({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  onConfirm,
  trigger,
}: ConfirmationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = useCallback(async () => {
    try {
      setIsLoading(true)
      await onConfirm()
      setOpen(false)
    } catch (error) {
      console.error("Error in confirmation action:", error)
    } finally {
      setIsLoading(false)
    }
  }, [onConfirm])

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant={variant} onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
