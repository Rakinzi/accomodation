// src/app/api/messages/route.js
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "../auth/[...nextauth]/route"


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          {
            property: {
              OR: [
                { ownerId: session.user.id },
                {
                  messages: {
                    some: {
                      senderId: session.user.id
                    }
                  }
                }
              ]
            }
          }
        ]
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

    // Group messages by property
    const conversations = messages.reduce((acc, message) => {
      const propertyId = message.property.id

      if (!acc[propertyId]) {
        // Initialize conversation for this property
        acc[propertyId] = {
          property: message.property,
          messages: [],
          unreadCount: 0,
          // If current user is property owner, we'll show student info and vice versa
          owner: message.property.owner.id === session.user.id
            ? message.sender  // Show student info if user is landlord
            : message.property.owner, // Show landlord info if user is student
          lastActivity: message.createdAt
        }
      }

      // Add message to conversation
      acc[propertyId].messages.push({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        propertyId: message.propertyId,
        createdAt: message.createdAt,
        isRead: message.isRead,
        sender: message.sender
      })

      // Update unread count
      if (!message.isRead && message.senderId !== session.user.id) {
        acc[propertyId].unreadCount++
      }

      // Update last activity if this message is more recent
      if (new Date(message.createdAt) > new Date(acc[propertyId].lastActivity)) {
        acc[propertyId].lastActivity = message.createdAt
      }

      return acc
    }, {})

    // Sort messages within each conversation by date (oldest first)
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
    console.error('[MESSAGES_GET]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, propertyId } = body

    if (!content || !propertyId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        propertyId
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
            owner: {
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

    return NextResponse.json({
      message: "Message sent successfully",
      data: message
    })

  } catch (error) {
    console.error('[MESSAGE_POST]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}