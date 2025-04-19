// src/app/api/properties/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      price,
      location,
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      description,
      amenities,
      media, // Changed from images to media
      deposit,
      // Room sharing preferences
      roomSharing = false,
      tenantsPerRoom = "1",
      gender = 'ANY',
      religion = 'ANY'
    } = body

    // Validate required fields
    if (!price || !location || !latitude || !longitude || !bedrooms || !bathrooms || !description || !amenities || !media) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Ensure we have at least one image
    if (!media.some(item => item.type === 'image')) {
      return NextResponse.json({ message: "At least one image is required" }, { status: 400 })
    }

    const property = await prisma.property.create({
      data: {
        price: parseFloat(price),
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        description,
        amenities: JSON.stringify(amenities),
        deposit: parseFloat(deposit),
        // Room sharing preferences
        roomSharing: Boolean(roomSharing),
        tenantsPerRoom: parseInt(tenantsPerRoom),
        gender,
        religion,
        currentOccupants: 0,
        // Relations
        owner: {
          connect: {
            id: session.user.id
          }
        },
        // Create media entries
        media: {
          create: media.map(item => ({
            url: item.url,
            type: item.type
          }))
        }
      },
      include: {
        media: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Property created successfully",
      property
    })
  } catch (error) {
    console.error('[PROPERTY_CREATE]', error)
    const errorMessage = error.message || "Internal server error"
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filtering params
    const roomSharing = searchParams.get('sharing')
    const gender = searchParams.get('gender')
    const religion = searchParams.get('religion')
    const ownerId = searchParams.get('ownerId')
    const maxPrice = searchParams.get('maxPrice')
    const minPrice = searchParams.get('minPrice')
    const minRating = searchParams.get('minRating')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') // in kilometers
    
    // Build where clause
    const where = {
      status: 'AVAILABLE',
      ...(ownerId && { ownerId }),
      ...(roomSharing !== null && { roomSharing: roomSharing === 'true' }),
      ...(gender && { gender }),
      ...(religion && { religion }),
      ...((maxPrice || minPrice) && {
        price: {
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
          ...(minPrice && { gte: parseFloat(minPrice) })
        }
      })
    }
    
    const properties = await prisma.property.findMany({
      where,
      include: {
        media: true, // Changed from images to media
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        occupants: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                gender: true,
                religion: true
              }
            }
          }
        },
        // Include reviews for rating calculation
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Calculate average ratings and filter by minimum rating
    let propertiesWithRatings = properties.map(property => {
      // Calculate average rating
      const totalRating = property.reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = property.reviews.length > 0 
        ? Number((totalRating / property.reviews.length).toFixed(1))
        : 0

      // Destructure to remove reviews from the final object
      const { reviews, ...propertyWithoutReviews } = property

      return {
        ...propertyWithoutReviews,
        averageRating,
        // Include review count
        reviewCount: property._count.reviews
      }
    })
    
    // Apply minimum rating filter
    if (minRating) {
      const minRatingValue = parseFloat(minRating)
      propertiesWithRatings = propertiesWithRatings.filter(
        property => property.averageRating >= minRatingValue
      )
    }
    
    // Apply geolocation filtering if coordinates and radius are provided
    if (lat && lng && radius) {
      const userLat = parseFloat(lat)
      const userLng = parseFloat(lng)
      const radiusKm = parseFloat(radius)
      
      // Filter properties by distance
      propertiesWithRatings = propertiesWithRatings.filter(property => {
        if (!property.latitude || !property.longitude) return false
        
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          userLat, userLng,
          property.latitude, property.longitude
        )
        
        // Add distance to property object
        property.distanceInKm = parseFloat(distance.toFixed(1))
        
        // Filter by radius
        return distance <= radiusKm
      })
      
      // Sort by distance
      propertiesWithRatings.sort((a, b) => a.distanceInKm - b.distanceInKm)
    }
    
    return NextResponse.json(propertiesWithRatings)
  } catch (error) {
    console.error('[PROPERTIES_GET]', error)
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c // Distance in kilometers
  
  return distance
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}