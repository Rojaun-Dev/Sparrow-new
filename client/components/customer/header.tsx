"use client"

import Link from "next/link"
import Image from "next/image"
import { Bell, Moon, Sun, LogOut, User, Settings, Package } from "lucide-react"
import { useTheme } from "next-themes"
import { useCurrentUser } from "@/hooks/useProfile"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function CustomerHeader({ onDrawerOpen }: { onDrawerOpen: () => void }) {
  const { setTheme } = useTheme()
  const { data: user, isLoading } = useCurrentUser()
  const router = useRouter()
  const { logout } = useAuth()
  
  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('Customer Header: Logging out');
      
      // Call the auth hook's logout function
      // This updates context state and removes tokens via the auth context
      await logout();
      
      // Also directly call the auth service for redundancy
      // This provides a fallback if the hook's logout function fails
      // or if the hook's context state isn't properly synchronized
      const { authService } = await import('@/lib/api/authService');
      await authService.logout();
      
      // Direct cookie manipulation
      // This is a belt-and-suspenders approach to ensure cookies are removed
      // even if the hook and service methods failed to remove them
      if (typeof document !== 'undefined') {
        // Force expire all possible auth cookies with various paths
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Try alternative paths
        // This handles cases where cookies might have been set with different paths
        // e.g., specific to the customer route
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/customer;';
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/customer;';
      }
      
      // Force any additional local storage cleanup
      if (typeof window !== 'undefined') {
        localStorage.clear(); // Clear everything to be thorough
        
        // Log out what's happening
        console.log('All local storage and cookies cleared');
        console.log('Hard redirecting to login page');
        
        // Use window.location.replace for a full page reload that bypasses cache
        // This is more robust than router.push() which might preserve some state
        window.location.replace('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect even if there's an error
      window.location.replace('/');
    }
  }
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U"
    
    const firstName = user.firstName || ""
    const lastName = user.lastName || ""
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Drawer button for mobile, absolutely positioned bottom-right */}
      <button
        className="fixed bottom-4 right-4 z-40 lg:hidden flex items-center justify-center rounded-md border bg-background p-2 shadow-md"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        onClick={onDrawerOpen}
        aria-label="Open menu"
        type="button"
      >
        <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <Link href="/customer" className="flex items-center gap-2">
          <Image src="/placeholder.svg?key=e5zuj" alt="SparrowX Logo" width={32} height={32} className="h-8 w-8" />
          <span className="hidden text-xl font-bold md:inline-block">SparrowX</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-8 w-8 md:h-9 md:w-9">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[280px] md:w-[350px]">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                Coming Soon
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">
              Notifications functionality will be available soon!
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 md:h-5 md:w-5" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 md:h-5 md:w-5" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full md:h-9 md:w-9">
              <Avatar className="h-8 w-8 md:h-9 md:w-9">
                <AvatarImage src="/placeholder.svg?key=user" alt={user?.firstName || 'User'} />
                <AvatarFallback>{isLoading ? "..." : getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {isLoading ? (
                  <>
                    <p className="text-sm font-medium leading-none">Loading...</p>
                    <p className="text-xs leading-none text-muted-foreground">Please wait</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/customer/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/customer/packages">
                  <Package className="mr-2 h-4 w-4" />
                  <span>My Packages</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}