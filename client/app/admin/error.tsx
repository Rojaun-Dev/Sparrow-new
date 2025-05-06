"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin section error:", error)
  }, [error])

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>An error occurred while loading this page. Our team has been notified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error.message || "An unexpected error occurred"}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
