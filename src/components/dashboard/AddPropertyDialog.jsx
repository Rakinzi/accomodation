"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState, useRef, useEffect } from "react"
import { MediaUpload } from "../MediaUpload"
import { Command, CommandEmpty, CommandInput, CommandList, CommandItem } from "./Command"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, PlusCircle, Search, Loader2, MapPin } from "lucide-react"
import { LoadingSpinner } from "./LoadingSpinner"
import { toast } from "sonner"

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
  // Room sharing preferences
  roomSharing: z.boolean().default(false),
  tenantsPerRoom: z.string().min(1, "Number of tenants per room is required"),
  gender: z.enum(["MALE", "FEMALE", "ANY"]).default("ANY"),
  religion: z.enum(["CHRISTIAN", "MUSLIM", "HINDU", "BUDDHIST", "JEWISH", "ANY", "OTHER"]).default("ANY")
})

const amenitiesSuggestions = [
  "WiFi",
  "Parking",
  "Furnished",
  "Security",
  "Laundry",
  "Air Conditioning",
  "Study Desk",
  "TV",
  "Kitchen",
  "Bathroom",
  "Shower",
  "Gym",
  "Pool",
]

export function AddPropertyDialog({ open, onOpenChange, onSuccess }) {
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
      // Room sharing preferences
      roomSharing: false,
      tenantsPerRoom: "1",
      gender: "ANY",
      religion: "ANY"
    },
  })

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
      setError("Please upload at least one image or video")
      return
    }

    // Make sure there's at least one image (not just videos)
    if (!media.some(item => item.type === 'image')) {
      setError("Please upload at least one image")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Include location coordinates and address
          latitude: data.location.lat,
          longitude: data.location.lng,
          location: data.location.address,
          // Include media with type information
          media: media.map(item => ({
            url: item.url,
            type: item.type || 'image'
          }))
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create property")
      }

      toast.success("Property created successfully!")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error.message || "Failed to create property")
      setError(error.message || "Failed to create property")
    } finally {
      setSubmitting(false)
    }
  }

  // Map component
  const SimpleMapSelector = ({ value, onChange }) => {
    const [mapInitialized, setMapInitialized] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
  
    // Initialize map on component mount
    useEffect(() => {
      if (!mapContainerRef.current) return;
  
      // Dynamic loading of Leaflet
      const loadLeaflet = async () => {
        // Load CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
  
        // Load JS
        if (!window.L) {
          try {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          } catch (error) {
            toast.error("Failed to load maps. Please check your connection.");
            return;
          }
        }
  
        try {
          // Create map if not already created
          if (!mapRef.current) {
            // Default view if no coordinates
            const defaultView = [0, 0];
            const zoom = 2;
            
            // Check if we have valid coordinates
            const hasCoordinates = value && value.lat && value.lng;
            const initialView = hasCoordinates 
              ? [value.lat, value.lng] 
              : defaultView;
            const initialZoom = hasCoordinates ? 13 : zoom;
  
            // Initialize map
            mapRef.current = window.L.map(mapContainerRef.current).setView(
              initialView, 
              initialZoom
            );
  
            // Add tile layer
            window.L.tileLayer(
              "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
              {
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
              }
            ).addTo(mapRef.current);
  
            // Add initial marker if we have coordinates
            if (hasCoordinates) {
              markerRef.current = window.L.marker([value.lat, value.lng]).addTo(mapRef.current);
            }
  
            // Add click handler
            mapRef.current.on("click", handleMapClick);
            
            // Force map to render correctly
            setTimeout(() => {
              mapRef.current.invalidateSize();
            }, 100);
          }
          
          setMapInitialized(true);
        } catch (error) {
          console.error("Error initializing map:", error);
          toast.error("There was a problem setting up the map");
        }
      };
  
      loadLeaflet();
  
      return () => {
        // Clean up map on component unmount
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }, []);
  
    // Handle map clicks
    const handleMapClick = async (e) => {
      if (!mapRef.current) return;
  
      const { lat, lng } = e.latlng;
  
      try {
        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current);
        }
  
        // Get address
        let address = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { 
              headers: { 
                'User-Agent': 'StudentHousing/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
              address = data.display_name;
            }
          }
        } catch (error) {
          console.error("Error getting address:", error);
          // Continue with coordinates as fallback
        }
  
        // Update location value
        onChange({
          lat,
          lng,
          address,
        });
  
        // Show popup with address
        markerRef.current.bindPopup(address).openPopup();
      } catch (error) {
        console.error("Error handling map click:", error);
        toast.error("Error selecting location");
      }
    };
  
    // Get current location
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        toast.error("Location is not supported by your browser");
        return;
      }
  
      setIsGettingLocation(true);
  
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const lat = latitude; // for consistency in naming
            const lng = longitude;
            
            // Center map and add marker
            if (mapRef.current) {
              mapRef.current.setView([lat, lng], 13);
              
              if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
              } else {
                markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current);
              }
              
              // Try to get address
              let address = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
              
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                  { 
                    headers: { 
                      'User-Agent': 'StudentHousing/1.0'
                    }
                  }
                );
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.display_name) {
                    address = data.display_name;
                  }
                }
              } catch (error) {
                console.error("Error getting address:", error);
                // Continue with coordinates as fallback
              }
              
              // Update location value
              onChange({
                lat,
                lng,
                address,
              });
              
              // Show popup with address
              markerRef.current.bindPopup(address).openPopup();
            }
          } catch (error) {
            console.error("Error getting location:", error);
            toast.error("Could not access your location");
          } finally {
            setIsGettingLocation(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsGettingLocation(false);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error("Location permission denied");
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error("Location information is unavailable");
              break;
            case error.TIMEOUT:
              toast.error("Location request timed out");
              break;
            default:
              toast.error("An unknown error occurred");
              break;
          }
        }
      );
    };
  
    // Search for location - FIXED to prevent form submission
    const handleSearch = async (e) => {
      // Prevent default form submission behavior to avoid page refresh
      e.preventDefault();
      
      if (!searchQuery.trim() || !mapRef.current) return;
  
      setIsSearching(true);
  
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
          { 
            headers: { 
              'User-Agent': 'StudentHousing/1.0'
            }
          }
        );
  
        if (!response.ok) {
          throw new Error("Search failed");
        }
  
        const data = await response.json();
  
        if (data.length === 0) {
          toast.error("No results found. Try a different search term.");
          return;
        }
  
        // Use first result
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const address = result.display_name;
  
        // Update map view
        mapRef.current.setView([lat, lng], 13);
  
        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current);
        }
  
        // Update location value
        onChange({
          lat,
          lng,
          address,
        });
  
        // Show popup with address
        markerRef.current.bindPopup(address).openPopup();
  
        setSearchQuery("");
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to search location");
      } finally {
        setIsSearching(false);
      }
    };
  
    return (
      <div className="space-y-4">
        <Label>Property Location {value?.address && <span className="text-green-500">✓</span>}</Label>
        
        {/* Search form - Make sure to prevent default form submission */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            variant="secondary"
            disabled={isSearching || !mapInitialized}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button" // Explicitly set as button type to avoid form submission
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isGettingLocation || !mapInitialized}
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        </form>
  
        {/* Selected location display */}
        {value?.address && (
          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin className="h-4 w-4 mr-1 text-sky-500" />
            <span className="truncate">{value.address}</span>
          </div>
        )}
  
        {/* Map container */}
        <div className="relative border rounded-lg overflow-hidden" style={{ height: "400px" }}>
          {!mapInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          )}
          <div 
            ref={mapContainerRef} 
            className="h-full w-full"
          />
        </div>
        
        <p className="text-sm text-zinc-500">
          Click on the map to set your property location, or use the search box to find an address.
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Add New Property</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-6">
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
                      <SimpleMapSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Basic Details */}
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {/* Sharing Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Room Sharing Preferences</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                  onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  )
}