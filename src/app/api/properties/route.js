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
      // Sharing preferences
      sharing = false,
      gender = 'ANY',
      religion = 'ANY',
      maxOccupants = 1
    } = body

    const property = await prisma.property.create({
      data: {
        price: parseFloat(price),
        location,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        description,
        amenities: JSON.stringify(amenities),
        // Sharing preferences
        sharing: Boolean(sharing),
        gender,
        religion,
        maxOccupants: parseInt(maxOccupants),
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
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    // Filtering params
    const sharing = searchParams.get('sharing')
    const gender = searchParams.get('gender')
    const religion = searchParams.get('religion')
    const ownerId = searchParams.get('ownerId')
    const maxPrice = searchParams.get('maxPrice')
    const minPrice = searchParams.get('minPrice')

    // Build where clause
    const where = {
      status: 'AVAILABLE',
      ...(ownerId && { ownerId }),
      ...(sharing && { sharing: sharing === 'true' }),
      ...(gender && { gender }),
      ...(religion && { religion }),
      ...(maxPrice || minPrice) && {
        price: {
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
          ...(minPrice && { gte: parseFloat(minPrice) })
        }
      }
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('[PROPERTIES_GET]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}