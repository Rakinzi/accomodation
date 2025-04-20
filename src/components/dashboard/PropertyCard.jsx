"use client"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState, useEffect } from "react"
import { 
  BedSingleIcon, 
  ShowerHead, 
  MapPinIcon, 
  EditIcon, 
  TrashIcon,
  ImageIcon,
  DollarSign,
  Star,
  Video as VideoIcon,
  Users2Icon
} from "lucide-react"
import Link from "next/link"

export function PropertyCard({ property, onDelete }) {
  // Safely access media/images with fallbacks
  const mediaItems = property.media || property.images || [];
  
  // Parse amenities if it's a string
  const amenities = typeof property.amenities === 'string' 
    ? JSON.parse(property.amenities) 
    : (property.amenities || []);

  // Find the first image to use as the main card image
  const mainImage = mediaItems.find(item => !item.type || item.type === 'image')?.url || '/placeholder-image.jpg';
  
  // Count videos
  const videoCount = mediaItems.filter(item => item.type === 'video').length;

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
          ({property._count?.reviews || 0} reviews)
        </span>
      </div>
    )
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/dashboard/properties/${property.id}`}>
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            <Image
              src={mainImage}
              alt={property.location}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </AspectRatio>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">{property.location}</h3>
              {property.averageRating !== undefined && renderStars(property.averageRating)}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">
                ${property.price?.toLocaleString() || '0'} / room
              </p>
              <p className="text-sm font-medium text-white/90 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {property.deposit ? (
                  `${property.deposit.toLocaleString()} deposit`
                ) : (
                  'No deposit required'
                )}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <Badge className="absolute top-2 right-2">
            {property.status}
          </Badge>

          {/* Video indicator */}
          {videoCount > 0 && (
            <Badge 
              variant="secondary"
              className="absolute top-2 left-2 flex items-center gap-1"
            >
              <VideoIcon className="h-3 w-3" />
              {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-1">
            <BedSingleIcon className="h-4 w-4" />
            <span>{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center gap-1">
            <ShowerHead className="h-4 w-4" />
            <span>{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPinIcon className="h-4 w-4" />
            <span className="truncate">{property.location}</span>
          </div>
        </div>

        {/* Show room sharing info if available */}
        {property.roomSharing && (
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
            <Users2Icon className="h-4 w-4" />
            <span>
              {property.currentOccupants || 0}/{property.tenantsPerRoom || property.maxOccupants || 1} occupants
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.isArray(amenities) && amenities.slice(0, 3).map((amenity) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {Array.isArray(amenities) && amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{amenities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 pt-0">
        {/* Show average rating in footer */}
        {property.averageRating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-zinc-600">
              {property.averageRating.toFixed(1)} 
              <span className="text-xs text-zinc-500 ml-1">
                ({property._count?.reviews || 0} reviews)
              </span>
            </span>
          </div>
        )}
        
        <div className="flex gap-2 ml-auto">
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
        </div>
      </CardFooter>
    </Card>
  )
}

// Add the AspectRatio component if it's not imported
const AspectRatio = ({ children, ratio = 16 / 9 }) => {
  return (
    <div className="relative w-full overflow-hidden" style={{ paddingBottom: `${(1 / ratio) * 100}%` }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
};