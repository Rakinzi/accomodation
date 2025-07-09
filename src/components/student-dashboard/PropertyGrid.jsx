// Enhanced PropertyGrid.jsx
"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { PropertyCard } from "./PropertyCard"
import { PropertySkeleton } from "./PropertySkeleton"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/useDebounce"
import { MapPin, Home, Search } from "lucide-react"

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

  // Enhanced skeleton component
  const EnhancedPropertySkeleton = () => (
    <Card className="overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      </div>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3 animate-pulse"></div>
        </div>
        <div className="bg-gray-100 rounded-xl p-4">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-transparent to-blue-50/30 -z-10" />
      <div className="absolute inset-0 bg-grid-zinc-900/5 -z-10 bg-[size:20px_20px]" />
      
      {/* Show location being used if using coordinates */}
      {filters.lat && filters.lng && (
        <Card className="mb-6 bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-sky-700">
              <MapPin className="h-5 w-5" />
              <p className="font-medium">
                Showing properties within {filters.radius || 5}km of your location
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
        {loading
          ? Array(6).fill().map((_, i) => <EnhancedPropertySkeleton key={i} />)
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
          <div className="col-span-full">
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-gradient-to-r from-sky-100 to-blue-100 rounded-full p-6">
                    <Search className="h-12 w-12 text-sky-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-800">No properties found</h3>
                    <p className="text-gray-600">Try adjusting your filters or search in a different location</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}