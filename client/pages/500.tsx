import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Custom500() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-md">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-red-600">500 - Server Error</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred on our server
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