"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { LandlordDashboard } from "@/components/ui/dashboard/LandlordDashboard"

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/login')
    },
  })

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (session?.user?.userType !== 'LANDLORD') {
    redirect('/student-dashboard')
  }

  return <LandlordDashboard />
}