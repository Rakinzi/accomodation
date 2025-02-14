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
  BookmarkIcon,
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
    { href: "/student-dashboard/room", icon: BookmarkIcon, label: "Room" },
    { href: "/student-dashboard/messages", icon: MessageSquare, label: "Messages" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl dark:bg-zinc-950/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/student-dashboard"
            className="text-xl font-bold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent"
          >
            StudentHousing
          </Link>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4">
                {navigationLinks.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-colors",
                      isActive(href)
                        ? "text-sky-600 dark:text-sky-400"
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
          <div className="hidden md:flex items-center space-x-1">
            {navigationLinks.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    isActive(href) && "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-950" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-auto">
                  <div className="p-4 text-sm text-zinc-500">
                    No new notifications
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full ring-2 ring-zinc-100 dark:ring-zinc-800"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user?.name || 'Loading...'}</p>
                    <p className="text-xs text-zinc-500">{session?.user?.email || 'Loading...'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
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