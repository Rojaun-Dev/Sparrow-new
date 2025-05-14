import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CustomerHeader } from "@/components/customer/header"
import { CustomerSidebar } from "@/components/customer/sidebar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SparrowX Customer Dashboard",
  description: "Customer Dashboard for SparrowX Package Forwarding Platform",
}

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <CustomerHeader />
      <div className="flex flex-1">
        <CustomerSidebar />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          <Breadcrumbs className="mb-4" homeHref="/customer" homeLabel="Dashboard" rootPath="/customer" />
          {children}
        </main>
      </div>
    </div>
  )
} 