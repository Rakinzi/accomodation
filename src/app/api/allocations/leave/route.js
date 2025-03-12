// /api/allocations/leave/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    // Step 1: Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Step 2: Get request body
    const body = await request.json();
    const { occupantId } = body;
    
    if (!occupantId) {
      return NextResponse.json({ message: "Occupant ID is required" }, { status: 400 });
    }
    
    // Step 3: Find the occupant
    const occupant = await prisma.occupant.findFirst({
      where: {
        id: occupantId,
        userId: session.user.id,
        status: "ACTIVE"
      },
      include: {
        property: true,
        user: true
      }
    });
    
    if (!occupant) {
      return NextResponse.json({ message: "No active occupancy found" }, { status: 404 });
    }
    
    // Check if an INACTIVE record already exists
    const existingInactive = await prisma.occupant.findFirst({
      where: {
        userId: session.user.id,
        propertyId: occupant.propertyId,
        status: "INACTIVE"
      }
    });
    
    if (existingInactive) {
      // If there's already an inactive record, we'll need to delete it first
      await prisma.occupant.delete({
        where: { id: existingInactive.id }
      });
    }
    
    // Step 4: Update occupant
    const updatedOccupant = await prisma.occupant.update({
      where: { id: occupantId },
      data: {
        status: "INACTIVE",
        endDate: new Date()
      }
    });
    
    // Step 5: Update property
    const updatedProperty = await prisma.property.update({
      where: { id: occupant.propertyId },
      data: {
        currentOccupants: {
          decrement: 1
        }
      }
    });
    
    // Step 6: Create notification
    const notification = await prisma.notification.create({
      data: {
        type: 'TENANT_LEFT',
        title: 'Student Left Room',
        message: `${occupant.user.name || 'A student'} has left room ${occupant.roomNumber} at ${occupant.property.location}`,
        read: false,
        recipientId: occupant.property.ownerId,
        metadata: JSON.stringify({
          studentId: occupant.user.id,
          studentName: occupant.user.name || 'A student',
          propertyId: occupant.propertyId,
          propertyLocation: occupant.property.location,
          roomNumber: occupant.roomNumber,
          landlordId: occupant.property.ownerId
        })
      }
    });
    
    // Step 7: Return success response
    return NextResponse.json({
      message: "Successfully left room",
      data: {
        occupant: updatedOccupant
      }
    });
  } catch (error) {
    console.error("Leave room error:", error);
    return NextResponse.json({ 
      message: "Failed to leave room", 
      error: error.message 
    }, { status: 500 });
  }
}