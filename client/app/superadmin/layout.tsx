import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SuperAdminHeader } from "@/components/superadmin/header"
import { SuperAdminSidebar } from "@/components/superadmin/sidebar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

// Config to prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SparrowX Super Admin Dashboard",
  description: "Super Admin Dashboard for SparrowX Package Forwarding Platform",
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
          <div className="flex min-h-screen flex-col">
            <SuperAdminHeader />
            <div className="flex flex-1">
              <SuperAdminSidebar />
              <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
                <Breadcrumbs className="mb-4" homeHref="/superadmin" homeLabel="Dashboard" rootPath="/superadmin" />
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
