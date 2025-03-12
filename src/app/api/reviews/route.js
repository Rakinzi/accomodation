import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const propertyId = searchParams.get("propertyId")
     
        if (!propertyId) {
            return NextResponse.json(
                { message: "Property ID is required" },
                { status: 400 }
            )
        }

        // Verify property exists first
        const property = await prisma.property.findUnique({
            where: {
                id: propertyId
            }
        })

        if (!property) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            )
        }

        // Get reviews (may be empty array)
        const reviews = await prisma.review.findMany({
            where: {
                propertyId: propertyId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        userType: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Return success response with reviews array (empty if none found)
        return NextResponse.json({
            propertyId,
            totalReviews: reviews.length,
            averageRating: reviews.length > 0 
                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                : 0,
            reviews
        })

    } catch (error) {

        return NextResponse.json(
            { 
                message: "Failed to fetch reviews",
                error: error.message 
            },
            { status: 500 }
        )
    }
}
// CREATE a new review
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)
        
        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        // Only students can review properties
        if (session.user.userType !== "STUDENT") {
            return NextResponse.json(
                { message: "Only students can review properties" },
                { status: 403 }
            )
        }

        const { propertyId, rating, comment } = await request.json()

        // Validate input
        if (!propertyId) {
            return NextResponse.json(
                { message: "Property ID is required" },
                { status: 400 }
            )
        }

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { message: "Rating must be between 1 and 5" },
                { status: 400 }
            )
        }

        // Check if user has already reviewed this property
        const existingReview = await prisma.review.findFirst({
            where: {
                propertyId,
                userId: session.user.id
            }
        })

        if (existingReview) {
            return NextResponse.json(
                { message: "You have already reviewed this property. Please edit your existing review." },
                { status: 400 }
            )
        }

        // Create review
        const review = await prisma.review.create({
            data: {
                rating,
                comment: comment || "",
                user: {
                    connect: {
                        id: session.user.id
                    }
                },
                property: {
                    connect: {
                        id: propertyId
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        userType: true
                    }
                }
            }
        })

        return NextResponse.json(review)
    } catch (error) {
        console.error("[REVIEW_CREATE]", error)
        return NextResponse.json(
            { 
                message: "Failed to create review", 
                error: error.message 
            },
            { status: 500 }
        )
    }
}

// UPDATE a review
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions)
        
        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const reviewId = searchParams.get("reviewId")

        if (!reviewId) {
            return NextResponse.json(
                { message: "Review ID is required" },
                { status: 400 }
            )
        }

        const { rating, comment } = await request.json()

        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { message: "Rating must be between 1 and 5" },
                { status: 400 }
            )
        }

        // Check if review exists and belongs to the user
        const existingReview = await prisma.review.findFirst({
            where: {
                id: reviewId,
                userId: session.user.id
            }
        })

        if (!existingReview) {
            return NextResponse.json(
                { message: "Review not found or unauthorized" },
                { status: 404 }
            )
        }

        // Update review
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating,
                comment: comment || ""
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        userType: true
                    }
                }
            }
        })

        return NextResponse.json(updatedReview)
    } catch (error) {
        console.error("[REVIEW_UPDATE]", error)
        return NextResponse.json(
            { 
                message: "Failed to update review", 
                error: error.message 
            },
            { status: 500 }
        )
    }
}

// DELETE a review
export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions)
        
        // Check if user is authenticated
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const reviewId = searchParams.get("reviewId")

        if (!reviewId) {
            return NextResponse.json(
                { message: "Review ID is required" },
                { status: 400 }
            )
        }

        // Check if review exists and belongs to the user
        const existingReview = await prisma.review.findFirst({
            where: {
                id: reviewId,
                userId: session.user.id
            }
        })

        if (!existingReview) {
            return NextResponse.json(
                { message: "Review not found or unauthorized" },
                { status: 404 }
            )
        }

        // Delete review
        await prisma.review.delete({
            where: { id: reviewId }
        })

        return NextResponse.json({ message: "Review deleted successfully" })
    } catch (error) {
        console.error("[REVIEW_DELETE]", error)
        return NextResponse.json(
            { 
                message: "Failed to delete review", 
                error: error.message 
            },
            { status: 500 }
        )
    }
}