import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const propertyId = searchParams.get('propertyId')
        const participantId = searchParams.get('participantId')

        if (!propertyId || !participantId) {
            return NextResponse.json({ message: "Missing required parameters" }, { status: 400 })
        }

        const messages = await prisma.message.findMany({
            where: {
                propertyId,
                OR: [
                    { senderId: session.user.id, property: { ownerId: participantId } },
                    { senderId: participantId, property: { ownerId: session.user.id } }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error('[CHAT_MESSAGES_GET]', error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}