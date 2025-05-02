"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { PropertyList } from "./PropertyList"
import { 
  PlusIcon, 
  UserCircle, 
  LayoutGrid
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Command, CommandEmpty, CommandInput, CommandList, CommandItem } from "./Command"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, Search, Loader2, MapPin } from "lucide-react"
import { LoadingSpinner } from "./LoadingSpinner"
import { toast } from "sonner"
import { MediaUpload } from "../MediaUpload"

// Form validation schema
const formSchema = z.object({
  price: z.string().min(1, "Price is required"),
  deposit: z.string().min(1, "Deposit amount is required"),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().min(1, "Address is required")
  }).refine(data => data.lat !== 0 || data.lng !== 0, {
    message: "Please select a location on the map",
    path: ["address"]
  }),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amenities: z.array(z.string()).min(1, "At least one amenity is required"),
  roomSharing: z.boolean().default(false),
  tenantsPerRoom: z.string().min(1, "Number of tenants per room is required"),
  gender: z.enum(["MALE", "FEMALE", "ANY", "BOTH"]).default("ANY"),
  religion: z.enum(["CHRISTIAN", "MUSLIM", "HINDU", "BUDDHIST", "JEWISH", "ANY", "OTHER"]).default("ANY")
})

const amenitiesSuggestions = [
  "WiFi", "Parking", "Furnished", "Security", "Laundry", 
  "Air Conditioning", "Study Desk", "TV", "Kitchen", 
  "Bathroom", "Shower", "Gym", "Pool",
]

// Global variable to track if Leaflet is loaded
let leafletLoaded = false;

export function LandlordDashboard() {
  const { data: session } = useSession()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("properties")
  
  // Form related state
  const commandRef = useRef(null)
  const [media, setMedia] = useState([])
  const [amenityInput, setAmenityInput] = useState("")
  const [error, setError] = useState("")
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [roomSharing, setRoomSharing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: "",
      location: { lat: 0, lng: 0, address: "" },
      bedrooms: "",
      bathrooms: "",
      description: "",
      amenities: [],
      deposit: "",
      roomSharing: false,
      tenantsPerRoom: "1",
      gender: "ANY",
      religion: "ANY"
    },
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch(`/api/properties?ownerId=${session?.user?.id}`)
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAmenities = amenitiesSuggestions.filter((amenity) => {
    const currentAmenities = form.getValues("amenities") || []
    return !currentAmenities.includes(amenity) &&
      amenity.toLowerCase().includes(amenityInput.toLowerCase())
  })

  const addAmenity = (amenity) => {
    const currentAmenities = form.getValues("amenities") || []
    if (!currentAmenities.includes(amenity)) {
      form.setValue("amenities", [...currentAmenities, amenity])
    }
    setAmenityInput("")
  }

  const removeAmenity = (amenityToRemove) => {
    const currentAmenities = form.getValues("amenities") || []
    form.setValue(
      "amenities",
      currentAmenities.filter((amenity) => amenity !== amenityToRemove)
    )
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commandRef.current && !commandRef.current.contains(event.target)) {
        setIsCommandOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const onSubmit = async (data) => {
    if (media.length === 0) {
      setError("Please upload at least one image or video");
      return;
    }

    if (!media.some(item => item.type === 'image')) {
      setError("Please upload at least one image");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          latitude: data.location.lat,
          longitude: data.location.lng,
          location: data.location.address,
          media: media.map(item => ({
            url: item.url,
            type: item.type || 'image'
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create property");
      }

      toast.success("Property created successfully!");
      fetchProperties();
      
      // Reset the form
      form.reset();
      setMedia([]);
      setRoomSharing(false);
      
      // Switch back to properties tab
      setActiveTab("properties");
    } catch (error) {
      toast.error(error.message || "Failed to create property");
      setError(error.message || "Failed to create property");
    } finally {
      setSubmitting(false);
    }
  };

  // Leaflet map selector component
  function LeafletMapSelector({ value, onChange }) {
    const containerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const searchInputRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(leafletLoaded);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    
    // Location suggestions
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef(null);
    
    // Hide suggestions when clicking outside
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
          setShowSuggestions(false);
        }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    // Get location suggestions
    useEffect(() => {
      const getLocationSuggestions = async () => {
        if (!searchTerm || searchTerm.length < 3) {
          setLocationSuggestions([]);
          return;
        }
        
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=5`,
            { headers: { 'User-Agent': 'PropertyApp/1.0' } }
          );
          
          if (!response.ok) throw new Error("Failed to get suggestions");
          
          const data = await response.json();
          setLocationSuggestions(data);
          setShowSuggestions(data.length > 0);
        } catch (error) {
          console.error("Error getting location suggestions:", error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      };
      
      const timer = setTimeout(getLocationSuggestions, 400);
      return () => clearTimeout(timer);
    }, [searchTerm]);
    
    // Load Leaflet JS and CSS
    useEffect(() => {
      if (leafletLoaded) {
        setIsMapReady(true);
        return;
      }
      
      const loadLeaflet = async () => {
        // Add Leaflet CSS if needed
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        
        // Load Leaflet JS if needed
        if (!window.L) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
              leafletLoaded = true;
              setIsMapReady(true);
              resolve();
            };
            document.head.appendChild(script);
          });
        } else {
          leafletLoaded = true;
          setIsMapReady(true);
        }
      };
      
      loadLeaflet();
    }, []);
    
    // Initialize map once Leaflet is loaded and the container is ready
    useEffect(() => {
      if (!isMapReady || !containerRef.current || mapInstanceRef.current) return;
      
      // Clear any existing map instances
      if (containerRef.current._leaflet_id) {
        containerRef.current._leaflet_id = null;
      }
      
      const setupMap = () => {
        try {
          console.log("Setting up map once...");
          
          // Default coordinates or provided ones
          const startPos = [value?.lat || 0, value?.lng || 0];
          const hasCoords = value?.lat !== 0 || value?.lng !== 0;
          
          // Create map
          const map = window.L.map(containerRef.current).setView(
            startPos,
            hasCoords ? 13 : 2
          );
          
          mapInstanceRef.current = map;
          
          // Add tile layer
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }).addTo(map);
          
          // Add marker if coordinates exist
          if (hasCoords) {
            const marker = window.L.marker(startPos).addTo(map);
            markerRef.current = marker;
            
            if (value.address) {
              marker.bindPopup(value.address).openPopup();
            }
          }
          
          // Add click handler
          map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            
            // Create or update marker
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              markerRef.current = window.L.marker([lat, lng]).addTo(map);
            }
            
            // Get address
            let address = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'User-Agent': 'PropertyApp/1.0' } }
              );
              if (response.ok) {
                const data = await response.json();
                if (data.display_name) {
                  address = data.display_name;
                }
              }
            } catch (error) {
              console.log("Address lookup failed, using coordinates");
            }
            
            // Update form
            onChange({ lat, lng, address });
            
            // Show popup
            if (markerRef.current) {
              markerRef.current.bindPopup(address).openPopup();
            }
          });
          
          // Force resize
          setTimeout(() => {
            map.invalidateSize();
          }, 100);
          
          // Hide loading indicator
          const loadingIndicator = document.getElementById('map-loading-indicator');
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          
          // Resize handler for map to ensure it displays correctly
          const resizeObserver = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
              setTimeout(() => {
                mapInstanceRef.current.invalidateSize();
              }, 100);
            }
          });
          
          if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
          }
          
          return () => {
            if (containerRef.current) {
              resizeObserver.unobserve(containerRef.current);
            }
          };
        } catch (err) {
          console.error("Error setting up map:", err);
        }
      };
      
      // Delay to ensure the container is properly rendered
      const timeoutId = setTimeout(setupMap, 500);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }, [isMapReady, value, onChange]);
    
    // Update map when the tab becomes active
    useEffect(() => {
      if (activeTab === "addProperty" && mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
        }, 100);
      }
    }, [activeTab]);
    
    // Update marker if value changes
    useEffect(() => {
      if (!mapInstanceRef.current || !isMapReady) return;
      
      // Skip if no valid coordinates
      if (!value?.lat || !value?.lng) return;
      
      const coords = [value.lat, value.lng];
      
      // Center map
      mapInstanceRef.current.setView(coords, 13);
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng(coords);
      } else {
        markerRef.current = window.L.marker(coords).addTo(mapInstanceRef.current);
      }
      
      // Show popup with address
      if (value.address && markerRef.current) {
        markerRef.current.bindPopup(value.address).openPopup();
      }
    }, [isMapReady, value]);
    
    // Handle selecting a suggestion
    const handleSelectSuggestion = (suggestion) => {
      try {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        const address = suggestion.display_name;
        
        // Center map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 13);
        }
        
        // Create or update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else if (mapInstanceRef.current) {
          markerRef.current = window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
        }
        
        // Show popup
        if (markerRef.current) {
          markerRef.current.bindPopup(address).openPopup();
        }
        
        // Update form
        onChange({ lat, lng, address });
        
        // Clear search and hide suggestions
        setSearchTerm("");
        if (searchInputRef.current) {
          searchInputRef.current.value = '';
        }
        setShowSuggestions(false);
      } catch (error) {
        console.error("Error selecting suggestion:", error);
        toast.error("Failed to select location");
      }
    };
    
    // Handle search form submit - WITH preventDefault
    const handleSearch = async (e) => {
      e.preventDefault(); // Prevent page refresh
      
      if (!isMapReady || !mapInstanceRef.current) {
        toast.error("Map is not ready yet");
        return;
      }
      
      if (!searchTerm.trim()) return;
      
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`,
          { headers: { 'User-Agent': 'PropertyApp/1.0' } }
        );
        
        if (!response.ok) throw new Error("Search failed");
        
        const data = await response.json();
        
        if (data.length === 0) {
          toast.error("No locations found");
          return;
        }
        
        // Use first result
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const address = result.display_name;
        
        // Center map
        mapInstanceRef.current.setView([lat, lng], 13);
        
        // Create or update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
        }
        
        // Show popup
        markerRef.current.bindPopup(address).openPopup();
        
        // Update form
        onChange({ lat, lng, address });
        
        // Clear search
        setSearchTerm("");
        setShowSuggestions(false);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to search location");
      } finally {
        setIsSearching(false);
      }
    };
    
    // Get user's current location
    const getUserLocation = () => {
      if (!isMapReady || !mapInstanceRef.current) {
        toast.error("Map is not ready yet");
        return;
      }
      
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Center map
          mapInstanceRef.current.setView([latitude, longitude], 13);
          
          // Create or update marker
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            markerRef.current = window.L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
          }
          
          // Get address
          let address = `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { headers: { 'User-Agent': 'PropertyApp/1.0' } }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.display_name) {
                address = data.display_name;
              }
            }
          } catch (error) {
            console.error("Error getting address:", error);
          }
          
          // Update form
          onChange({ lat: latitude, lng: longitude, address });
          
          // Show popup
          markerRef.current.bindPopup(address).openPopup();
        },
        (error) => {
          let errorMessage = "An unknown error occurred";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          
          toast.error(errorMessage);
        }
      );
    };
    
    return (
      <div className="space-y-4">
        <Label>Property Location {value?.address && <span className="text-green-500">✓</span>}</Label>
        
        {/* Search form with suggestions - Now in a container div with positioning */}
        <div className="relative" ref={suggestionsRef} style={{ position: 'relative', zIndex: 9999 }}>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location..."
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.length >= 3 && setShowSuggestions(true)}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={isSearching}
            >
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
              aria-label="Use my location"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </form>
          
          {/* Location suggestions dropdown with improved positioning and z-index */}
          {showSuggestions && (
            <div className="absolute w-full mt-1 bg-white shadow-lg rounded-md border max-h-60 overflow-auto" 
                 style={{ 
                   position: 'absolute', 
                   top: '100%', 
                   left: 0, 
                   zIndex: 9999,
                   boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                 }}>
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
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
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
        
        {/* Selected location display */}
        {value?.address && (
          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin className="h-4 w-4 mr-1 text-sky-500" />
            <span className="truncate">{value.address}</span>
          </div>
        )}
        
        {/* Map container - Now with a lower z-index than suggestions */}
        <div className="relative border rounded-lg overflow-hidden" style={{ height: "400px", position: 'relative', zIndex: 1 }}>
          {/* Loading indicator */}
          <div
            id="map-loading-indicator"
            className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 z-10"
            style={{ display: isMapReady ? 'none' : 'flex' }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-sky-500" />
          </div>
          
          {/* Map container */}
          <div
            ref={containerRef}
            className="h-full w-full"
            style={{ visibility: isMapReady ? 'visible' : 'hidden' }}
          />
        </div>
        
        <p className="text-sm text-zinc-500">
          Click on the map to set your property location, or use the search box to find an address.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header with User info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-1">
                <UserCircle className="w-4 h-4" />
                <span>{session?.user?.name || 'Loading...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="addProperty" className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Add Property
            </TabsTrigger>
          </TabsList>
          
          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <PropertyList
              properties={properties}
              isLoading={isLoading}
              onRefresh={fetchProperties}
            />
          </TabsContent>
          
          {/* Add Property Tab */}
          <TabsContent value="addProperty" className="space-y-6">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-6">Add New Property</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    {/* Media Upload (Images & Videos) */}
                    <div className="space-y-2">
                      <Label>Property Media (Images & Videos)</Label>
                      <MediaUpload
                        value={media}
                        onChange={setMedia}
                        maxFiles={8}
                      />
                      <p className="text-xs text-zinc-500">
                        Upload up to 8 files. Add at least one image. Videos can be up to 50MB each.
                      </p>
                    </div>

                    {/* Map Location Selector */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <LeafletMapSelector
                            value={field.value}
                            onChange={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Basic Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Month</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="$0.00"
                                type="number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deposit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Security Deposit</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="$0.00"
                                type="number"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Required security deposit amount
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bedrooms</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bathrooms</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Gender Preference - Always visible regardless of sharing */}
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender Preference</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ANY">Any Gender</SelectItem>
                                <SelectItem value="MALE">Male Only</SelectItem>
                                <SelectItem value="FEMALE">Female Only</SelectItem>
                                <SelectItem value="BOTH">Both Male and Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Preferred gender of tenants
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Sharing Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Room Sharing Preferences</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="roomSharing"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Shared Rooms</FormLabel>
                                <FormDescription>
                                  Enable if rooms can be shared by multiple tenants
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked)
                                    setRoomSharing(checked)
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {roomSharing && (
                          <>
                            <FormField
                              control={form.control}
                              name="tenantsPerRoom"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tenants per Room</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="2"
                                      max="4"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Maximum number of tenants that can share a room
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="religion"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Religion Preference</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select religion preference" />
                                      </SelectTrigger>
                                    </FormControl>
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
                                  <FormDescription>
                                    Preferred religion of tenants
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    <FormField
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amenities</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {field.value?.map((amenity) => (
                                  <Badge
                                    key={amenity}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {amenity}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-0 text-zinc-500 hover:text-zinc-700"
                                      onClick={() => removeAmenity(amenity)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                              <Command className="border rounded-md" shouldFilter={false} ref={commandRef}>
                                <CommandInput
                                  placeholder="Type an amenity..."
                                  value={amenityInput}
                                  onValueChange={setAmenityInput}
                                  onFocus={() => setIsCommandOpen(true)}
                                />
                                {isCommandOpen && (
                                  <CommandList>
                                    <CommandEmpty>No amenities found.</CommandEmpty>
                                    {filteredAmenities.map((amenity) => (
                                      <CommandItem
                                        key={amenity}
                                        onSelect={(value) => {
                                          addAmenity(value)
                                          setIsCommandOpen(false)
                                        }}
                                      >
                                        {amenity}
                                      </CommandItem>
                                    ))}
                                  </CommandList>
                                )}
                              </Command>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your property..."
                              className="h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setMedia([]);
                        setActiveTab("properties");
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <LoadingSpinner className="mr-2" />
                          Adding Property...
                        </>
                      ) : (
                        'Add Property'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}