import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { messageIds } = await request.json()

        if (!messageIds?.length) {
            return NextResponse.json(
                { message: "No message IDs provided" },
                { status: 400 }
            )
        }

        await prisma.message.updateMany({
            where: {
                id: {
                    in: messageIds
                },
                NOT: {
                    senderId: session.user.id
                }
            },
            data: {
                isRead: true
            }
        })

        return NextResponse.json({
            message: "Messages marked as read"
        })

    } catch (error) {
        console.error('[MESSAGES_READ]', error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}