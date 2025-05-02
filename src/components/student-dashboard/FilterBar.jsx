"use client"

import { useState, useEffect, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
} from "@/components/ui/select"
import { 
  SearchIcon, 
  FilterIcon,
  Users2Icon,
  StarIcon,
  MapPinIcon,
  Navigation,
  Loader2,
  X,
  CheckIcon,
  User
} from "lucide-react"
import { toast } from "sonner"
import { getCurrentPosition, getAddressFromCoordinates } from "@/lib/locationUtils"
import { Badge } from "@/components/ui/badge"

export function FilterBar({ onFiltersChange }) {
  const [location, setLocation] = useState("")
  const [userLocation, setUserLocation] = useState(null)
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [radius, setRadius] = useState(5) // Default radius in kilometers
  const [maxPrice, setMaxPrice] = useState(500) // Single price value (not a range)
  const [sharing, setSharing] = useState(false)
  const [gender, setGender] = useState("ANY")
  const [religion, setReligion] = useState("ANY")
  const [minRating, setMinRating] = useState("0")
  
  // Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef(null)

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Get location suggestions
  useEffect(() => {
    const getLocationSuggestions = async () => {
      if (!location || location.length < 3 || usingCurrentLocation) {
        setLocationSuggestions([])
        return
      }
      
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=5`
        )
        
        if (!response.ok) throw new Error("Failed to get suggestions")
        
        const data = await response.json()
        setLocationSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch (error) {
        console.error("Error getting location suggestions:", error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }
    
    const timer = setTimeout(getLocationSuggestions, 400)
    return () => clearTimeout(timer)
  }, [location, usingCurrentLocation])

  // Get user's location when component mounts
  useEffect(() => {
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.")
      return
    }

    // Get current position if user has enabled "use my location"
    if (usingCurrentLocation && !userLocation) {
      getCurrentLocation()
    }
  }, [usingCurrentLocation, userLocation])

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    try {
      const position = await getCurrentPosition()
      setUserLocation(position)
      
      // Try to get the address from coordinates
      try {
        const address = await getAddressFromCoordinates(position.lat, position.lng)
        setLocation(address)
      } catch (addressError) {
        console.error("Error getting address:", addressError)
        setLocation(`Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`)
      }
    } catch (error) {
      console.error("Error getting location:", error)
      toast.error(error.message || "Could not get your location")
      setUsingCurrentLocation(false)
    } finally {
      setIsGettingLocation(false)
    }
  }
  
  // Handle selecting a location suggestion
  const handleSelectSuggestion = (suggestion) => {
    setLocation(suggestion.display_name)
    setLocationSuggestions([])
    setShowSuggestions(false)
  }

  const toggleLocationUsage = () => {
    const newValue = !usingCurrentLocation
    setUsingCurrentLocation(newValue)
    
    if (!newValue) {
      // Clear location data when turning off
      setUserLocation(null)
      setLocation("")
    }
  }

  // Fixed search form submission
  const handleSearch = (e) => {
    e.preventDefault() // Prevent page refresh
    handleApplyFilters()
  }

  const formatPrice = (value) => `$${value.toLocaleString()}`

  const handleApplyFilters = () => {
    onFiltersChange({
      location: location || undefined,
      maxPrice: maxPrice || undefined, // Only send maxPrice
      sharing: sharing || undefined,
      gender: gender !== "ANY" ? gender : undefined,
      religion: religion !== "ANY" ? religion : undefined,
      minRating: minRating !== "0" ? parseFloat(minRating) : undefined,
      // Include location coordinates and radius if using current location
      ...(usingCurrentLocation && userLocation && {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: radius
      })
    })
  }

  return (
    <div className="bg-white/50 backdrop-blur-lg border rounded-xl p-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Location Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <div className="relative" ref={suggestionsRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder={usingCurrentLocation ? "Using your location" : "Search city or area"} 
                  className="pl-9 bg-white"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => !usingCurrentLocation && location.length >= 3 && setShowSuggestions(true)}
                  disabled={usingCurrentLocation}
                />
                {location && !usingCurrentLocation && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setLocation("")}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <button type="submit" className="sr-only">Search</button>
            </form>
            
            {/* Location suggestions dropdown */}
            {showSuggestions && !usingCurrentLocation && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border max-h-60 overflow-auto">
                {isLoadingSuggestions ? (
                  <div className="p-2 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : locationSuggestions.length > 0 ? (
                  <ul>
                    {locationSuggestions.map((suggestion, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-start gap-2"
                          onClick={() => handleSelectSuggestion(suggestion)}
                        >
                          <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm line-clamp-2">{suggestion.display_name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No locations found
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch 
                checked={usingCurrentLocation}
                onCheckedChange={toggleLocationUsage}
                disabled={isGettingLocation}
              />
              <span className="text-xs text-gray-600">Use my location</span>
            </div>
            
            {isGettingLocation && (
              <div className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
                <span className="text-xs text-sky-500">Getting location...</span>
              </div>
            )}
          </div>
          
          {usingCurrentLocation && userLocation && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Search Radius</label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[radius]}
                  onValueChange={(values) => setRadius(values[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-medium w-12 text-right">{radius} km</span>
              </div>
            </div>
          )}
        </div>

        {/* Price Range - Now a single slider */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Maximum Price</label>
          <div className="pt-2">
            <Slider
              value={[maxPrice]}
              min={0}
              max={1000}
              step={50}
              onValueChange={(value) => setMaxPrice(value[0])}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>$0</span>
              <span>{formatPrice(maxPrice)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Show properties up to {formatPrice(maxPrice)}
            </p>
          </div>
        </div>

        {/* Gender Preference */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Gender Preference</label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Gender</SelectItem>
              <SelectItem value="MALE">Male Only</SelectItem>
              <SelectItem value="FEMALE">Female Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Religion Preference */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Religion Preference</label>
          <Select value={religion} onValueChange={setReligion}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select religion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any Religion</SelectItem>
              <SelectItem value="CHRISTIAN">Christian</SelectItem>
              <SelectItem value="MUSLIM">Muslim</SelectItem>
              <SelectItem value="HINDU">Hindu</SelectItem>
              <SelectItem value="BUDDHIST">Buddhist</SelectItem>
              <SelectItem value="JEWISH">Jewish</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Rating Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Minimum Rating</label>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select minimum rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
              <SelectItem value="3.5">3.5+ Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sharing Switch */}
      <div className="flex items-center justify-between mt-6 pb-6 border-b">
        <div className="flex items-center gap-2">
          <Users2Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Show Shared Accommodations</span>
        </div>
        <Switch 
          checked={sharing}
          onCheckedChange={setSharing}
        />
      </div>

      <div className="flex items-center justify-between mt-6">
        {/* Applied filters */}
        <div className="flex flex-wrap gap-2">
          {maxPrice < 1000 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span>Max ${maxPrice}</span>
              <button 
                className="ml-1" 
                onClick={() => setMaxPrice(1000)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {gender !== "ANY" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span>{gender}</span>
              <button 
                className="ml-1" 
                onClick={() => setGender("ANY")}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {religion !== "ANY" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span>{religion}</span>
              <button 
                className="ml-1" 
                onClick={() => setReligion("ANY")}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        <Button 
          className="bg-sky-500 hover:bg-sky-600"
          onClick={handleApplyFilters}
        >
          <FilterIcon className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}