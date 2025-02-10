"use client"

import { useEffect, useState } from "react"
import { PropertyCard } from "./PropertyCard"
import { PropertySkeleton } from "./PropertySkeleton"

export function PropertyGrid() {
    const [loading, setLoading] = useState(true)
  const properties = [
    {
      id: 1,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
      ],
      price: 5000,
      location: "City Center",
      bedrooms: 2,
      bathrooms: 1,
      amenities: ["Wifi", "Parking", "Furnished"]
    },
    {
      id: 2,
      images: [
        "https://images.unsplash.com/photo-1554995207-c18c203602cb",
        "https://images.unsplash.com/photo-1574362848149-11496d93a7c7",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
      ],
      price: 7500,
      location: "Suburban Area",
      bedrooms: 3,
      bathrooms: 2,
      amenities: ["Pool", "Security", "Garden"]
    },
    {
      id: 3,
      images: [
        "https://images.unsplash.com/photo-1484154218962-a197022b5858",
        "https://images.unsplash.com/photo-1507089947368-19c1da9775ae",
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6"
      ],
      price: 4500,
      location: "University District",
      bedrooms: 1,
      bathrooms: 1,
      amenities: ["Study Area", "Wifi", "Furnished"]
    },
    {
      id: 4,
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
        "https://images.unsplash.com/photo-1560185007-cde436f6a4d0"
      ],
      price: 9000,
      location: "Beachfront",
      bedrooms: 4,
      bathrooms: 3,
      amenities: ["Ocean View", "Parking", "Security"]
    }
  ]

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false)
        }, 2000)
        return () => clearTimeout(timer)
    })

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-grid-zinc-900/10 -z-10 bg-[size:20px_20px]" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {loading 
          ? Array(6).fill().map((_, i) => <PropertySkeleton key={i} />)
          : properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))
        }
      </div>
    </div>
  )
}