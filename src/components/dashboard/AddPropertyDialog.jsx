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
import { MediaUpload } from "./MediaUpload" // Updated to MediaUpload
import { MapSelector } from "./MapSelector" // New MapSelector component
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "./Command"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, PlusCircle } from "lucide-react"
import { LoadingSpinner } from "./LoadingSpinner"

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
  const [media, setMedia] = useState([]) // Changed from images to media
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
            type: item.type
          }))
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create property")
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      setError(error.message || "Failed to create property")
    } finally {
      setSubmitting(false)
    }
  }

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
                      <MapSelector
                        value={field.value}
                        onChange={field.onChange}
                        required={true}
                        label="Property Location"
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