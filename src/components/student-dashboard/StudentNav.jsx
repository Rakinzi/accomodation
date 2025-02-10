"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  BookmarkIcon,
  MessageSquareIcon,
  BellIcon,
  UserIcon,
  LogOutIcon
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"

export function StudentMainNav() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({
        callbackUrl: "/",
        redirect: true
      })
    } catch (error) {
      toast.error("Failed to sign out")
      setIsSigningOut(false)
    }
  }

  return (
    <nav className="flex items-center justify-between h-20 px-4">
      {/* Logo and Primary Navigation */}
      <div className="flex items-center gap-8">
        <Link href="/student-dashboard" className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent">
          StudentHousing
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/student-dashboard/saved"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors"
          >
            <BookmarkIcon className="w-4 h-4" />
            Saved
          </Link>
          <Link
            href="/student-dashboard/messages"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors"
          >
            <MessageSquareIcon className="w-4 h-4" />
            Messages
          </Link>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-sky-500 rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback>US</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-gray-500">student@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}