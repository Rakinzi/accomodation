// /api/admin/notifications/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.userType !== 'ADMIN' && session.user.userType !== 'LANDLORD')) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const type = searchParams.get('type')
    const unread = searchParams.get('unread') === 'true'
    const propertyId = searchParams.get('propertyId')
    
    // Build where clause
    const where = {
      type,
      // If user is LANDLORD, only show notifications for their properties
      ...(session.user.userType === 'LANDLORD' && {
        OR: [
          { recipientId: session.user.id },
          {
            metadata: {
              contains: session.user.id
            }
          }
        ]
      }),
      ...(unread && { read: false }),
      ...(propertyId && {
        metadata: {
          contains: propertyId
        }
      })
    }
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to prevent excessive data loading
    })
    
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error)
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}