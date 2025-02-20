import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const messages = await prisma.message.findMany({
      where: {
        property: {
          ownerId: session.user.id
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            location: true,
            status: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const conversations = messages.reduce((acc, message) => {
      const key = `${message.property.id}_${message.sender.id}`

      if (!acc[key]) {
        acc[key] = {
          property: message.property,
          messages: [],
          unreadCount: 0,
          partner: message.sender,
          lastActivity: message.createdAt
        }
      }

      acc[key].messages.push({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        propertyId: message.propertyId,
        createdAt: message.createdAt,
        isRead: message.isRead,
        sender: message.sender
      })

      if (!message.isRead && message.senderId !== session.user.id) {
        acc[key].unreadCount++
      }

      if (new Date(message.createdAt) > new Date(acc[key].lastActivity)) {
        acc[key].lastActivity = message.createdAt
      }

      return acc
    }, {})

    Object.values(conversations).forEach(conversation => {
      conversation.messages.sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
      )
    })

    const sortedConversations = Object.values(conversations).sort((a, b) =>
      new Date(b.lastActivity) - new Date(a.lastActivity)
    )

    return NextResponse.json(sortedConversations)

  } catch (error) {
    console.error('[LANDLORD_MESSAGES_GET]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}