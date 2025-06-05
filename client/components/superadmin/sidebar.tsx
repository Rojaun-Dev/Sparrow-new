"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Building2, ChevronDown, DollarSign, Menu, ScrollText, Settings, Users, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  submenu?: {
    title: string
    href: string
    comingSoon?: boolean
  }[]
  comingSoon?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Companies",
    href: "/superadmin/companies",
    icon: Building2,
    submenu: [
      { title: "All Companies", href: "/superadmin/companies" },
      { title: "Create Company", href: "/superadmin/companies/create" },
    ],
  },
  {
    title: "Users",
    href: "/superadmin/users",
    icon: Users,
    submenu: [
      { title: "All Users", href: "/superadmin/users" },
      { title: "Admins", href: "/superadmin/users/admins" },
      { title: "Invitations", href: "/superadmin/users/invitations" },
    ],
  },
  {
    title: "Fees & Billing",
    href: "/superadmin/billing",
    icon: DollarSign,
    submenu: [
      { title: "Global Fee Templates", href: "/superadmin/billing/templates", comingSoon: true },
      { title: "Billing Reports", href: "/superadmin/billing/reports", comingSoon: true },
      { title: "Payment Gateways", href: "/superadmin/billing/gateways", comingSoon: true },
    ],
    comingSoon: true,
  },
  {
    title: "Metrics",
    href: "/superadmin/metrics",
    icon: BarChart3,
    submenu: [
      { title: "Platform Overview", href: "/superadmin/metrics", comingSoon: true },
      { title: "Company Breakdown", href: "/superadmin/metrics/companies", comingSoon: true },
      { title: "User Analytics", href: "/superadmin/metrics/users", comingSoon: true },
    ],
    comingSoon: true,
  },
  {
    title: "System Logs",
    href: "/superadmin/logs",
    icon: ScrollText,
    submenu: [
      { title: "Audit Logs", href: "/superadmin/logs/audit", comingSoon: true },
      { title: "Webhook Events", href: "/superadmin/logs/webhooks", comingSoon: true },
      { title: "Error Logs", href: "/superadmin/logs/errors", comingSoon: true },
    ],
    comingSoon: true,
  },
  {
    title: "Settings",
    href: "/superadmin/settings",
    icon: Settings,
    submenu: [
      { title: "Profile", href: "/superadmin/settings/profile" },
      { title: "Platform Branding", href: "/superadmin/settings/branding", comingSoon: true },
      { title: "System Configuration", href: "/superadmin/settings/system", comingSoon: true },
    ],
  },
]

export function SuperAdminSidebar({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const isSubmenuActive = (item: NavItem) => {
    return item.submenu?.some((subItem) => isActive(subItem.href)) || false
  }

  // Desktop sidebar
  const Sidebar = () => (
    <div className="hidden h-full w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/superadmin" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">SparrowX Admin</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <div key={item.title} className="mb-1">
              {item.submenu ? (
                <Button
                  variant={isSubmenuActive(item) ? "secondary" : "ghost"}
                  className={cn("mb-1 w-full justify-start", isSubmenuActive(item) && "bg-secondary font-medium")}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    toggleSubmenu(item.title);
                  }}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.title}
                  {item.comingSoon && (
                    <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                      Soon
                    </Badge>
                  )}
                  <ChevronDown
                    className={cn("ml-auto h-4 w-4 transition-transform", openSubmenu === item.title && "rotate-180")}
                  />
                </Button>
              ) : (
                <Link href={item.href} onClick={(e: React.MouseEvent) => {
                  if (item.submenu) {
                    e.preventDefault();
                    toggleSubmenu(item.title);
                  } else {
                    setOpen(false);
                  }
                }}>
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className={cn("mb-1 w-full justify-start", isActive(item.href) && "bg-secondary font-medium")}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.title}
                    {item.comingSoon && (
                      <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                        Soon
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}
              
              {(openSubmenu === item.title || isSubmenuActive(item)) && item.submenu && (
                <div className="ml-4 grid gap-1 pl-4">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                        isActive(subItem.href) && "bg-muted font-medium",
                      )}
                    >
                      {subItem.title}
                      {subItem.comingSoon && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-amber-100 text-amber-800 border-amber-200 text-[10px]"
                        >
                          Soon
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
              <Separator className="my-2" />
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )

  // Mobile sidebar (Sheet component)
  const MobileSidebar = () => (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/superadmin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="text-xl font-bold text-primary">SparrowX Admin</span>
          </Link>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)] py-4">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => (
              <div key={item.title} className="mb-1">
                {item.submenu ? (
                  <Button
                    variant={isSubmenuActive(item) ? "secondary" : "ghost"}
                    className={cn("mb-1 w-full justify-start", isSubmenuActive(item) && "bg-secondary font-medium")}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      toggleSubmenu(item.title);
                    }}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.title}
                    {item.comingSoon && (
                      <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                        Soon
                      </Badge>
                    )}
                    <ChevronDown
                      className={cn("ml-auto h-4 w-4 transition-transform", openSubmenu === item.title && "rotate-180")}
                    />
                  </Button>
                ) : (
                  <Link href={item.href} onClick={(e: React.MouseEvent) => {
                    if (item.submenu) {
                      e.preventDefault();
                      toggleSubmenu(item.title);
                    } else {
                      setOpen(false);
                    }
                  }}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className={cn("mb-1 w-full justify-start", isActive(item.href) && "bg-secondary font-medium")}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.title}
                      {item.comingSoon && (
                        <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                          Soon
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )}
                
                {(openSubmenu === item.title || isSubmenuActive(item)) && item.submenu && (
                  <div className="ml-4 grid gap-1 pl-4">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                          isActive(subItem.href) && "bg-muted font-medium",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {subItem.title}
                        {subItem.comingSoon && (
                          <Badge
                            variant="outline"
                            className="ml-2 bg-amber-100 text-amber-800 border-amber-200 text-[10px]"
                          >
                            Soon
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
                <Separator className="my-2" />
              </div>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {/* Only render MobileSidebar on mobile, Sidebar on desktop */}
      <div className="lg:hidden">
        <MobileSidebar />
      </div>
      <Sidebar />
    </>
  )
}
