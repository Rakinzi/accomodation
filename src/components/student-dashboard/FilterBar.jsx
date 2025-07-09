// Modern FilterBar.jsx with fixed z-index
"use client"

import { useState, useEffect, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
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
  DollarSign,
  User,
  Heart,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"
import { getCurrentPosition, getAddressFromCoordinates } from "@/lib/locationUtils"
import { Badge } from "@/components/ui/badge"

export function FilterBar({ onFiltersChange }) {
  const [location, setLocation] = useState("")
  const [userLocation, setUserLocation] = useState(null)
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [radius, setRadius] = useState(5)
  const [maxPrice, setMaxPrice] = useState(500)
  const [sharing, setSharing] = useState(false)
  const [gender, setGender] = useState("ANY")
  const [religion, setReligion] = useState("ANY")
  const [minRating, setMinRating] = useState("0")
  const [isExpanded, setIsExpanded] = useState(false)
  
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
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.")
      return
    }

    if (usingCurrentLocation && !userLocation) {
      getCurrentLocation()
    }
  }, [usingCurrentLocation, userLocation])

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    try {
      const position = await getCurrentPosition()
      setUserLocation(position)
      
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
  
  const handleSelectSuggestion = (suggestion) => {
    setLocation(suggestion.display_name)
    setLocationSuggestions([])
    setShowSuggestions(false)
  }

  const toggleLocationUsage = () => {
    const newValue = !usingCurrentLocation
    setUsingCurrentLocation(newValue)
    
    if (!newValue) {
      setUserLocation(null)
      setLocation("")
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    handleApplyFilters()
  }

  const formatPrice = (value) => `$${value.toLocaleString()}`

  const handleApplyFilters = () => {
    onFiltersChange({
      location: location || undefined,
      maxPrice: maxPrice || undefined,
      sharing: sharing || undefined,
      gender: gender !== "ANY" ? gender : undefined,
      religion: religion !== "ANY" ? religion : undefined,
      minRating: minRating !== "0" ? minRating : undefined,
      ...(usingCurrentLocation && userLocation && {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: radius
      })
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (maxPrice < 1000) count++
    if (gender !== "ANY") count++
    if (religion !== "ANY") count++
    if (minRating !== "0") count++
    if (sharing) count++
    return count
  }

  const clearAllFilters = () => {
    setMaxPrice(1000)
    setGender("ANY")
    setReligion("ANY")
    setMinRating("0")
    setSharing(false)
    setLocation("")
    setUserLocation(null)
    setUsingCurrentLocation(false)
  }

  return (
    <div className="w-full relative z-50">
      {/* Modern Always-Visible Search Bar */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden relative z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-50/50 via-white to-blue-50/50"></div>
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-4">
            {/* Enhanced Search Input */}
            <div className="flex-1 relative z-50">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl blur opacity-75"></div>
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <SearchIcon className="w-5 h-5 text-sky-600" />
                    <div className="w-px h-5 bg-gray-300"></div>
                  </div>
                  <Input
                    type="text"
                    placeholder="Search location or area..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-16 pr-12 h-12 bg-white/90 backdrop-blur-sm border-2 border-sky-200 focus:border-sky-500 focus:ring-sky-500/20 rounded-xl text-gray-900 placeholder-gray-500 font-medium shadow-inner"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleLocationUsage}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full transition-all duration-200 ${
                      usingCurrentLocation 
                        ? 'text-sky-600 bg-sky-100 hover:bg-sky-200' 
                        : 'text-gray-400 hover:text-sky-600 hover:bg-sky-50'
                    }`}
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>

              {/* Enhanced Location Suggestions - Fixed z-index */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef} 
                  className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-sky-200 rounded-xl shadow-2xl z-[9999] max-h-60 overflow-auto"
                  style={{ zIndex: 9999 }}
                >
                  <div className="p-2">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-center gap-3 rounded-lg transition-all duration-200 hover:shadow-sm group"
                      >
                        <div className="bg-sky-100 p-2 rounded-full group-hover:bg-sky-200 transition-colors">
                          <MapPinIcon className="h-4 w-4 text-sky-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800 group-hover:text-sky-800 line-clamp-1">
                            {suggestion.display_name.split(',')[0]}
                          </span>
                          <span className="text-xs text-gray-500 line-clamp-1">
                            {suggestion.display_name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Quick Display */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="bg-emerald-100 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-center">
                <div className="text-xs text-emerald-600 font-medium">Max Price</div>
                <div className="text-sm font-bold text-emerald-800">
                  ${maxPrice}
                </div>
              </div>
            </div>

            {/* Modern Expand/Collapse Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-3 h-12 px-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 hover:from-purple-100 hover:to-indigo-100 hover:border-purple-300 transition-all duration-200 rounded-xl"
            >
              <div className="bg-purple-100 p-1.5 rounded-full">
                <FilterIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-purple-600 font-medium">Filters</div>
                <div className="text-sm font-bold text-purple-800">
                  {getActiveFiltersCount() > 0 ? `${getActiveFiltersCount()} Active` : 'Advanced'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs bg-purple-200 text-purple-800 border-0">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                )}
              </div>
            </Button>

            {/* Enhanced Search/Apply Button */}
            <Button 
              onClick={handleApplyFilters}
              className="h-12 px-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
            >
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Expandable Filters Section */}
      {isExpanded && (
        <Card className="mt-4 bg-white/95 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white to-purple-50/30"></div>
          <CardContent className="p-6 relative">
            {/* Radius Slider - Enhanced */}
            {usingCurrentLocation && userLocation && (
              <div className="mb-6 p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-xl border-2 border-sky-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-sky-100 p-2 rounded-full">
                    <MapPinIcon className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-sky-800">Search Radius</label>
                    <p className="text-xs text-sky-600">Distance from your location</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-sky-700">{radius}</span>
                    <span className="text-sm text-sky-600 ml-1">km</span>
                  </div>
                </div>
                <Slider
                  value={[radius]}
                  onValueChange={(values) => setRadius(values[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-sky-600 mt-2">
                  <span>1 km</span>
                  <span>50 km</span>
                </div>
              </div>
            )}

            {/* Enhanced Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Price Filter */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-emerald-100 p-1.5 rounded-full">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-emerald-800">Max Price</label>
                    <p className="text-xs text-emerald-600">Monthly budget</p>
                  </div>
                </div>
                <Slider
                  value={[maxPrice]}
                  min={0}
                  max={1000}
                  step={50}
                  onValueChange={(value) => setMaxPrice(value[0])}
                  className="w-full mb-2"
                />
                <div className="text-center">
                  <span className="text-lg font-bold text-emerald-700">
                    {formatPrice(maxPrice)}
                  </span>
                </div>
              </div>

              {/* Gender Filter */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-100 p-1.5 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-800">Gender</label>
                    <p className="text-xs text-blue-600">Preference</p>
                  </div>
                </div>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="h-10 bg-white/80 border-blue-200 focus:ring-blue-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANY">Any Gender</SelectItem>
                    <SelectItem value="MALE">Male Only</SelectItem>
                    <SelectItem value="FEMALE">Female Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Religion Filter */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-100 p-1.5 rounded-full">
                    <Heart className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-purple-800">Religion</label>
                    <p className="text-xs text-purple-600">Preference</p>
                  </div>
                </div>
                <Select value={religion} onValueChange={setReligion}>
                  <SelectTrigger className="h-10 bg-white/80 border-purple-200 focus:ring-purple-500/20">
                    <SelectValue />
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

              {/* Rating Filter */}
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-yellow-100 p-1.5 rounded-full">
                    <StarIcon className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-yellow-800">Min Rating</label>
                    <p className="text-xs text-yellow-600">Quality filter</p>
                  </div>
                </div>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="h-10 bg-white/80 border-yellow-200 focus:ring-yellow-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enhanced Sharing Toggle */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Users2Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-indigo-800">Shared Accommodations</span>
                    <p className="text-xs text-indigo-600">Show properties with roommates</p>
                  </div>
                </div>
                <Switch 
                  checked={sharing}
                  onCheckedChange={setSharing}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
            </div>

            {/* Enhanced Active Filters */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {maxPrice < 1000 && (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 flex items-center gap-1 px-3 py-1">
                    <DollarSign className="h-3 w-3" />
                    <span>Max ${maxPrice}</span>
                    <button 
                      onClick={() => setMaxPrice(1000)}
                      className="ml-1 hover:bg-emerald-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {gender !== "ANY" && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 flex items-center gap-1 px-3 py-1">
                    <User className="h-3 w-3" />
                    <span>{gender}</span>
                    <button 
                      onClick={() => setGender("ANY")}
                      className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {religion !== "ANY" && (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 flex items-center gap-1 px-3 py-1">
                    <Heart className="h-3 w-3" />
                    <span>{religion}</span>
                    <button 
                      onClick={() => setReligion("ANY")}
                      className="ml-1 hover:bg-purple-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {minRating !== "0" && (
                  <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0 flex items-center gap-1 px-3 py-1">
                    <StarIcon className="h-3 w-3" />
                    <span>{minRating}+ Stars</span>
                    <button 
                      onClick={() => setMinRating("0")}
                      className="ml-1 hover:bg-yellow-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {sharing && (
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0 flex items-center gap-1 px-3 py-1">
                    <Users2Icon className="h-3 w-3" />
                    <span>Shared</span>
                    <button 
                      onClick={() => setSharing(false)}
                      className="ml-1 hover:bg-indigo-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>

              {/* Clear All Button */}
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-300 hover:border-red-300 transition-all duration-200"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}