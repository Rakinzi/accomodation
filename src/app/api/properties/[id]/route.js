import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    const {id} = await params
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const property = await prisma.property.findUnique({
      where: { id: id },
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      )
    }

    if (property.ownerId !== session.user.id && session.user.userType !== 'STUDENT') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error('[PROPERTY_GET]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    const {id} = await params
    console.log("ID Backend", id)
    // Auth check
    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      )
    }

    if (!body) {
      return NextResponse.json(
        { message: "Request body is required" },
        { status: 400 }
      )
    }

    const { images = [], ...propertyData } = body

    // Validate property exists and check ownership
    const existingProperty = await prisma.property.findUnique({
      where: { id: id },
      select: { ownerId: true }
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

    

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: id },
      data: {
        ...propertyData,
        images: {
          deleteMany: {},
          create: images.map(image => ({
            url: image.url
          }))
        }
      },
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
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
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.userType !== 'LANDLORD') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id: params.id },
      select: { ownerId: true }
    })

    if (!existingProperty || existingProperty.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    await prisma.property.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: "Property deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error('[PROPERTY_DELETE]', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}