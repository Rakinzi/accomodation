"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { PropertyCard } from "./PropertyCard"
import { PropertySkeleton } from "./PropertySkeleton"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/useDebounce"
import { MapPin } from "lucide-react"

export function PropertyGrid({ filters = {} }) {
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState([])
  const prevFilters = useRef(filters)
  const debouncedFilters = useDebounce(filters, 500)

  const fetchProperties = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      const currentFilters = debouncedFilters
      
      // Apply server-side filters, including location coordinates if available
      Object.entries(currentFilters).forEach(([key, value]) => {
        // Skip text-based location as we're now using coordinates
        if (key !== 'location' && value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
      
      // Only set loading if filters have changed
      if (JSON.stringify(prevFilters.current) !== JSON.stringify(currentFilters)) {
        setLoading(true)
      }
      
      const response = await fetch(`/api/properties?${params}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch properties')
      
      // Client-side text-based location filtering
      let filteredData = Array.isArray(data) ? data : []
      
      if (currentFilters.location && typeof currentFilters.location === 'string' && !currentFilters.lat) {
        // Only apply text-based filtering if we're not using coordinates
        const searchTerm = currentFilters.location.toLowerCase()
        filteredData = filteredData.filter(property =>
          property.location.toLowerCase().includes(searchTerm)
        )
      }
      
      setProperties(filteredData)
      prevFilters.current = currentFilters
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error(error.message || "Failed to load properties")
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [debouncedFilters])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  useEffect(() => {
    const timer = setInterval(() => {
      fetchProperties()
    }, 60000)
    return () => clearInterval(timer)
  }, [fetchProperties])

  // Prevent layout shift
  const gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 min-h-[400px]"
  
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-grid-zinc-900/10 -z-10 bg-[size:20px_20px]" />
      
      {/* Show location being used if using coordinates */}
      {filters.lat && filters.lng && (
        <div className="flex items-center justify-center gap-2 py-2 bg-sky-50 text-sky-700 rounded-lg mb-4">
          <MapPin className="h-4 w-4" />
          <p className="text-sm">
            Showing properties within {filters.radius || 5}km of your location
          </p>
        </div>
      )}
      
      <div className={gridClassName}>
        {loading
          ? Array(6).fill().map((_, i) => <PropertySkeleton key={i} />)
          : properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={{
                ...property,
                amenities: typeof property.amenities === 'string' 
                  ? JSON.parse(property.amenities) 
                  : property.amenities,
                // Ensure media is properly formatted for the card
                media: property.media || []
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