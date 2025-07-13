"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Box, ChevronDown, CreditCard, FileText, Home, Menu, Package, PlusCircle, User, X, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useCompanyAssets } from "@/hooks/useCompanyAssets"
import { useAuth } from "@/hooks/useAuth"

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
    title: "Dashboard",
    href: "/customer",
    icon: Home,
  },
  {
    title: "Packages",
    href: "/customer/packages",
    icon: Package,
    submenu: [
      { title: "All Packages", href: "/customer/packages" },
    ],
  },
  {
    title: "Pre-Alerts",
    href: "/customer/prealerts",
    icon: PlusCircle,
    submenu: [
      { title: "All Pre-Alerts", href: "/customer/prealerts" },
      { title: "Create Pre-Alert", href: "/customer/prealerts/new" },
    ],
  },
  {
    title: "Invoices",
    href: "/customer/invoices",
    icon: FileText,
    submenu: [
      { title: "All Invoices", href: "/customer/invoices" },
      { title: "Payment History", href: "/customer/payments" },
    ],
  },
  {
    title: "Profile",
    href: "/customer/profile",
    icon: User,
  },
]

export function CustomerSidebar({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const { getAssetByType } = useCompanyAssets()
  const companyBanner = getAssetByType("banner")
  const companyLogo = getAssetByType("logo")
  const { logout } = useAuth();

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
        <Link href="/customer" className="flex items-center gap-2">
          {companyBanner?.imageData ? (
            <img 
              src={companyBanner.imageData} 
              alt="Company Banner" 
              className="h-16 w-full object-cover" 
            />
          ) : companyLogo?.imageData ? (
            <img 
              src={companyLogo.imageData} 
              alt="Company Logo" 
              className="h-8 max-w-[160px] object-contain" 
            />
          ) : (
            <span className="text-xl font-bold">SparrowX</span>
          )}
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
      <div className="p-4 border-t flex flex-col">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
          onClick={async () => {
            await logout();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  // Mobile sidebar (Sheet component)
  const MobileSidebar = () => (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/customer" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            {companyBanner?.imageData ? (
              <img 
                src={companyBanner.imageData} 
                alt="Company Banner" 
                className="h-16 w-full object-cover" 
              />
            ) : companyLogo?.imageData ? (
              <img 
                src={companyLogo.imageData} 
                alt="Company Logo" 
                className="h-8 max-w-[160px] object-contain" 
              />
            ) : (
              <span className="text-xl font-bold">SparrowX</span>
            )}
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
        <div className="p-4 border-t flex flex-col">
          <Button
            variant="destructive"
            className="w-full flex items-center justify-center gap-2"
            onClick={async () => {
              await logout();
              setOpen(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
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