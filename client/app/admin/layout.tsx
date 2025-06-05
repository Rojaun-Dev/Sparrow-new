import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AdminSidebarDesktop, AdminSidebarMobile } from "@/components/admin/sidebar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

// Config to prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SparrowX Admin Dashboard",
  description: "Admin Dashboard for SparrowX Package Forwarding Platform",
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <AdminSidebarMobile />
            <div className="flex flex-1">
              <AdminSidebarDesktop />
              <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
                <Breadcrumbs className="mb-4" homeHref="/admin" homeLabel="Dashboard" rootPath="/admin" />
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
} 