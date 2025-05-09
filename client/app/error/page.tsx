"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error") || ""
  const errorDescription = searchParams?.get("error_description") || ""

  return (
    <>
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">{error}</p>
          {errorDescription && <p className="mt-1">{errorDescription}</p>}
        </div>
      )}
    </>
  )
}

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-md">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-red-600">Authentication Error</h1>
          <p className="text-sm text-muted-foreground">
            There was a problem with your authentication request
          </p>
        </div>

        <Suspense fallback={<div className="h-12 animate-pulse rounded bg-gray-100"></div>}>
          <ErrorContent />
        </Suspense>

        <div className="flex flex-col space-y-4">
          <Button asChild>
            <Link href="/">Return to Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Try Signing Up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 