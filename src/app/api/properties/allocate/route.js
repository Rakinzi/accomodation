import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.userType !== 'LANDLORD') {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { propertyId, userId, numberOfRooms } = await request.json()

        // Verify property exists and get details
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                occupants: {
                    where: { status: 'ACTIVE' },
                    select: {
                        numberOfRooms: true,
                        userId: true
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

        // Verify ownership
        if (property.ownerId !== session.user.id) {
            return NextResponse.json(
                { message: "Unauthorized - not the property owner" },
                { status: 401 }
            )
        }

        // Validate sharing status
        if (!property.sharing && property.currentOccupants > 0) {
            return NextResponse.json(
                { message: "Non-shared properties can only have one occupant" },
                { status: 400 }
            )
        }

        // Check if user is already an occupant
        const existingOccupancy = await prisma.occupant.findFirst({
            where: {
                userId,
                propertyId,
                status: 'ACTIVE'
            }
        })

        if (existingOccupancy) {
            return NextResponse.json(
                { message: "User is already an occupant" },
                { status: 400 }
            )
        }

        // Calculate total allocated rooms and remaining occupants slots
        const totalAllocatedRooms = property.occupants.reduce((sum, occupant) => 
            sum + occupant.numberOfRooms, 0)
        const remainingRooms = property.bedrooms - totalAllocatedRooms
        const remainingOccupantSlots = property.maxOccupants - property.currentOccupants

        // Calculate maximum allowed rooms for this allocation
        const maxAllowableRooms = Math.min(
            remainingRooms,
            Math.ceil(remainingRooms / Math.max(remainingOccupantSlots, 1)),
            property.sharing ? 2 : 1  // Max 2 for shared, 1 for non-shared
        )

        // Validate number of rooms
        if (numberOfRooms < 1) {
            return NextResponse.json(
                { message: "Must allocate at least one room" },
                { status: 400 }
            )
        }

        if (numberOfRooms > maxAllowableRooms) {
            return NextResponse.json(
                { message: `Cannot allocate more than ${maxAllowableRooms} room(s) to ensure fair distribution` },
                { status: 400 }
            )
        }

        // Validate if allocation would prevent fair distribution
        const roomsAfterAllocation = remainingRooms - numberOfRooms
        const occupantsAfterAllocation = remainingOccupantSlots - 1

        if (occupantsAfterAllocation > 0 && roomsAfterAllocation < occupantsAfterAllocation) {
            return NextResponse.json(
                { message: "This allocation would prevent remaining occupants from getting at least one room each" },
                { status: 400 }
            )
        }

        // Calculate total price
        const totalPrice = property.price * numberOfRooms

        // Create occupancy record and update property in a transaction
        const [occupant, updatedProperty] = await prisma.$transaction([
            prisma.occupant.create({
                data: {
                    userId,
                    propertyId,
                    status: 'ACTIVE',
                    numberOfRooms,
                    totalPrice
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.property.update({
                where: { id: propertyId },
                data: {
                    currentOccupants: property.currentOccupants + 1,
                    status: (totalAllocatedRooms + numberOfRooms) >= property.bedrooms ? 'RENTED' : 'AVAILABLE'
                },
                include: {
                    occupants: {
                        where: { status: 'ACTIVE' },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            })
        ])

        // Return with allocation details
        return NextResponse.json({
            message: "Rooms allocated successfully",
            data: {
                occupant,
                property: {
                    ...updatedProperty,
                    allocation: {
                        totalRooms: property.bedrooms,
                        occupiedRooms: totalAllocatedRooms + numberOfRooms,
                        availableRooms: property.bedrooms - (totalAllocatedRooms + numberOfRooms),
                        pricePerRoom: property.price,
                        isShared: property.sharing,
                        totalOccupants: property.currentOccupants + 1,
                        maxOccupants: property.maxOccupants,
                        remainingOccupantSlots: property.maxOccupants - (property.currentOccupants + 1)
                    }
                }
            }
        })

    } catch (error) {
        console.error('[PROPERTY_ALLOCATE]', error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}