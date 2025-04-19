"use client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BedSingleIcon, 
  ShowerHead, 
  MapPinIcon, 
  Users2Icon, 
  DollarSign, 
  Star,
  Video
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

export function PropertyCard({ property }) {
  const {
    id,
    media = [], // Now using media instead of images
    price,
    deposit,
    location,
    bedrooms,
    bathrooms,
    amenities,
    roomSharing,
    gender,
    religion,
    currentOccupants,
    tenantsPerRoom,
    status,
    distanceInKm, // New field for distance from user
    _count, // For review count
    averageRating // From backend calculation
  } = property

  // Filter media by type
  const images = media.filter(item => item.type === 'image' || !item.type) // Handle older data
  const videos = media.filter(item => item.type === 'video')
  const hasVideos = videos.length > 0
  
  // For distance display
  const showDistance = typeof distanceInKm === 'number'

  // Choose the main image to display
  const mainImage = images.length > 0 ? images[0].url : '/placeholder-property.jpg'

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${
              rating >= star 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-zinc-300'
            }`} 
          />
        ))}
        <span className="text-xs text-zinc-500 ml-1">
          ({_count?.reviews || 0})
        </span>
      </div>
    )
  }

  return (
    <Link href={`/student-dashboard/property/${id}`} className="block">
      <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] cursor-pointer">
        <div className="relative aspect-[4/3]">
          {/* Main property image */}
          <Image
            src={mainImage}
            alt={location}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Status badge */}
          <Badge
            className="absolute top-2 right-2"
          >
            {status}
          </Badge>
          
          {/* Video indicator */}
          {hasVideos && (
            <Badge 
              variant="secondary"
              className="absolute top-2 left-2 bg-black/70 hover:bg-black/80 text-white flex items-center gap-1"
            >
              <Video className="h-3 w-3" />
              {videos.length > 1 ? `${videos.length} Videos` : '1 Video'}
            </Badge>
          )}
          
          {/* Distance badge if applicable */}
          {showDistance && (
            <Badge
              className="absolute bottom-2 left-2 bg-white/80 hover:bg-white text-black"
            >
              <MapPinIcon className="h-3 w-3 mr-1" />
              {distanceInKm.toFixed(1)}km
            </Badge>
          )}
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="font-semibold truncate">{location}</h3>
              {averageRating !== undefined && renderStars(averageRating)}
            </div>
          </div>
          
          {/* Price and Deposit Section */}
          <div className="space-y-1">
            <p className="text-2xl font-bold text-sky-500">
              ${price.toLocaleString()}
              <span className="text-sm font-normal text-zinc-500"> / room</span>
            </p>
            <p className="text-sm text-zinc-600 flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>
                {deposit ? `$${deposit.toLocaleString()} deposit` : 'No deposit required'}
              </span>
            </p>
          </div>
          
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
            {roomSharing && (
              <div className="flex items-center gap-1">
                <Users2Icon className="h-4 w-4 text-zinc-500" />
                <span>{currentOccupants}/{tenantsPerRoom} Occupants</span>
              </div>
            )}
          </div>
          
          {roomSharing && (
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