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
import { ImageUpload } from "./ImageUpload"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "./Command"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"

const formSchema = z.object({
  price: z.string().min(1, "Price is required"),
  deposit: z.string().min(1, "Deposit amount is required"),
  location: z.string().min(1, "Location is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amenities: z.array(z.string()).min(1, "At least one amenity is required"),
  // Sharing preferences
  sharing: z.boolean().default(false),
  gender: z.enum(["MALE", "FEMALE", "ANY"]).default("ANY"),
  religion: z.enum(["CHRISTIAN", "MUSLIM", "HINDU", "BUDDHIST", "JEWISH", "ANY", "OTHER"]).default("ANY"),
  maxOccupants: z.string().optional().transform(val => val || "1"),
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
  const [sharing, setSharing] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: "",
      location: "",
      bedrooms: "",
      bathrooms: "",
      description: "",
      amenities: [],
      deposit: "",
      // Sharing preferences
      sharing: false,
      gender: "ANY",
      religion: "ANY",
      maxOccupants: "1"
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
                        <FormLabel>Deposit Amount</FormLabel>
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

                {/* Sharing Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sharing Preferences</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sharing"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Shared Accommodation</FormLabel>
                            <FormDescription>
                              Enable if this property is available for sharing
                            </FormDescription>
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

                    {sharing && (
                      <>
                        <FormField
                          control={form.control}
                          name="maxOccupants"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Occupants</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Gender</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
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

                        <FormField
                          control={form.control}
                          name="religion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Religion</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
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