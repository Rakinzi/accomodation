"use client"

import { FilterBar } from "@/components/ui/student-dashboard/FilterBar"
import { PropertyGrid } from "@/components/ui/student-dashboard/PropertyGrid"


export default function StudentDashboard() {

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