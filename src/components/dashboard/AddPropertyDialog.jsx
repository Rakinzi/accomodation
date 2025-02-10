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
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { ImageUpload } from "./ImageUpload"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "./Command"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useEffect, useRef } from "react"

const formSchema = z.object({
  price: z.string().min(1, "Price is required"),
  location: z.string().min(1, "Location is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amenities: z.array(z.string()).min(1, "At least one amenity is required"),
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
  const [images, setImages] = useState([])
  const [amenityInput, setAmenityInput] = useState("")
  const [error, setError] = useState("")
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commandRef.current && !commandRef.current.contains(event.target)) {
        setIsCommandOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const removeAmenity = (amenityToRemove) => {
    const currentAmenities = form.getValues("amenities") || []
    form.setValue(
      "amenities",
      currentAmenities.filter((amenity) => amenity !== amenityToRemove)
    )
  }

  const onSubmit = async (data) => {
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          images: images.map(image => ({ url: image.url }))
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create property")
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      setError("Failed to create property")
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
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Property Images</Label>
                <ImageUpload
                  value={images}
                  onChange={setImages}
                  maxFiles={5}
                />
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (per month)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R0.00"
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City, Area"
                          {...field}
                        />
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
              >
                Cancel
              </Button>
              <Button type="submit">Add Property</Button>
            </div>
          </form>
        </Form>
      </div>
      </DialogContent>
    </Dialog>
  )
}