'use client'

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SuperAdminSidebar } from "@/components/superadmin/sidebar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { useState } from "react"
import DynamicTitle from "@/components/DynamicTitle"

// Config to prevent static optimization
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] })

// Client component wrapper to handle sidebar state
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <SuperAdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          <Breadcrumbs className="mb-4" homeHref="/superadmin" homeLabel="Dashboard" rootPath="/superadmin" />
          {children}
        </main>
      </div>
    </div>
  )
}

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <DynamicTitle />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
