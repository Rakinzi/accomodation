"use client"

import { PropertyDetails } from "@/components/student-dashboard/property/PropertyDetails"
import { use } from "react"

export default function PropertyPage({ params }) {
  const resolvedParams = use(params)
  return <PropertyDetails id={resolvedParams.id} />
}