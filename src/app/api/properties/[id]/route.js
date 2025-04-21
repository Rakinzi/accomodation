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
    
    const property = await prisma.property.findUnique({
      where: { id },
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
        },
        _count: {
          select: { 
            reviews: true,
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
      // Include both fields for compatibility
      media: property.media || [], 
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

    // Get the request body
    const body = await request.json()
    
    // Extract and rename fields as needed while removing fields not in schema
    const {
      media = [],
      sharing, // This field needs to be removed/renamed
      maxOccupants, // This field needs to be removed/renamed
      gender = 'ANY',
      religion = 'ANY',
      deposit = 0,
      price,
      location,
      bedrooms,
      bathrooms,
      description,
      amenities,
      status,
      ...restBody // Any other fields in the body
    } = body

    // Handle amenities formatting
    const formattedAmenities = typeof amenities === 'string' 
      ? amenities 
      : JSON.stringify(amenities || [])

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

    // Set tenantsPerRoom from maxOccupants or default
    const tenantsPerRoom = parseInt(maxOccupants || "1")

    // Validate tenantsPerRoom against current occupants
    if (tenantsPerRoom < (existingProperty.currentOccupants || 0)) {
      return NextResponse.json(
        { message: "Cannot reduce maximum occupants below current occupants" },
        { status: 400 }
      )
    }

    // Update the property with transaction to handle media properly
    const updatedProperty = await prisma.$transaction(async (prismaClient) => {
      // First, delete all existing media for this property
      await prismaClient.media.deleteMany({
        where: { propertyId: id }
      });

      // Then update the property with new data and create new media entries
      return prismaClient.property.update({
        where: { id },
        data: {
          // Include only the fields that exist in the schema
          price: parseFloat(price || 0),
          location: location || "",
          bedrooms: parseInt(bedrooms || 1),
          bathrooms: parseInt(bathrooms || 1),
          description: description || "",
          amenities: formattedAmenities,
          status: status || "AVAILABLE",
          deposit: parseFloat(deposit || 0),
          // Map form fields to schema fields
          roomSharing: Boolean(sharing), // Use the 'sharing' value for 'roomSharing'
          tenantsPerRoom: tenantsPerRoom,
          gender,
          religion,
          // Create new media entries
          media: {
            create: media.map(item => ({
              url: item.url,
              type: item.type || 'image' // Default to 'image' for backward compatibility
            }))
          }
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
      });
    });

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

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = params

    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify ownership
    const property = await prisma.property.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      )
    }

    if (property.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Delete property (this will cascade to delete all related media)
    await prisma.property.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Property deleted successfully"
    })
  } catch (error) {
    console.error('[PROPERTY_DELETE]', error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    )
  }
}