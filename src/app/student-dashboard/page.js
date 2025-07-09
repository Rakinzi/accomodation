// Updated student-dashboard/page.js
"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { FilterBar } from "@/components/student-dashboard/FilterBar"
import { PropertyGrid } from "@/components/student-dashboard/PropertyGrid"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { useEffect, useState } from "react"

export default function StudentDashboard() {
  const [filters, setFilters] = useState({})
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/login')
    },
  })

  useEffect(()=> {
    document.title = "Dashboard | Student Accommodation"
  })

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (session?.user?.userType !== 'STUDENT') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="container mx-auto px-4 py-4">
        <div className="space-y-6">
          <FilterBar onFiltersChange={setFilters} />
          <PropertyGrid filters={filters} />
        </div>
      </div>
    </div>
  )
}