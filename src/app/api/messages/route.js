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
                            ownerId: session.user.id
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
                createdAt: 'desc' // Changed to desc to get latest messages first
            }
        })

        // Group messages by conversation
        const conversations = messages.reduce((acc, message) => {
            const isOwner = message.property.owner.id === session.user.id
            const conversationPartnerId = isOwner ? message.senderId : message.property.owner.id

            if (!acc[conversationPartnerId]) {
                acc[conversationPartnerId] = {
                    owner: isOwner ? message.sender : message.property.owner,
                    messages: [],
                    unreadCount: 0,
                    property: message.property
                }
            }

            // Add message to conversation
            acc[conversationPartnerId].messages.push(message)

            // Update unread count
            if (!message.isRead && message.senderId !== session.user.id) {
                acc[conversationPartnerId].unreadCount++
            }

            return acc
        }, {})

        // Sort messages within each conversation by date
        Object.values(conversations).forEach(conversation => {
            conversation.messages.sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
            )
        })

        return NextResponse.json(conversations)
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