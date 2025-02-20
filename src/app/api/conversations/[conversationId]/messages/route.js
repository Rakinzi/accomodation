import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "../../../auth/[...nextauth]/route"

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to send messages" },
        { status: 401 }
      )
    }

    const { conversationId } = params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      )
    }

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { studentId: session.user.id },
          { landlordId: session.user.id }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // Create message and update conversation in transaction
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          senderId: session.user.id,
          conversationId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    ])

    return NextResponse.json(message)
  } catch (error) {
    console.error('[MESSAGE_POST]', error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}