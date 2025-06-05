'use client'
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CustomerSidebar } from "@/components/customer/sidebar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { useState } from "react"

const inter = Inter({ subsets: ["latin"] })


export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <CustomerSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          <Breadcrumbs className="mb-4" homeHref="/customer" homeLabel="Dashboard" rootPath="/customer" />
          {children}
        </main>
      </div>
    </div>
  )
} 