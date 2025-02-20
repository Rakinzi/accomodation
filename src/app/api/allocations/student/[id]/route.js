// app/api/allocations/student/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
    try {
        const { id } = await params

        if (!id) {
            return NextResponse.json(
                { message: 'Student ID is required' },
                { status: 400 }
            )
        }

        // Find the active occupancy for the student
        const allocation = await prisma.occupant.findFirst({
            where: {
                userId: id,
                status: 'ACTIVE',
            },
            include: {
                property: {
                    select: {
                        id: true,
                        location: true,
                        price: true,
                        bedrooms: true,
                        bathrooms: true,
                        description: true,
                        amenities: true,
                        sharing: true,
                        maxOccupants: true,
                        currentOccupants: true,
                        images: {
                            select: {
                                url: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!allocation) {
            return NextResponse.json(
                { message: 'No active room allocation found' },
                { status: 404 }
            )
        }

        // Format dates in YYYY-MM-DD HH:MM:SS format
        const formatDate = (date) => {
            return date ? new Date(date).toISOString().slice(0, 19).replace('T', ' ') : null
        }

        // Format the response
        const formattedAllocation = {
            id: allocation.id,
            status: allocation.status,
            startDate: formatDate(allocation.startDate),
            endDate: formatDate(allocation.endDate),
            numberOfRooms: allocation.numberOfRooms,
            monthlyRent: allocation.totalPrice,
            property: {
                location: allocation.property.location,
                bedrooms: allocation.property.bedrooms,
                bathrooms: allocation.property.bathrooms,
                description: allocation.property.description,
                amenities: JSON.parse(allocation.property.amenities),
                sharing: allocation.property.sharing,
                maxOccupants: allocation.property.maxOccupants,
                currentOccupants: allocation.property.currentOccupants,
                images: allocation.property.images.map(img => img.url)
            },
            student: {
                name: allocation.user.name,
                email: allocation.user.email
            }
        }

        return NextResponse.json(formattedAllocation)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        )
    }
}