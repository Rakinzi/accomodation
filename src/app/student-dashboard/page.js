"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { FilterBar } from "@/components/student-dashboard/FilterBar"
import { PropertyGrid } from "@/components/student-dashboard/PropertyGrid"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"

export default function StudentDashboard() {

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/login')
    },
  })

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (session?.user?.userType !== 'STUDENT') {
    redirect('/dashboard')
  }


  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-sky-900 dark:text-sky-100">
        Find Your Perfect Home
      </h1>

      <FilterBar />
      <PropertyGrid />
    </div>
  )
}