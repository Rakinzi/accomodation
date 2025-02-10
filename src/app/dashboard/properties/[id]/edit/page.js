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
import { ImageUpload } from "@/components/dashboard/ImageUpload"
import { Command, CommandEmpty,CommandInput, CommandItem,CommandList } from "@/components/dashboard/Command"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { X, ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/card"

const formSchema = z.object({
  price: z.string().min(1, "Price is required"),
  location: z.string().min(1, "Location is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amenities: z.array(z.string()).min(1, "At least one amenity is required"),
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
  const [images, setImages] = useState([])
  const [amenityInput, setAmenityInput] = useState("")
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: "",
      location: "",
      bedrooms: "",
      bathrooms: "",
      description: "",
      amenities: [],
    },
  })

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${id}`)
        if (!response.ok) throw new Error('Failed to fetch property')
        const data = await response.json()
        
        form.reset({
          price: data.price.toString(),
          location: data.location,
          bedrooms: data.bedrooms.toString(),
          bathrooms: data.bathrooms.toString(),
          description: data.description,
          amenities: JSON.parse(data.amenities),
        })
        
        setImages(data.images)
      } catch (error) {
        toast.error("Failed to load property")
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProperty()
  }, [id, form, router])

  const filteredAmenities = amenitiesSuggestions.filter(amenity => {
    const currentAmenities = form.getValues("amenities") || []
    return !currentAmenities.includes(amenity) &&
      amenity.toLowerCase().includes(amenityInput.toLowerCase())
  })

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)
      console.log("ID",id)
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images: images.map(image => ({ url: image.url }))
        }),
      })

      if (!response.ok) throw new Error()
      
      toast.success("Property updated successfully")
      router.push(`/dashboard/properties/${id}`)
    } catch (error) {
      toast.error("Failed to update property")
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
                {/* Image Upload */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Property Images</h2>
                  <ImageUpload 
                    value={images} 
                    onChange={setImages} 
                    maxFiles={5}
                  />
                </div>

                {/* Basic Details */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Basic Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {/* ... keep existing FormFields for price, location, etc ... */}
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
                            <Command className="border rounded-md">
                              {/* ... keep existing Command components ... */}
                            </Command>
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
                          <Textarea 
                            placeholder="Describe your property..." 
                            className="h-32 resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    'Update Property'
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