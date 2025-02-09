import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { 
  EditIcon, 
  TrashIcon, 
  EyeIcon,
  BedSingleIcon,
  ShowerHead,
  MapPinIcon 
} from "lucide-react"
import Image from "next/image"

export function PropertyList() {
  // Mock data - replace with API call
  const properties = [
    {
      id: 1,
      images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
      price: 5000,
      location: "City Center",
      bedrooms: 2,
      bathrooms: 1,
      status: "available",
      inquiries: 12
    },
    // ...more properties
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <Card key={property.id} className="group relative overflow-hidden">
          <CardContent className="p-0">
            <AspectRatio ratio={16/9}>
              <Image
                src={property.images[0]}
                alt={property.location}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <Badge 
                className={`absolute top-4 right-4 ${
                  property.status === 'available' 
                    ? 'bg-green-500' 
                    : 'bg-orange-500'
                }`}
              >
                {property.status}
              </Badge>
            </AspectRatio>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">
                  R{property.price.toLocaleString()}/month
                </h3>
                <p className="flex items-center text-sm text-zinc-500 mt-1">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {property.location}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-4 text-sm text-zinc-600">
                  <span className="flex items-center">
                    <BedSingleIcon className="w-4 h-4 mr-1" />
                    {property.bedrooms}
                  </span>
                  <span className="flex items-center">
                    <ShowerHead className="w-4 h-4 mr-1" />
                    {property.bathrooms}
                  </span>
                </div>
                <Badge variant="secondary">
                  {property.inquiries} inquiries
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="icon">
                  <EditIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}