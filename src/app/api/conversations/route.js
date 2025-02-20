import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "../auth/[...nextauth]/route"

// GET /api/conversations - Get all conversations for current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view conversations" },
        { status: 401 }
      )
    }

    const conversations = await prisma.conversation.findMany({
      where: session.user.userType === 'LANDLORD'
        ? { landlordId: session.user.id }
        : { studentId: session.user.id },
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
            price: true,
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
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: {
                  not: session.user.id
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      partner: session.user.userType === 'LANDLORD' ? conv.student : conv.landlord,
      property: conv.property,
      messages: conv.messages,
      unreadCount: conv._count.messages,
      updatedAt: conv.updatedAt
    }))

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error('[CONVERSATIONS_GET]', error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

// POST /api/conversations - Start a new conversation (for students)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to start a conversation" },
        { status: 401 }
      )
    }

    if (session.user.userType !== 'STUDENT') {
      return NextResponse.json(
        { error: "Only students can initiate conversations" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, propertyId } = body

    if (!propertyId || !content?.trim()) {
      return NextResponse.json(
        { error: "Property ID and message content are required" },
        { status: 400 }
      )
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { 
        id: true,
        ownerId: true,
        status: true
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      )
    }

    if (property.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: "This property is not available for inquiries" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check for existing conversation
      let conversation = await tx.conversation.findFirst({
        where: {
          studentId: session.user.id,
          landlordId: property.ownerId,
          propertyId: property.id
        }
      })

      if (conversation) {
        // Add message to existing conversation
        const message = await tx.message.create({
          data: {
            content,
            senderId: session.user.id,
            conversationId: conversation.id
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
        })

        await tx.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
        })

        return { conversationId: conversation.id, message }
      }

      // Create new conversation and message
      conversation = await tx.conversation.create({
        data: {
          studentId: session.user.id,
          landlordId: property.ownerId,
          propertyId: property.id,
          messages: {
            create: {
              content,
              senderId: session.user.id
            }
          }
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          landlord: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      return { 
        conversationId: conversation.id, 
        conversation
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[CONVERSATION_POST]', error)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}