"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { PropertyCard } from "./PropertyCard"
import { PropertySkeleton } from "./PropertySkeleton"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/useDebounce"

export function PropertyGrid({ filters = {} }) {
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState([])
  const prevFilters = useRef(filters)
  const debouncedFilters = useDebounce(filters, 500)

  const fetchProperties = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(debouncedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      // Only set loading if filters have changed
      if (JSON.stringify(prevFilters.current) !== JSON.stringify(debouncedFilters)) {
        setLoading(true)
      }

      const response = await fetch(`/api/properties?${params}`, {
        // Add cache headers
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch properties')
      
      const data = await response.json()
      setProperties(data)
      prevFilters.current = debouncedFilters
    } catch (error) {
      console.error('Error:', error)
      toast.error("Failed to load properties")
    } finally {
      setLoading(false)
    }
  }, [debouncedFilters])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // Prevent layout shift
  const gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 min-h-[400px]"

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-grid-zinc-900/10 -z-10 bg-[size:20px_20px]" />
      <div className={gridClassName}>
        {loading 
          ? Array(6).fill().map((_, i) => <PropertySkeleton key={i} />)
          : properties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={{
                  ...property,
                  amenities: JSON.parse(property.amenities)
                }} 
              />
            ))
        }
        {!loading && properties.length === 0 && (
          <div className="col-span-full text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No properties found</h3>
            <p className="text-zinc-500">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}