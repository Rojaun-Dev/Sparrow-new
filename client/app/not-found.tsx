'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-md">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600">404 - Page Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 