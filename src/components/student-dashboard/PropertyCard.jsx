// Enhanced PropertyCard.jsx
"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BedSingleIcon, 
  ShowerHead, 
  MapPinIcon, 
  Users2Icon, 
  DollarSign, 
  Star,
  Video,
  Heart,
  Eye
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function PropertyCard({ property }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const {
    id,
    media = [],
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
    distanceInKm,
    _count,
    averageRating
  } = property

  // Filter media by type
  const images = media.filter(item => item.type === 'image' || !item.type)
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
      <Card 
        className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white/90 backdrop-blur-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Main property image */}
          <Image
            src={mainImage}
            alt={location}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status badge */}
          <Badge
            className={`absolute top-3 right-3 ${
              status === 'AVAILABLE' 
                ? 'bg-green-500 hover:bg-green-600' 
                : status === 'OCCUPIED' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-yellow-500 hover:bg-yellow-600'
            } text-white border-0 shadow-lg`}
          >
            {status}
          </Badge>
          
          {/* Video indicator */}
          {hasVideos && (
            <Badge 
              variant="secondary"
              className="absolute top-3 left-3 bg-black/80 hover:bg-black/90 text-white border-0 flex items-center gap-1 shadow-lg"
            >
              <Video className="h-3 w-3" />
              {videos.length > 1 ? `${videos.length} Videos` : '1 Video'}
            </Badge>
          )}
          
          {/* Distance badge if applicable */}
          {showDistance && (
            <Badge
              className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-black border-0 shadow-lg"
            >
              <MapPinIcon className="h-3 w-3 mr-1" />
              {distanceInKm.toFixed(1)}km
            </Badge>
          )}

          {/* Hover overlay with view button */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl transform transition-transform duration-300 hover:scale-110">
              <Eye className="h-6 w-6 text-sky-600" />
            </div>
          </div>
        </div>
        
        <CardContent className="p-5 space-y-4">
          {/* Header with location and rating */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg truncate text-gray-800 group-hover:text-sky-600 transition-colors">
                {location}
              </h3>
              {averageRating !== undefined && (
                <div className="mt-1">
                  {renderStars(averageRating)}
                </div>
              )}
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 hover:bg-red-50 rounded-full">
              <Heart className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors" />
            </button>
          </div>
          
          {/* Price Section with enhanced styling */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-sky-600">
                  ${price.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500 ml-1">/ room</span>
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  {deposit ? `$${deposit.toLocaleString()} deposit` : 'No deposit required'}
                </p>
              </div>
              <div className="bg-sky-100 rounded-full p-2">
                <DollarSign className="h-5 w-5 text-sky-600" />
              </div>
            </div>
          </div>
          
          {/* Property Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <BedSingleIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {bedrooms} {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <ShowerHead className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium text-gray-700">
                {bathrooms} {bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg col-span-2">
              <MapPinIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700 truncate">
                {location.split(',')[0]}
              </span>
            </div>
            {roomSharing && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg col-span-2">
                <Users2Icon className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">
                  {currentOccupants}/{tenantsPerRoom * bedrooms} Occupants
                </span>
              </div>
            )}
          </div>
          
          {/* Preferences for room sharing */}
          {roomSharing && (
            <div className="flex gap-2">
              {gender !== 'ANY' && (
                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                  {gender} Only
                </Badge>
              )}
              {religion !== 'ANY' && (
                <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                  {religion}
                </Badge>
              )}
            </div>
          )}
          
          {/* Amenities */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Amenities</p>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(amenities) ? 
                amenities.slice(0, 3).map((amenity, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700"
                  >
                    {amenity}
                  </Badge>
                )) : 
                <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-600">
                  Basic amenities
                </Badge>
              }
              {Array.isArray(amenities) && amenities.length > 3 && (
                <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-600">
                  +{amenities.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}