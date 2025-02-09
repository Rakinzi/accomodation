"use client"

import { PropertyDetails } from "@/components/ui/student-dashboard/property/PropertyDetails"
import { use } from "react"

export default function PropertyPage({ params }) {
  const resolvedParams = use(params)
  return <PropertyDetails id={resolvedParams.id} />
}