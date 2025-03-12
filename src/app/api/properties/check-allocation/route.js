import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const userId = url.searchParams.get('userId');
    
    if (!propertyId || !userId) {
      return NextResponse.json(
        { isActive: false, occupant: null }
      );
    }
    
    // Find active occupant with property details
    const occupant = await prisma.occupant.findFirst({
      where: {
        propertyId,
        userId,
        status: "ACTIVE",
      },
      include: {
        property: {
          select: {
            roomSharing: true,
            tenantsPerRoom: true,
            bedrooms: true,
            price: true
          }
        }
      }
    });
    
    return NextResponse.json({
      isActive: Boolean(occupant),
      occupant: occupant
    });
  } catch (error) {
    console.error("Error in check-allocation:", error);
    return NextResponse.json({
      isActive: false,
      occupant: null
    });
  }
}