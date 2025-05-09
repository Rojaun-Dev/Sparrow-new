'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-md">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-amber-600">Something went wrong!</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error has occurred
          </p>
        </div>
        
        <Button onClick={() => reset()} className="w-full">
          Try again
        </Button>
      </div>
    </div>
  )
} 