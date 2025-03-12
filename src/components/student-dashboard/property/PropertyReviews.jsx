"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Star,
  StarHalf,
  MessageSquare,
  Calendar,
  User,
  Trash2,
  Edit,
  Info,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export function PropertyReviews({ propertyId }) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState([])
  const [userReview, setUserReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [editing, setEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  
  useEffect(() => {
    if (propertyId) {
      fetchReviews()
    }
  }, [propertyId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?propertyId=${propertyId}`)
      
      // Handle any response without showing errors to the user
      if (!response.ok) {
        console.error("Error fetching reviews:", response.status)
        setReviews([])
        setLoading(false)
        return
      }
      
      const data = await response.json()
      
      // Handle different response structures
      const reviewsData = Array.isArray(data) 
        ? data 
        : (data.reviews || [])
      
      // Calculate average rating
      const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0)
      const avg = reviewsData.length > 0 
        ? (totalRating / reviewsData.length).toFixed(1) 
        : 0
      setAverageRating(avg)
      
      // Find the user's review if they've left one
      const userRev = reviewsData.find(review => review.userId === session?.user?.id)
      if (userRev) {
        setUserReview(userRev)
        setRating(userRev.rating)
        setComment(userRev.comment)
      }
      
      setReviews(reviewsData)
    } catch (error) {
      // Log the error but don't show it to the user
      console.error("Error fetching reviews:", error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    try {
      setSubmitting(true)
      
      const url = userReview 
        ? `/api/reviews/${userReview.id}` 
        : '/api/reviews'
      
      const method = userReview ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId,
          rating,
          comment
        })
      })

      if (!response.ok) {
        console.error("Error submitting review:", await response.text())
        toast.error("Could not submit review. Please try again.")
        return
      }
      
      toast.success(userReview ? "Review updated" : "Review submitted")
      setEditing(false)
      fetchReviews()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Could not submit review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!userReview) return
    
    try {
      setSubmitting(true)
      const response = await fetch(`/api/reviews/${userReview.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        console.error("Error deleting review:", await response.text())
        toast.error("Could not delete review. Please try again.")
        return
      }
      
      toast.success("Review deleted")
      setUserReview(null)
      setRating(0)
      setComment("")
      fetchReviews()
    } catch (error) {
      console.error("Error deleting review:", error)
      toast.error("Could not delete review. Please try again.")
    } finally {
      setSubmitting(false)
      setDeleteDialogOpen(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (name) => {
    if (!name) return "?"
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const renderStars = (ratingValue) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {ratingValue >= star ? (
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ) : ratingValue >= star - 0.5 ? (
              <StarHalf className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ) : (
              <Star className="w-5 h-5 text-zinc-300" />
            )}
          </span>
        ))}
      </div>
    )
  }

  // Interactive rating selector
  const StarRating = () => {
    return (
      <div className="flex items-center mb-4">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              <Star 
                className={`w-8 h-8 transition-all ${
                  (hoveredRating || rating) >= star 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-zinc-300"
                }`} 
              />
            </button>
          ))}
        </div>
        <span className="ml-2 text-zinc-600 dark:text-zinc-400">
          {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
        </span>
      </div>
    )
  }

  // Check if user is a student
  const isStudent = session?.user?.userType === 'STUDENT'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sky-500" />
            Reviews & Ratings
          </h3>
          {reviews.length > 0 ? (
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {renderStars(parseFloat(averageRating))}
                <span className="ml-2 font-semibold text-lg">{averageRating}</span>
              </div>
              <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">No reviews yet</p>
          )}
        </div>

        {isStudent && !userReview && !editing && (
          <Button 
            onClick={() => setEditing(true)}
            className="bg-sky-500 hover:bg-sky-600"
          >
            Write a Review
          </Button>
        )}
        
        {isStudent && userReview && !editing && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Review
            </Button>
            <Button 
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:border-red-200"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {editing && isStudent && (
        <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-sky-100 dark:border-sky-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {userReview ? 'Edit Your Review' : 'Write a Review'}
            </CardTitle>
            <CardDescription>
              Share your experience with this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StarRating />
            <Textarea 
              placeholder="Write your review here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-24"
            />
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditing(false)
                if (userReview) {
                  setRating(userReview.rating)
                  setComment(userReview.comment)
                } else {
                  setRating(0)
                  setComment("")
                }
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              className="bg-sky-500 hover:bg-sky-600"
              onClick={handleSubmitReview}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isStudent && session?.user && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 flex items-center gap-3">
          <Info className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Only students can review properties.
          </p>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className={`bg-white dark:bg-zinc-800 rounded-xl p-5 shadow-sm ${
                review.userId === session?.user?.id 
                  ? 'ring-1 ring-sky-200 dark:ring-sky-800' 
                  : 'border border-zinc-100 dark:border-zinc-700'
              }`}
            >
              <div className="flex justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                      {getInitials(review.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {review.user.name}
                      {review.userId === session?.user?.id && (
                        <span className="ml-2 text-xs text-sky-500 font-normal">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(review.createdAt)}
                      </span>
                      {review.createdAt !== review.updatedAt && (
                        <span className="text-xs">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <p className="mt-3 text-zinc-700 dark:text-zinc-300">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      ) : !loading && !editing && (
        <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
          <MessageSquare className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">No reviews yet</p>
          {isStudent && (
            <Button 
              className="mt-4 bg-sky-500 hover:bg-sky-600"
              onClick={() => setEditing(true)}
            >
              Be the first to review
            </Button>
          )}
        </div>
      )}

      {/* Delete review confirmation dialog */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}