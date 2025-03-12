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

        // Parse the request body
        let body;
        try {
            body = await request.json()
        } catch (error) {
            console.error("Error parsing request body:", error)
            return NextResponse.json(
                { message: "Invalid request body" },
                { status: 400 }
            )
        }

        const { propertyId, userId, roomNumber } = body
        
        // Log input values for debugging
        console.log("Allocation request:", { propertyId, userId, roomNumber, landlordId: session.user.id })

        if (!propertyId || !userId || !roomNumber) {
            return NextResponse.json(
                { message: "Missing required fields: propertyId, userId, or roomNumber" },
                { status: 400 }
            )
        }

        // Verify property exists and get details
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                occupants: {
                    where: { status: 'ACTIVE' },
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

        // Verify ownership
        if (property.ownerId !== session.user.id) {
            return NextResponse.json(
                { message: "Unauthorized - not the property owner" },
                { status: 401 }
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

        // Get student information for compatibility checks
        const student = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                gender: true,
                religion: true
            }
        })

        if (!student) {
            return NextResponse.json(
                { message: "Student not found" },
                { status: 404 }
            )
        }

        // Log student info for debugging
        console.log("Student info:", student)

        // Get occupants in the specified room
        const roomOccupants = property.occupants.filter(
            occupant => occupant.roomNumber === roomNumber
        )

        // Validate room capacity
        if (!property.roomSharing && roomOccupants.length > 0) {
            return NextResponse.json(
                { message: "This room is not available for sharing" },
                { status: 400 }
            )
        }

        if (property.roomSharing && roomOccupants.length >= property.tenantsPerRoom) {
            return NextResponse.json(
                { message: `This room has reached its maximum capacity of ${property.tenantsPerRoom} tenants` },
                { status: 400 }
            )
        }

        // STRICT gender compatibility check - must match exactly if both have values
        if (roomOccupants.length > 0) {
            const existingGender = roomOccupants[0].user.gender
            // Check if both genders are specified and they don't match
            if (existingGender && student.gender && existingGender !== student.gender) {
                return NextResponse.json(
                    { message: `Cannot allocate: Gender incompatibility with current room occupants (${existingGender.toLowerCase()})` },
                    { status: 400 }
                )
            }
        }

        // STRICT religion compatibility check - must match exactly if both have values
        if (roomOccupants.length > 0) {
            const existingReligion = roomOccupants[0].user.religion
            // Check if both religions are specified and they don't match
            if (existingReligion && student.religion && existingReligion !== student.religion) {
                return NextResponse.json(
                    { message: `Cannot allocate: Religion incompatibility with current room occupants (${existingReligion.toLowerCase()})` },
                    { status: 400 }
                )
            }
        }

        // Set the price to the full property price regardless of sharing
        const totalPrice = property.price

        try {
            // Create occupancy record and update property in a transaction
            const [occupant, updatedProperty] = await prisma.$transaction([
                // Create the occupant record
                prisma.occupant.create({
                    data: {
                        userId,
                        propertyId,
                        status: 'ACTIVE',
                        roomNumber: parseInt(roomNumber),
                        totalPrice
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                gender: true,
                                religion: true
                            }
                        }
                    }
                }),
                // Update the property
                prisma.property.update({
                    where: { id: propertyId },
                    data: {
                        currentOccupants: {
                            increment: 1
                        },
                        status: property.currentOccupants + 1 >= (property.bedrooms * (property.roomSharing ? property.tenantsPerRoom : 1)) 
                            ? 'RENTED' 
                            : 'AVAILABLE'
                    },
                    include: {
                        occupants: {
                            where: { status: 'ACTIVE' },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        gender: true,
                                        religion: true
                                    }
                                }
                            }
                        }
                    }
                })
            ])

            // Calculate room occupancy details
            const roomOccupancyDetails = {
                roomNumber,
                currentOccupants: roomOccupants.length + 1,
                maxOccupants: property.roomSharing ? property.tenantsPerRoom : 1,
                pricePerTenant: totalPrice,
                isShared: property.roomSharing
            }

            // Return with allocation details
            return NextResponse.json({
                message: "Room allocated successfully",
                data: {
                    occupant,
                    property: {
                        ...updatedProperty,
                        allocation: {
                            totalRooms: property.bedrooms,
                            occupiedSpaces: property.currentOccupants + 1,
                            totalCapacity: property.bedrooms * (property.roomSharing ? property.tenantsPerRoom : 1),
                            pricePerPerson: totalPrice,
                            isRoomSharing: property.roomSharing,
                            tenantsPerRoom: property.tenantsPerRoom,
                            roomDetails: roomOccupancyDetails
                        }
                    }
                }
            })
        } catch (dbError) {
            console.error("Database error during allocation:", dbError)
            return NextResponse.json(
                { message: `Database error: ${dbError.message}` },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('[PROPERTY_ALLOCATE]', error)
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        )
    }
}