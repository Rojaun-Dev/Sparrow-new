// Environment loading (Must be first import)
import "@/lib/env";
// Debug script to verify env variables (remove in production)
import "@/lib/debug-env";
import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { FeedbackProvider } from "@/components/ui/toast-provider"
import { AuthProvider } from "@/hooks/useAuth"
import "./globals.css"
import { QueryProvider } from "@/lib/providers/QueryProvider"
import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CompanyProvider } from "@/hooks/useCompanyContext"
import { CurrencyProvider } from "@/components/providers/CurrencyProvider"
import CompanyMetaTags from "@/components/CompanyMetaTags"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SparrowX",
  description: "SparrowX Package Forwarding Platform",
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <CompanyMetaTags />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <CompanyProvider>
                <CurrencyProvider>
                  <TooltipProvider>
                    <FeedbackProvider>{children}</FeedbackProvider>
                  </TooltipProvider>
                </CurrencyProvider>
              </CompanyProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
