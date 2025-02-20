import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view this conversation" },
        { status: 401 }
      )
    }

    const { conversationId } = params

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { studentId: session.user.id },
          { landlordId: session.user.id }
        ]
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        property: {
          select: {
            id: true,
            location: true,
            status: true,
            price: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
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
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: session.user.id
        },
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      ...conversation,
      partner: session.user.userType === 'LANDLORD' 
        ? conversation.student 
        : conversation.landlord
    })
  } catch (error) {
    console.error('[CONVERSATION_GET]', error)
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    )
  }
}