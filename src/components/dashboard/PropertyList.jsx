import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  EditIcon,
  TrashIcon,
  EyeIcon,
  BedSingleIcon,
  ShowerHead,
  MapPinIcon,
  Loader2
} from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { PropertyCard } from "./PropertyCard"

export function PropertyList() {
  const { data: session } = useSession()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProperties = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/properties?ownerId=${session.user.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }
      
      const data = await response.json()
      setProperties(data)
      setError(null)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      setError('Failed to load properties. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleDelete = async (propertyId) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete property')
      }

      setProperties(prev => prev.filter(p => p.id !== propertyId))
    } catch (error) {
      console.error('Failed to delete property:', error)
      setError('Failed to delete property. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>{error}</p>
        <Button 
          onClick={fetchProperties}
          variant="outline"
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    )
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
          onRefresh={fetchProperties}
        />
      ))}
    </div>
  )
}