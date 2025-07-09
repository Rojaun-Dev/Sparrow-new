"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  href: string
  label: string
  isCurrent?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  homeHref?: string
  homeLabel?: string
  homeIcon?: React.ReactNode
  separator?: React.ReactNode
  className?: string
  showHomeIcon?: boolean
  rootPath?: string
}

export function Breadcrumbs({
  items,
  homeHref = "/",
  homeLabel = "Home",
  homeIcon = <Home className="h-4 w-4" />,
  separator = <ChevronRight className="h-4 w-4" />,
  className,
  showHomeIcon = true,
  rootPath,
}: BreadcrumbsProps) {
  const pathname = usePathname()

  // If items are not provided, generate them from the current path
  const breadcrumbItems = items || generateBreadcrumbItems(pathname, rootPath)

  // Skip rendering breadcrumbs if we're at the home page or have no items
  if (breadcrumbItems.length === 0 || pathname === homeHref) {
    return null
  }

  return (
    <nav
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumbs"
    >
      <ol className="flex items-center space-x-1">
        {/* Home item */}
        <li>
          <Link href={homeHref} className="flex items-center hover:text-foreground">
            {showHomeIcon ? homeIcon : homeLabel}
            {showHomeIcon && <span className="sr-only">{homeLabel}</span>}
          </Link>
        </li>

        {/* Generated breadcrumb items */}
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {separator}
            <span className={cn("ml-1", item.isCurrent ? "font-medium text-foreground" : "")}>{item.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Generate breadcrumb items from a pathname
 */
export function generateBreadcrumbItems(pathname: string, rootPath?: string): BreadcrumbItem[] {
  // Remove the root path if provided
  const path = rootPath ? pathname.replace(new RegExp(`^${rootPath}`), "") : pathname

  // Split the path into segments and filter out empty segments
  const pathSegments = path.split("/").filter(Boolean)

  if (pathSegments.length === 0) {
    return []
  }

  // Create breadcrumb items with proper labels and links
  return pathSegments.map((segment, index) => {
    // Build the href based on the original pathname
    const href = rootPath
      ? `${rootPath}/${pathSegments.slice(0, index + 1).join("/")}`
      : `/${pathSegments.slice(0, index + 1).join("/")}`

    // Format the segment for display (capitalize, replace hyphens with spaces)
    let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")

    // Handle special cases for IDs in the path
    if (segment.match(/^[0-9a-f]{8,}$/i)) {
      // Check if this is a customer ID in the path /admin/customers/[id]
      if (index > 0 && pathSegments[index-1] === "customers") {
        label = "Customer Details"
      } else {
        label = "Details"
      }
    }

    return {
      href,
      label,
      isCurrent: index === pathSegments.length - 1,
    }
  })
}
