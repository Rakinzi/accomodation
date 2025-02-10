"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { LandlordDashboard } from "@/components/dashboard/LandlordDashboard"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/login')
    },
  })

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (session?.user?.userType !== 'LANDLORD') {
    redirect('/student-dashboard')
  }

  return <LandlordDashboard />
}