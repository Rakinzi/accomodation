"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { signOut, useSession } from "next-auth/react"
import {
  Bell,
  LogOut,
  Settings,
  User,
  Home,
  Bed,
  MessageSquare,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function StudentMainNav() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = (path) => {
    if (path === '/student-dashboard' && pathname === '/student-dashboard') {
      return true
    }
    return path !== '/student-dashboard' && pathname.startsWith(path)
  }

  const navigationLinks = [
    { href: "/student-dashboard", icon: Home, label: "Dashboard" },
    { href: "/student-dashboard/room", icon: Bed, label: "Room" },
    { href: "/student-dashboard/messages", icon: MessageSquare, label: "Messages" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/90 backdrop-blur-xl dark:bg-zinc-950/90 shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/student-dashboard"
            className="group text-xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 bg-clip-text text-transparent hover:from-sky-700 hover:via-sky-600 hover:to-sky-500 transition-all duration-300"
          >
            <span className="relative">
              StudentHousing
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-sky-600 to-sky-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </span>
          </Link>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors duration-200"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-white/95 backdrop-blur-xl dark:bg-zinc-950/95 border-l border-white/20">
              <nav className="flex flex-col gap-2 mt-8">
                {navigationLinks.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-sky-50 dark:hover:bg-sky-950/50",
                      isActive(href)
                        ? "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationLinks.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:scale-105",
                    isActive(href) 
                      ? "bg-gradient-to-r from-sky-50 to-sky-100 text-sky-600 dark:from-sky-950 dark:to-sky-900 dark:text-sky-400 shadow-sm border border-sky-200 dark:border-sky-800"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-all duration-200 hover:scale-105"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-red-400 rounded-full ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white/95 backdrop-blur-xl dark:bg-zinc-950/95 border border-white/20 shadow-xl">
                <DropdownMenuLabel className="text-base font-semibold">
                  Notifications
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-auto">
                  <div className="p-4 text-sm text-zinc-500 text-center">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                    No new notifications
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full ring-2 ring-sky-200 dark:ring-sky-800 hover:ring-sky-300 dark:hover:ring-sky-700 transition-all duration-200 hover:scale-105"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback className="bg-gradient-to-r from-sky-600 to-sky-500 text-white font-semibold">
                      {session?.user?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-xl dark:bg-zinc-950/95 border border-white/20 shadow-xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {session?.user?.name || 'Loading...'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {session?.user?.email || 'Loading...'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors duration-200">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors duration-200">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors duration-200"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
} 