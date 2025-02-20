import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { propertyId, userId } = params
    console.log('Checking allocation for:', { propertyId, userId })

    // Verify the property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      )
    }

    // Check if the student has an active allocation
    const occupant = await prisma.occupant.findFirst({
      where: {
        propertyId,
        userId,
        status: 'ACTIVE'
      },
      include: {
        property: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      isActive: !!occupant,
      occupant
    })

  } catch (error) {
    console.error('[OCCUPANT_CHECK]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { propertyId, userId } = params
    const body = await request.json()
    const { numberOfRooms, totalPrice } = body

    // Verify the property exists and is available
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: session.user.id,
        status: 'AVAILABLE'
      }
    })

    if (!property) {
      return NextResponse.json(
        { message: "Property not found or unavailable" },
        { status: 404 }
      )
    }

    // Create occupancy record
    const occupant = await prisma.occupant.create({
      data: {
        userId,
        propertyId,
        numberOfRooms,
        totalPrice,
        status: 'ACTIVE'
      },
      include: {
        property: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Update property status
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: property.sharing ? 'AVAILABLE' : 'RENTED',
        currentOccupants: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      message: "Property allocated successfully",
      data: occupant
    })

  } catch (error) {
    console.error('[OCCUPANT_ALLOCATE]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { propertyId, userId } = params

    // Update occupant status to inactive
    const updatedOccupant = await prisma.occupant.updateMany({
      where: {
        propertyId,
        userId,
        status: 'ACTIVE'
      },
      data: {
        status: 'INACTIVE',
        endDate: new Date()
      }
    })

    if (updatedOccupant.count === 0) {
      return NextResponse.json(
        { message: "No active occupancy found" },
        { status: 404 }
      )
    }

    // Update property status
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: 'AVAILABLE',
        currentOccupants: {
          decrement: 1
        }
      }
    })

    return NextResponse.json({
      message: "Property unallocated successfully"
    })

  } catch (error) {
    console.error('[OCCUPANT_UNALLOCATE]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}