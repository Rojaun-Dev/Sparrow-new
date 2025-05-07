import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { FeedbackProvider } from "@/components/ui/toast-provider"
import { AuthProvider } from "@/hooks/useAuth"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SparrowX - Package Forwarding Service",
  description: "Multi-tenant SaaS platform for package forwarding services",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <FeedbackProvider>{children}</FeedbackProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
