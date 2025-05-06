"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

interface BreadcrumbsProps {
  className?: string
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Skip rendering breadcrumbs on the main admin page
  if (pathname === "/superadmin") {
    return null
  }

  // Generate breadcrumb items from the current path
  const pathSegments = pathname.split("/").filter(Boolean)

  // Create breadcrumb items with proper labels and links
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join("/")}`

    // Format the segment for display (capitalize, replace hyphens with spaces)
    let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")

    // Handle special cases for IDs in the path
    if (segment.match(/^[0-9a-f]{8,}$/i)) {
      label = "Details"
    }

    return { href, label }
  })

  return (
    <nav
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumbs"
    >
      <ol className="flex items-center space-x-1">
        <li>
          <Link href="/superadmin" className="flex items-center hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="flex items-center">
            <ChevronRight className="h-4 w-4" />
            <Link
              href={item.href}
              className={cn(
                "ml-1 hover:text-foreground",
                index === breadcrumbItems.length - 1 ? "font-medium text-foreground" : "",
              )}
              aria-current={index === breadcrumbItems.length - 1 ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
