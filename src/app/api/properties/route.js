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
      bedrooms,
      bathrooms,
      description,
      amenities,
      images,
      deposit,
      // Room sharing preferences
      roomSharing = false,
      tenantsPerRoom = "1",
      gender = 'ANY',
      religion = 'ANY'
    } = body

    const property = await prisma.property.create({
      data: {
        price: parseFloat(price),
        location,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        description,
        amenities: JSON.stringify(amenities),
        deposit: parseFloat(deposit),
        // Room sharing preferences - match the database schema field names
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
        images: {
          create: images.map(image => ({
            url: image.url
          }))
        }
      },
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        occupants: {
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
        }
      }
    })

    return NextResponse.json(property)
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
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    // Filtering params
    const roomSharing = searchParams.get('sharing')
    const gender = searchParams.get('gender')
    const religion = searchParams.get('religion')
    const ownerId = searchParams.get('ownerId')
    const maxPrice = searchParams.get('maxPrice')
    const minPrice = searchParams.get('minPrice')
    const minRating = searchParams.get('minRating')
    
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
        images: true,
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
    
    // Calculate average ratings and filter by minimum rating if specified
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
    
    // Apply minimum rating filter on the processed data
    if (minRating) {
      const minRatingValue = parseFloat(minRating)
      propertiesWithRatings = propertiesWithRatings.filter(
        property => property.averageRating >= minRatingValue
      )
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