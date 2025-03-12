import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only landlords can unallocate rooms
    if (session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Only landlords can perform this action" },
        { status: 403 }
      );
    }

    const { propertyId, userId } = await request.json();

    if (!propertyId || !userId) {
      return NextResponse.json(
        { message: "Property ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify property exists and belongs to the landlord
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true }
    });

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    // Verify the current user is the owner of the property
    if (property.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "You are not authorized to manage this property" },
        { status: 403 }
      );
    }

    // Find the active occupancy
    const occupant = await prisma.occupant.findFirst({
      where: {
        propertyId,
        userId,
        status: "ACTIVE"
      }
    });

    if (!occupant) {
      return NextResponse.json(
        { message: "No active occupancy found for this user and property" },
        { status: 404 }
      );
    }

    // Use a transaction to update both the occupant status and property status
    const [updatedOccupant, updatedProperty] = await prisma.$transaction([
      // Update occupant status to INACTIVE
      prisma.occupant.update({
        where: { id: occupant.id },
        data: {
          status: "INACTIVE",
          endDate: new Date()
        }
      }),
      
      // Decrement the currentOccupants and update property status
      prisma.property.update({
        where: { id: propertyId },
        data: {
          currentOccupants: {
            decrement: 1
          },
          // If property was RENTED, set it back to AVAILABLE
          status: "AVAILABLE"
        }
      })
    ]);

    return NextResponse.json({
      message: "Room allocation removed successfully",
      data: {
        occupant: updatedOccupant,
        property: updatedProperty
      }
    });

  } catch (error) {
    console.error("Error in unallocate room:", error);
    return NextResponse.json(
      { message: "Failed to unallocate room", error: error.message },
      { status: 500 }
    );
  }
}