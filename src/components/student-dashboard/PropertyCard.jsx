"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Carousel } from "@/components/dashboard/Carousel"
import { BedSingleIcon, ShowerHead, MapPinIcon, Users2Icon } from "lucide-react"
import Link from "next/link"

export function PropertyCard({ property }) {
  const {
    id,
    images,
    price,
    location,
    bedrooms,
    bathrooms,
    amenities,
    sharing,
    gender,
    religion,
    currentOccupants,
    maxOccupants,
    status
  } = property

  return (
    <Link href={`/student-dashboard/property/${id}`} className="block">
      <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] cursor-pointer">
        <div className="relative aspect-[4/3]">
          <Carousel images={images} interval={5000} />
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold truncate">{location}</h3>
            <Badge className="bg-sky-500">{status}</Badge>
          </div>

          <p className="text-2xl font-bold text-sky-500">
            ${price.toLocaleString()}
            <span className="text-sm font-normal text-zinc-500"> / room</span>
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <BedSingleIcon className="h-4 w-4 text-zinc-500" />
              <span>{bedrooms} {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
            </div>
            <div className="flex items-center gap-1">
              <ShowerHead className="h-4 w-4 text-zinc-500" />
              <span>{bathrooms} {bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPinIcon className="h-4 w-4 text-zinc-500" />
              <span className="truncate">{location.split(',')[0]}</span>
            </div>
            {sharing && (
              <div className="flex items-center gap-1">
                <Users2Icon className="h-4 w-4 text-zinc-500" />
                <span>{currentOccupants}/{maxOccupants} Occupants</span>
              </div>
            )}
          </div>

          {sharing && (
            <div className="flex gap-2 text-xs">
              {gender !== 'ANY' && (
                <Badge variant="outline">{gender} Only</Badge>
              )}
              {religion !== 'ANY' && (
                <Badge variant="outline">{religion}</Badge>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 3).map((amenity) => (
              <Badge 
                key={amenity} 
                variant="secondary"
                className="text-xs"
              >
                {amenity}
              </Badge>
            ))}
            {amenities.length > 3 && (
              <Badge 
                variant="secondary"
                className="text-xs"
              >
                +{amenities.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}