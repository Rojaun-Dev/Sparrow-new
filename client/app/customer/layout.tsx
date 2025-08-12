'use client'
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CustomerSidebar } from "@/components/customer/sidebar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"
import { useIOSParentUrl } from "@/hooks/useIOSParentUrl"
import { IOSDebugInfo } from "@/components/ios/IOSDebugInfo"
import DynamicTitle from "@/components/DynamicTitle"

const inter = Inter({ subsets: ["latin"] })


export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Ensure iOS parent URL is detected and stored on customer pages
  const { storedParentUrl } = useIOSParentUrl()
  return (
    <div className="flex min-h-screen flex-col">
      <DynamicTitle/>
      <IOSDebugInfo />
      <div className="flex flex-1">
        <CustomerSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          {/* Mobile menu button */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </div>
          <Breadcrumbs className="mb-4" homeHref="/customer" homeLabel="Dashboard" rootPath="/customer" />
          {children}
        </main>
      </div>
    </div>
  )
} 