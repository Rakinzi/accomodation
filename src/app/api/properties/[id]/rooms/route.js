import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { id } = params
        if (!id) {
            return NextResponse.json(
                { message: "Property ID is required" },
                { status: 400 }
            )
        }

        // Get property details
        const property = await prisma.property.findUnique({
            where: { id },
            select: {
                id: true,
                bedrooms: true,
                roomSharing: true,
                tenantsPerRoom: true,
                gender: true,
                religion: true,
                currentOccupants: true,
                ownerId: true
            }
        })

        if (!property) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            )
        }

        // Check if user is landlord or admin
        const isAuthorized = 
            session.user.userType === 'ADMIN' || 
            (session.user.userType === 'LANDLORD' && property.ownerId === session.user.id)

        if (!isAuthorized) {
            return NextResponse.json(
                { message: "You are not authorized to access this information" },
                { status: 403 }
            )
        }

        // Get active occupants for this property
        const occupants = await prisma.occupant.findMany({
            where: {
                propertyId: id,
                status: 'ACTIVE'
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
        })

        // Organize occupants by room
        const rooms = {}
        
        // Initialize all rooms (even empty ones)
        for (let i = 1; i <= property.bedrooms; i++) {
            rooms[i] = {
                roomNumber: i,
                occupants: [],
                totalOccupants: 0,
                capacity: property.roomSharing ? property.tenantsPerRoom : 1,
                available: true,
                isFull: false
            }
        }
        
        // Fill with actual occupants
        occupants.forEach(occupant => {
            const roomNum = occupant.roomNumber
            if (roomNum && rooms[roomNum]) {
                rooms[roomNum].occupants.push(occupant)
                rooms[roomNum].totalOccupants++
                
                // Update available and isFull flags
                if (property.roomSharing) {
                    rooms[roomNum].isFull = rooms[roomNum].totalOccupants >= property.tenantsPerRoom
                    rooms[roomNum].available = !rooms[roomNum].isFull
                } else {
                    rooms[roomNum].isFull = rooms[roomNum].totalOccupants > 0
                    rooms[roomNum].available = !rooms[roomNum].isFull
                }
            }
        })

        // Summary statistics
        const summary = {
            totalRooms: property.bedrooms,
            totalCapacity: property.bedrooms * (property.roomSharing ? property.tenantsPerRoom : 1),
            totalOccupants: property.currentOccupants,
            availableSpaces: (property.bedrooms * (property.roomSharing ? property.tenantsPerRoom : 1)) - property.currentOccupants,
            availableRooms: Object.values(rooms).filter(room => room.available).length,
            fullRooms: Object.values(rooms).filter(room => room.isFull).length,
            partiallyOccupiedRooms: property.roomSharing ? Object.values(rooms).filter(room => room.totalOccupants > 0 && !room.isFull).length : 0,
            emptyRooms: Object.values(rooms).filter(room => room.totalOccupants === 0).length,
            isRoomSharing: property.roomSharing,
            tenantsPerRoom: property.tenantsPerRoom,
            gender: property.gender,
            religion: property.religion
        }

        return NextResponse.json({
            rooms: Object.values(rooms),
            summary
        })

    } catch (error) {
        console.error('[PROPERTY_ROOMS]', error)
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        )
    }
}