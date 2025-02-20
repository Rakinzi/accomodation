import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to mark messages as read" },
        { status: 401 }
      )
    }

    const { messageIds } = await request.json()

    if (!messageIds?.length) {
      return NextResponse.json(
        { error: "Message IDs are required" },
        { status: 400 }
      )
    }

    // Verify user has access to these messages
    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        conversation: {
          OR: [
            { studentId: session.user.id },
            { landlordId: session.user.id }
          ]
        }
      }
    })

    if (messages.length !== messageIds.length) {
      return NextResponse.json(
        { error: "Some messages were not found or you don't have access to them" },
        { status: 403 }
      )
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds }
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MESSAGES_READ]', error)
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    )
  }
}