// /api/admin/notifications/mark-all-read/route.js
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

    // Only mark notifications as read that the user should have access to
    const updateResult = await prisma.notification.updateMany({
      where: {
        read: false,
        type: 'TENANT_LEFT',
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
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({
      message: "All notifications marked as read",
      count: updateResult.count
    })
  } catch (error) {
    console.error('[NOTIFICATIONS_MARK_ALL_READ]', error)
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}