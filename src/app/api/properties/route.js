import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(request) {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session || session.user.userType !== 'LANDLORD') {
        return new NextResponse("Unauthorized", { status: 401 })
      }
  
      const body = await request.json()
      const { price, location, bedrooms, bathrooms, description, amenities, images } = body
  
      const property = await prisma.property.create({
        data: {
          price: parseFloat(price),
          location,
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          description,
          amenities: JSON.stringify(amenities), // Convert array to JSON string
          owner: {
            connect: {
              id: session.user.id
            }
          },
          images: {
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
  
      return NextResponse.json(property)
    } catch (error) {
      console.error('Property creation error:', error)
      return new NextResponse("Internal Error", { status: 500 })
    }
  }

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    const properties = await prisma.property.findMany({
      where: ownerId ? {
        ownerId
      } : undefined,
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(properties)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}