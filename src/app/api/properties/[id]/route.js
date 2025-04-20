import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request, { params }) {
  try {
    // Log what we received to help debug
    console.log("API route called with params:", params);
    const { id } = await params;
    
    if (!id) {
      console.log("No ID provided");
      return NextResponse.json({ message: "Property ID is required" }, { status: 400 });
    }
    
    // Check if the property exists at all first
    const propertyExists = await prisma.property.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (!propertyExists) {
      console.log(`Property with ID ${id} not found`);
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }
    
    // Now fetch the full property with all related data
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        media: true,
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        occupants: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                gender: true,
                religion: true
              }
            }
          }
        },
        _count: {
          select: { 
            reviews: true,
            messages: true 
          }
        }
      }
    });
    
    console.log("Found property:", property ? "Yes" : "No");
    
    // Create a safe response structure with default values
    const safeResponse = {
      id: property.id,
      price: property.price || 0,
      location: property.location || "Unknown location",
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      description: property.description || "",
      amenities: property.amenities || "[]",
      status: property.status || "AVAILABLE",
      roomSharing: property.roomSharing || false,
      tenantsPerRoom: property.tenantsPerRoom || 1,
      gender: property.gender || "ANY",
      religion: property.religion || "ANY",
      currentOccupants: property.currentOccupants || 0,
      deposit: property.deposit || 0,
      latitude: property.latitude || 0,
      longitude: property.longitude || 0,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      // Use any media relation available - prefer media over images
      media: property.media || property.images || [],
      // Owner might be null if the relation doesn't exist
      owner: property.owner || { 
        id: "unknown", 
        name: "Unknown Owner", 
        email: "unknown@example.com"
      },
      // Occupants might be empty if none exist
      occupants: property.occupants || [],
      // Count data or fallback
      _count: property._count || { reviews: 0, messages: 0 }
    };
    
    console.log("Safe response created with media count:", safeResponse.media.length);
    
    // Always return a valid object
    return NextResponse.json(safeResponse);
    
  } catch (error) {
    console.error("ERROR in property API route:", error.stack);
    // Return a valid object even in case of error
    return NextResponse.json({ 
      message: "Error fetching property", 
      error: error.message 
    }, { status: 500 });
  }
}
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = params

    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      media = [],
      amenities = [],
      roomSharing = false,
      gender = 'ANY',
      religion = 'ANY',
      maxOccupants = 1,
      deposit = 0,
      ...propertyData
    } = body

    // Verify ownership
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: {
        ownerId: true,
        currentOccupants: true
      }
    })

    if (!existingProperty) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      )
    }

    if (existingProperty.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    if (parseInt(maxOccupants) < (existingProperty.currentOccupants || 0)) {
      return NextResponse.json(
        { message: "Cannot reduce max occupants below current occupants" },
        { status: 400 }
      )
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        ...propertyData,
        price: parseFloat(propertyData.price || 0),
        deposit: parseFloat(deposit || 0),
        bedrooms: parseInt(propertyData.bedrooms || 1),
        bathrooms: parseInt(propertyData.bathrooms || 1),
        amenities: JSON.stringify(amenities),
        roomSharing: Boolean(roomSharing),
        gender,
        religion,
        maxOccupants: parseInt(maxOccupants || 1),
        // Update media if provided
        ...(media.length > 0 && {
          media: {
            deleteMany: {},
            create: media.map(item => ({
              url: item.url,
              type: item.type || 'image'
            }))
          }
        })
      },
      include: {
        media: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        occupants: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                gender: true,
                religion: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: "Property updated successfully",
      data: updatedProperty
    })

  } catch (error) {
    console.error('[PROPERTY_UPDATE]', error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    )
  }
}