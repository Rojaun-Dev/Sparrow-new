'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to a reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-md">
            <div className="space-y-2 text-center">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-red-600">Critical Error</h1>
              <p className="text-sm text-muted-foreground">
                A critical error occurred in the application. Our team has been notified.
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
              )}
            </div>
            
            <div className="flex flex-col space-y-4">
              <Button onClick={reset} className="w-full">
                Try Again
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
} 