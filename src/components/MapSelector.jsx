"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function MapSelector({ 
  value = { lat: 0, lng: 0, address: '' }, 
  onChange,
  required = false,
  label = "Location"
}) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const mapRef = useRef(null)

  // Load Leaflet library dynamically as it requires access to the window object
  useEffect(() => {
    // Skip if already loaded
    if (typeof window !== 'undefined' && window.L) {
      setMapLoaded(true)
      return
    }

    // Load Leaflet CSS
    const linkEl = document.createElement('link')
    linkEl.rel = 'stylesheet'
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(linkEl)

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setMapLoaded(true)
    document.head.appendChild(script)

    return () => {
      // Cleanup is optional here, as these resources might be reused by other components
    }
  }, [])

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map) return

    // Default to a central position if no coordinates are provided
    const initialPosition = [
      value.lat || 0, 
      value.lng || 0
    ]
    
    // Check if we have valid coordinates (not 0,0)
    const hasValidCoordinates = value.lat !== 0 || value.lng !== 0
    
    // Initialize map
    const mapInstance = window.L.map(mapRef.current).setView(
      hasValidCoordinates ? initialPosition : [0, 0], 
      hasValidCoordinates ? 13 : 2
    )
    
    // Add OpenStreetMap tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance)

    // Add click event to set marker
    mapInstance.on('click', handleMapClick)
    
    // If we have initial coordinates, add a marker
    let initialMarker = null
    if (hasValidCoordinates) {
      initialMarker = window.L.marker(initialPosition).addTo(mapInstance)
      if (value.address) {
        initialMarker.bindPopup(value.address).openPopup()
      }
    }
    
    setMap(mapInstance)
    setMarker(initialMarker)
    
    // Cleanup on unmount
    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [mapLoaded, map, value.lat, value.lng, value.address])

  // Handle map click to set marker
  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng
    
    // Update the marker
    if (marker) {
      marker.setLatLng([lat, lng])
    } else if (map) {
      const newMarker = window.L.marker([lat, lng]).addTo(map)
      setMarker(newMarker)
    }
    
    try {
      // Reverse geocoding to get address
      const address = await getAddressFromCoordinates(lat, lng)
      
      // Update parent component
      onChange({
        lat: lat,
        lng: lng,
        address: address
      })
      
      // Update marker popup with address
      if (marker) {
        marker.bindPopup(address).openPopup()
      }
    } catch (error) {
      console.error("Error getting address:", error)
      toast.error("Could not retrieve address information")
      
      // Still update coordinates even if address lookup fails
      onChange({
        lat: lat,
        lng: lng,
        address: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
      })
    }
  }

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }
    
    setIsLoadingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // Center map on user location
        if (map) {
          map.setView([latitude, longitude], 15)
        }
        
        // Update marker
        if (marker) {
          marker.setLatLng([latitude, longitude])
        } else if (map) {
          const newMarker = window.L.marker([latitude, longitude]).addTo(map)
          setMarker(newMarker)
        }
        
        try {
          // Get address
          const address = await getAddressFromCoordinates(latitude, longitude)
          
          // Update parent component
          onChange({
            lat: latitude,
            lng: longitude,
            address: address
          })
          
          // Update marker popup
          if (marker) {
            marker.bindPopup(address).openPopup()
          }
        } catch (error) {
          console.error("Error getting address:", error)
          toast.error("Could not retrieve address information")
          
          // Still update with coordinates
          onChange({
            lat: latitude,
            lng: longitude,
            address: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`
          })
        }
        
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        setIsLoadingLocation(false)
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission was denied")
            break
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information is unavailable")
            break
          case error.TIMEOUT:
            toast.error("Location request timed out")
            break
          default:
            toast.error("An unknown error occurred")
        }
      }
    )
  }

  // Search for location by name
  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    try {
      // Use Nominatim API for geocoding (OpenStreetMap's geocoding service)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.length === 0) {
        toast.error("No locations found. Try a different search term.")
        setIsSearching(false)
        return
      }
      
      // Use the first result
      const result = data[0]
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)
      const address = result.display_name
      
      // Center map on result
      if (map) {
        map.setView([lat, lng], 15)
      }
      
      // Update marker
      if (marker) {
        marker.setLatLng([lat, lng])
      } else if (map) {
        const newMarker = window.L.marker([lat, lng]).addTo(map)
        setMarker(newMarker)
      }
      
      // Update parent component
      onChange({
        lat: lat,
        lng: lng,
        address: address
      })
      
      // Update marker popup
      if (marker) {
        marker.bindPopup(address).openPopup()
      }
    } catch (error) {
      console.error("Error searching location:", error)
      toast.error("Error searching for location")
    } finally {
      setIsSearching(false)
    }
  }

  // Reverse geocoding: Get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      return data.display_name
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      throw error
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
        
        {/* Search box */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location..."
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            title="Use my location"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Selected location display */}
        {value.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <MapPin className="h-4 w-4 text-sky-500" />
            <span className="truncate">{value.address}</span>
          </div>
        )}
      </div>
      
      {/* Map container */}
      <div className="relative border rounded-lg overflow-hidden" style={{ height: '400px' }}>
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </div>
      
      {/* Instructions */}
      <p className="text-xs text-gray-500">
        Click on the map to select a location, use the search box to find an address, 
        or use the location button to use your current location.
      </p>
    </div>
  )
}