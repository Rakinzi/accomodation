// /api/admin/notifications/mark-read/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.userType !== 'ADMIN' && session.user.userType !== 'LANDLORD')) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds } = body

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { message: "Invalid request. notificationIds array is required" },
        { status: 400 }
      )
    }

    // Only allow the user to mark notifications that they should have access to
    const notifications = await prisma.notification.findMany({
      where: {
        id: { in: notificationIds },
        ...(session.user.userType === 'LANDLORD' && {
          OR: [
            { recipientId: session.user.id },
            {
              metadata: {
                contains: session.user.id
              }
            }
          ]
        })
      }
    })

    const allowedIds = notifications.map(notification => notification.id)

    // Mark notifications as read
    const updateResult = await prisma.notification.updateMany({
      where: {
        id: { in: allowedIds }
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({
      message: "Notifications marked as read",
      count: updateResult.count
    })
  } catch (error) {
    console.error('[NOTIFICATIONS_MARK_READ]', error)
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}