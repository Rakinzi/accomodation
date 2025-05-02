"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { MediaUpload } from "@/components/MediaUpload"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { X, ArrowLeft, PlusCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

const formSchema = z.object({
  price: z.string().min(1, "Price is required"),
  location: z.string().min(1, "Location is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amenities: z.array(z.string()).min(1, "At least one amenity is required"),
  sharing: z.boolean().default(false),
  deposit: z.string().min(1, "Deposit amount is required"),
  gender: z.enum(["ANY", "MALE", "FEMALE"]).default("ANY"),
  religion: z.enum(["ANY", "CHRISTIAN", "MUSLIM", "HINDU", "BUDDHIST", "JEWISH", "OTHER"]).default("ANY"),
  maxOccupants: z.string().optional().transform(val => val || "1"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).default("AVAILABLE")
})

const amenitiesSuggestions = [
  "WiFi", "Parking", "Furnished", "Security", "Laundry",
  "Air Conditioning", "Study Desk", "TV", "Kitchen",
  "Bathroom", "Shower", "Gym", "Pool"
]

export default function EditPropertyPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [media, setMedia] = useState([])
  const [sharing, setSharing] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: "",
      deposit: "",
      location: "",
      bedrooms: "",
      bathrooms: "",
      description: "",
      amenities: [],
      sharing: false,
      gender: "ANY",
      religion: "ANY",
      maxOccupants: "1",
      status: "AVAILABLE"
    },
  })

  useEffect(() => {
    document.title = "Edit Property | Landlord Accommodation"
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${id}`)
        if (!response.ok) throw new Error('Failed to fetch property')
        const data = await response.json()

        // Parse amenities if it's a string
        const parsedAmenities = typeof data.amenities === 'string' 
          ? JSON.parse(data.amenities) 
          : data.amenities || []

        form.reset({
          price: data.price.toString(),
          deposit: data.deposit?.toString() || "0",
          location: data.location,
          bedrooms: data.bedrooms.toString(),
          bathrooms: data.bathrooms.toString(),
          description: data.description,
          amenities: parsedAmenities,
          sharing: data.roomSharing || false, // Updated from sharing to roomSharing
          gender: data.gender || "ANY",
          religion: data.religion || "ANY",
          maxOccupants: data.tenantsPerRoom?.toString() || "1", // Updated from maxOccupants to tenantsPerRoom
          status: data.status || "AVAILABLE"
        })

        setSharing(data.roomSharing || false) // Updated from sharing to roomSharing
        
        // Handle media (both images and videos)
        const mediaItems = data.media || []
        
        // If old format property has images but no media
        if ((!mediaItems || mediaItems.length === 0) && data.images && data.images.length > 0) {
          setMedia(data.images.map(img => ({
            url: img.url,
            type: 'image'
          })))
        } else {
          setMedia(mediaItems)
        }
      } catch (error) {
        console.error('Error fetching property:', error)
        toast.error("Failed to load property")
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProperty()
  }, [id, form, router])

  const onSubmit = async (data) => {
    try {
      if (media.length === 0) {
        toast.error("Please upload at least one image")
        return
      }

      if (!media.some(item => item.type === 'image' || !item.type)) {
        toast.error("Please upload at least one image")
        return
      }

      setSubmitting(true)
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          media: media, // Send all media items (images and videos)
          roomSharing: data.sharing, // Map sharing to roomSharing for API
          tenantsPerRoom: parseInt(data.maxOccupants) // Map maxOccupants to tenantsPerRoom for API
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update property')
      }

      toast.success("Property updated successfully")
      router.push(`/dashboard/properties/${id}`)
    } catch (error) {
      console.error('Failed to update property:', error)
      toast.error(error.message || "Failed to update property")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="sticky top-0 z-50 backdrop-blur-md bg-white/75 dark:bg-zinc-900/75 -mx-6 px-6 py-4 flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Property</h1>
        </div>

        <Card className="overflow-hidden border-none shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6">
              <div className="grid gap-8">
                {/* Media Upload - Updated to handle both images and videos */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Property Media</h2>
                  <MediaUpload
                    value={media}
                    onChange={setMedia}
                    maxFiles={8}
                  />
                  <p className="text-xs text-zinc-500">
                    Upload up to 8 files. Add at least one image. Videos can be up to 50MB each.
                  </p>
                </div>

                {/* Basic Details */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Basic Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Month</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
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
                              type="number"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter location" {...field} />
                          </FormControl>
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
                            <Input type="number" min="1" {...field} />
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
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AVAILABLE">Available</SelectItem>
                              <SelectItem value="OCCUPIED">Occupied</SelectItem>
                              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sharing Preferences */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Sharing Preferences</h2>
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="sharing"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel className="text-base">Shared Accommodation</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Enable if this property is available for sharing
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked)
                                setSharing(checked)
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Gender preference - always visible */}
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Gender</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ANY">Any</SelectItem>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Religion preference - always visible */}
                      <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Religion</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ANY">Any</SelectItem>
                                <SelectItem value="CHRISTIAN">Christian</SelectItem>
                                <SelectItem value="MUSLIM">Muslim</SelectItem>
                                <SelectItem value="HINDU">Hindu</SelectItem>
                                <SelectItem value="BUDDHIST">Buddhist</SelectItem>
                                <SelectItem value="JEWISH">Jewish</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Only show max occupants field if sharing is enabled */}
                      {sharing && (
                        <FormField
                          control={form.control}
                          name="maxOccupants"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Occupants Per Room</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Amenities</h2>
                  <FormField
                    control={form.control}
                    name="amenities"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {field.value?.map((amenity) => (
                                <Badge
                                  key={amenity}
                                  variant="secondary"
                                  className="flex items-center gap-1 px-3 py-1.5"
                                >
                                  {amenity}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-zinc-500 hover:text-zinc-700 ml-2"
                                    onClick={() => {
                                      const current = field.value || []
                                      field.onChange(current.filter(a => a !== amenity))
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {amenitiesSuggestions.map((amenity) => (
                                <Button
                                  key={amenity}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const current = field.value || []
                                    if (!current.includes(amenity)) {
                                      field.onChange([...current, amenity])
                                    }
                                  }}
                                  className="flex items-center gap-1"
                                  disabled={field.value?.includes(amenity)}
                                >
                                  <PlusCircle className="h-4 w-4" />
                                  {amenity}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Description</h2>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {/* Submit Button Section */}
              <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-32"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-32 bg-sky-500 hover:bg-sky-600"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  )
}