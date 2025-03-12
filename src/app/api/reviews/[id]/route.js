// /api/reviews/[id]/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// UPDATE a review
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const reviewId = params.id
    const { rating, comment } = await request.json()

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    })

    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      )
    }

    // Check if the user is the owner of the review
    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { message: "You can only edit your own reviews" },
        { status: 403 }
      )
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment: comment || "",
        updatedAt: new Date()
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
      { message: "Failed to update review" },
      { status: 500 }
    )
  }
}

// DELETE a review
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const reviewId = params.id

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    })

    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      )
    }

    // Check if the user is the owner of the review
    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { message: "You can only delete your own reviews" },
        { status: 403 }
      )
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId }
    })

    return NextResponse.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("[REVIEW_DELETE]", error)
    return NextResponse.json(
      { message: "Failed to delete review" },
      { status: 500 }
    )
  }
}