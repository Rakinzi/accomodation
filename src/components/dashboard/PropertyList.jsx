import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState, useEffect } from "react"
import { PropertyCard } from "./PropertyCard"
import { PropertySkeleton } from "./PropertySkeleton"

export function PropertyList({ properties, isLoading, onRefresh }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <PropertySkeleton key={index} />
        ))}
      </div>
    )
  }

  const handleDelete = async (propertyId) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete property')
      }

      // Call onRefresh to update the property list
      onRefresh()
    } catch (error) {
      console.error('Failed to delete property:', error)
    }
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500">
        <p>No properties found. Add your first property to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onDelete={() => handleDelete(property.id)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}