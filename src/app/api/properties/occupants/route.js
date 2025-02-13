import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const occupants = await prisma.occupant.findMany({
            where: {
                property: {
                    ownerId: session.user.id
                },
                status: 'ACTIVE'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                property: {
                    select: {
                        id: true,
                        location: true
                    }
                }
            }
        })

        return NextResponse.json(occupants)
    } catch (error) {
        console.error('[PROPERTY_OCCUPANTS_GET]', error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}