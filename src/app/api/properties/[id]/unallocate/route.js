import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions)
        const { id } = params // Property ID

        if (!session || session.user.userType !== 'LANDLORD') {
            return NextResponse.json(
                { message: "Unauthorized - Only landlords can unallocate rooms" },
                { status: 401 }
            )
        }

        // Get request body
        const { occupancyId } = await request.json()

        if (!occupancyId) {
            return NextResponse.json(
                { message: "Occupancy ID is required" },
                { status: 400 }
            )
        }

        // Get property and occupancy details
        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                occupants: {
                    where: { 
                        id: occupancyId,
                        status: 'ACTIVE'
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

        // Verify occupancy exists
        const occupancy = property.occupants[0]
        if (!occupancy) {
            return NextResponse.json(
                { message: "Active occupancy not found" },
                { status: 404 }
            )
        }

        // Perform unallocation in a transaction
        const [updatedOccupancy, updatedProperty] = await prisma.$transaction([
            // Update occupancy status to INACTIVE and set end date
            prisma.occupant.update({
                where: { id: occupancyId },
                data: {
                    status: 'INACTIVE',
                    endDate: new Date()
                }
            }),
            // Update property occupancy count and status
            prisma.property.update({
                where: { id },
                data: {
                    currentOccupants: {
                        decrement: 1
                    },
                    status: 'AVAILABLE'
                }
            })
        ])

        return NextResponse.json({
            message: "Rooms unallocated successfully",
            data: {
                occupancy: updatedOccupancy,
                property: updatedProperty
            }
        })

    } catch (error) {
        console.error('[PROPERTY_UNALLOCATE]', error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}