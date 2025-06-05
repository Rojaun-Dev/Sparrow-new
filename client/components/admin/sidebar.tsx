"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  ChevronDown, 
  DollarSign, 
  Menu, 
  Package, 
  Settings, 
  Users, 
  X, 
  FileText, 
  Bell, 
  CreditCard,
  Home,
  User,
  LogOut
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  submenu?: {
    title: string
    href: string
    comingSoon?: boolean
    adminL2Only?: boolean
  }[]
  comingSoon?: boolean
  adminL2Only?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
    submenu: [
      { title: "All Customers", href: "/admin/customers" },
      { title: "Import Customers", href: "/admin/customers/import", comingSoon: true },
    ],
  },
  {
    title: "Packages",
    href: "/admin/packages",
    icon: Package,
    submenu: [
      { title: "All Packages", href: "/admin/packages" },
      { title: "Register Package", href: "/admin/packages/register" },
      { title: "Batch Processing", href: "/admin/packages/batch", comingSoon: true },
    ],
  },
  {
    title: "Pre-alerts",
    href: "/admin/pre-alerts",
    icon: Bell,
    submenu: [
      { title: "All Pre-alerts", href: "/admin/pre-alerts" },
      { title: "Match to Packages", href: "/admin/pre-alerts/match" },
    ],
  },
  {
    title: "Invoicing",
    href: "/admin/invoices",
    icon: FileText,
    submenu: [
      { title: "All Invoices", href: "/admin/invoices" },
      { title: "Create Invoice", href: "/admin/invoices/create" },
      { title: "Payment Historry", href: "/admin/payments", comingSoon: true },
    ],
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    submenu: [
      { title: "Package Reports", href: "#", comingSoon: true },
      { title: "Revenue Reports", href: "#", comingSoon: true },
      { title: "Customer Reports", href: "#", comingSoon: true },
      { title: "Custom Reports", href: "#", comingSoon: true },
    ],
    comingSoon: true
  },
  {
    title: "Employee Management",
    href: "/admin/employees",
    icon: Users,
    adminL2Only: true,
    submenu: [
      { title: "All Employees", href: "#", comingSoon: true },
      { title: "Invite Employee", href: "#", comingSoon: true },
    ],
  },
  {
    title: "Company Management",
    href: "/admin/settings",
    icon: Settings,
    adminL2Only: true,
    submenu: [
      { title: "General", href: "/admin/settings" },
      { title: "Branding", href: "/admin/settings/branding" },
      { title: "Fee Management", href: "/admin/settings/fees" },
    ],
  },
  {
    title: "Profile",
    href: "/admin/settings/profile",
    icon: User,
  },
]

export function AdminSidebarDesktop() {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const isAdminL2 = true
  const { logout } = useAuth()
  const toggleSubmenu = (title: string) => setOpenSubmenu(openSubmenu === title ? null : title)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const isSubmenuActive = (item: NavItem) => item.submenu?.some((subItem) => isActive(subItem.href)) || false
  const filteredNavItems = navItems.filter(item => !item.adminL2Only || isAdminL2)
  return (
    <div className="hidden h-full w-64 flex-col border-r bg-background lg:flex">
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {filteredNavItems.map((item) => (
            <div key={item.title} className="mb-1">
              {item.submenu ? (
                <>
                  <Button
                    variant={isSubmenuActive(item) ? "secondary" : "ghost"}
                    className={cn("mb-1 w-full justify-start", isSubmenuActive(item) && "bg-secondary font-medium")}
                    onClick={() => toggleSubmenu(item.title)}
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
                  {(openSubmenu === item.title || isSubmenuActive(item)) && item.submenu && (
                    <div className="ml-4 grid gap-1 pl-4">
                      {item.submenu
                        .filter(subItem => !subItem.adminL2Only || isAdminL2)
                        .map((subItem) => (
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
                </>
              ) : (
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn("mb-1 w-full justify-start", isActive(item.href) && "bg-secondary font-medium")}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.title}
                    {item.comingSoon && (
                      <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                        Soon
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}
              <Separator className="my-2" />
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t flex flex-col gap-2">
        <Button variant="destructive" onClick={logout} className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  )
}

export function AdminSidebarMobile() {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAdminL2 = true
  const { logout } = useAuth()
  const toggleSubmenu = (title: string) => setOpenSubmenu(openSubmenu === title ? null : title)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const isSubmenuActive = (item: NavItem) => item.submenu?.some((subItem) => isActive(subItem.href)) || false
  const filteredNavItems = navItems.filter(item => !item.adminL2Only || isAdminL2)
  return (
    <div className="sticky top-0 z-20 flex h-16 items-center border-b bg-background px-4 lg:hidden">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <span className="text-xl font-bold">SparrowX Admin</span>
            </Link>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)] py-4">
            <nav className="grid gap-1 px-2">
              {filteredNavItems.map((item) => (
                <div key={item.title} className="mb-1">
                  {item.submenu ? (
                    <>
                      <Button
                        variant={isSubmenuActive(item) ? "secondary" : "ghost"}
                        className={cn("mb-1 w-full justify-start", isSubmenuActive(item) && "bg-secondary font-medium")}
                        onClick={() => toggleSubmenu(item.title)}
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
                      {(openSubmenu === item.title || isSubmenuActive(item)) && item.submenu && (
                        <div className="ml-4 grid gap-1 pl-4">
                          {item.submenu
                            .filter(subItem => !subItem.adminL2Only || isAdminL2)
                            .map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                                  isActive(subItem.href) && "bg-muted font-medium",
                                )}
                                onClick={() => setSidebarOpen(false)}
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
                    </>
                  ) : (
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className={cn("mb-1 w-full justify-start", isActive(item.href) && "bg-secondary font-medium")}
                      asChild
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-5 w-5" />
                        {item.title}
                        {item.comingSoon && (
                          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                            Soon
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  )}
                  <Separator className="my-2" />
                </div>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <div className="ml-2 flex-1 text-center sm:text-left">
        <Link href="/admin" className="inline-flex items-center">
          <span className="text-xl font-bold">SparrowX Admin</span>
        </Link>
      </div>
    </div>
  )
} 