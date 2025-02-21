import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const property = await prisma.property.findUnique({
      where: { id },
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
      }
    })

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      )
    }

    // Calculate room allocation and pricing details
    const totalAllocatedRooms = property.occupants.reduce((sum, occupant) => 
      sum + occupant.numberOfRooms, 0
    )
    const remainingRooms = property.bedrooms - totalAllocatedRooms
    const remainingOccupantSlots = property.maxOccupants - property.currentOccupants

    // Calculate maximum allowable rooms for next allocation
    const maxAllowableRooms = Math.min(
      remainingRooms,
      Math.ceil(remainingRooms / Math.max(remainingOccupantSlots, 1)),
      property.sharing ? 2 : 1 // Max 2 rooms per person if sharing, 1 if not
    )

    const propertyWithAllocationDetails = {
      ...property,
      allocation: {
        totalRooms: property.bedrooms,
        occupiedRooms: totalAllocatedRooms,
        availableRooms: remainingRooms,
        maxAllowableRooms,
        totalOccupants: property.currentOccupants,
        maxOccupants: property.maxOccupants,
        remainingOccupantSlots,
        pricePerRoom: property.price,
        isShared: property.sharing,
        occupantDetails: property.occupants.map(occupant => ({
          ...occupant,
          calculatedRent: occupant.numberOfRooms * property.price,
        })),
        totalRentalIncome: property.occupants.reduce((sum, occupant) => 
          sum + (occupant.numberOfRooms * property.price), 0
        )
      }
    }

    return NextResponse.json(propertyWithAllocationDetails)
  } catch (error) {
    console.error('[PROPERTY_GET]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      images = [],
      amenities = [],
      sharing = false,
      gender = 'ANY',
      religion = 'ANY',
      maxOccupants = 1,
      deposit = 0, // Add this line
      ...propertyData
    } = body

    // Verify ownership
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: {
        ownerId: true,
        currentOccupants: true
      }
    })

    if (!existingProperty) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      )
    }

    if (existingProperty.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    if (parseInt(maxOccupants) < existingProperty.currentOccupants) {
      return NextResponse.json(
        { message: "Cannot reduce max occupants below current occupants" },
        { status: 400 }
      )
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        ...propertyData,
        price: parseFloat(propertyData.price),
        deposit: parseFloat(deposit), // Add this line
        bedrooms: parseInt(propertyData.bedrooms),
        bathrooms: parseInt(propertyData.bathrooms),
        amenities: JSON.stringify(amenities),
        sharing: Boolean(sharing),
        gender,
        religion,
        maxOccupants: parseInt(maxOccupants),
        ...(images.length > 0 && {
          images: {
            deleteMany: {},
            create: images.map(image => ({
              url: image.url
            }))
          }
        })
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
      }
    })

    return NextResponse.json({
      message: "Property updated successfully",
      data: updatedProperty
    })

  } catch (error) {
    console.error('[PROPERTY_UPDATE]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}