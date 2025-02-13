import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import React from "react"

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions)
        const { id } = await params // This is the property ID

        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        // Get the user ID from the query params (this will be the potential occupant's ID)
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required" },
                { status: 400 }
            )
        }

        // Get property with its current occupants
        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                occupants: {
                    where: {
                        userId,
                        status: 'ACTIVE'
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
                }
            }
        })

        if (!property) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            )
        }

        // Check if the user is currently occupying this property
        const currentOccupancy = property.occupants[0] // Will be undefined if no active occupancy exists

        return NextResponse.json({
            isOccupant: !!currentOccupancy,
            occupancyDetails: currentOccupancy || null,
            property: {
                id: property.id,
                status: property.status,
                sharing: property.sharing,
                currentOccupants: property.currentOccupants,
                maxOccupants: property.maxOccupants
            }
        })

    } catch (error) {
        console.error('[PROPERTY_OCCUPANCY_GET]', error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}