"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image"
import { 
  BedSingleIcon, 
  ShowerHead as ShowerIcon, // Fixed import
  MapPinIcon, 
  EditIcon, 
  TrashIcon,
  ImageIcon 
} from "lucide-react"
import Link from "next/link"

export function PropertyCard({ property, onDelete }) {
  const amenities = JSON.parse(property.amenities)

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/dashboard/properties/${property.id}`}>
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            {property.images.length > 0 ? (
              <Image
                src={property.images[0].url}
                alt={property.location}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                <ImageIcon className="h-10 w-10 text-zinc-400" />
              </div>
            )}
          </AspectRatio>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="font-semibold text-white">{property.location}</h3>
            <p className="text-lg font-bold text-white">
              ${property.price.toLocaleString()}
            </p>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-1">
            <BedSingleIcon className="h-4 w-4" />
            <span>{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center gap-1">
            <ShowerIcon className="h-4 w-4" />
            <span>{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPinIcon className="h-4 w-4" />
            <span className="truncate">{property.location}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {amenities.slice(0, 3).map((amenity) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{amenities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
        <Link href={`/dashboard/properties/${property.id}/edit`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <EditIcon className="h-4 w-4" />
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault()
            onDelete()
          }}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}