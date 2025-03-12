// /api/allocations/leave/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, occupantId } = body

    if (!propertyId || !occupantId) {
      return NextResponse.json(
        { message: 'Property ID and Occupant ID are required' },
        { status: 400 }
      )
    }

    // Verify that this occupant belongs to the current user
    const occupant = await prisma.occupant.findFirst({
      where: {
        id: occupantId,
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        user: true
      }
    })

    if (!occupant) {
      return NextResponse.json(
        { message: 'Occupant not found or not active' },
        { status: 404 }
      )
    }

    // Perform the update in a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update occupant status
      const updatedOccupant = await tx.occupant.update({
        where: { id: occupantId },
        data: {
          status: 'INACTIVE',
          endDate: new Date()
        }
      })

      // Decrease current occupants count for the property
      const updatedProperty = await tx.property.update({
        where: { id: propertyId },
        data: {
          currentOccupants: {
            decrement: 1
          }
        }
      })

      // Create notification for landlord
      const notification = await tx.notification.create({
        data: {
          type: 'TENANT_LEFT',
          title: 'Student Left Room',
          message: `${occupant.user.name || 'A student'} has left room ${occupant.roomNumber} at ${occupant.property.location}`,
          read: false,
          recipientId: occupant.property.owner.id,
          metadata: JSON.stringify({
            studentId: occupant.user.id,
            studentName: occupant.user.name || 'A student',
            propertyId: occupant.property.id,
            propertyLocation: occupant.property.location,
            roomNumber: occupant.roomNumber,
            landlordId: occupant.property.owner.id
          })
        }
      })

      return { updatedOccupant, updatedProperty, notification }
    })

    return NextResponse.json({
      message: 'Successfully left room',
      occupant: result.updatedOccupant
    })
  } catch (error) {
    console.error('[LEAVE_ROOM]', error)
    return NextResponse.json(
      { message: error.message || 'Failed to leave room' },
      { status: 500 }
    )
  }
}