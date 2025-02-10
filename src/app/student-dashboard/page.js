"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { FilterBar } from "@/components/student-dashboard/FilterBar"
import { PropertyGrid } from "@/components/student-dashboard/PropertyGrid"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { useState } from "react"

export default function StudentDashboard() {
  const [filters, setFilters] = useState({})
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
      <FilterBar onFiltersChange={setFilters} />
      <PropertyGrid filters={filters} />
    </div>
  )
}