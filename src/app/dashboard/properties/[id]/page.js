"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Carousel } from "@/components/dashboard/Carousel"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { 
  BedSingleIcon, 
  ShowerHead, 
  MapPinIcon, 
  EditIcon, 
  ArrowLeftIcon,
  Share2Icon,
  HeartIcon,
  CalendarIcon,
  StarIcon,
  Users2Icon,
  CircleDollarSignIcon,
  MessageCircleIcon,
  CheckCircle2Icon
} from "lucide-react"


export default function PropertyDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${id}`)
        if (!response.ok) throw new Error('Failed to fetch property')
        const data = await response.json()
        setProperty(data)
        setError(null)
      } catch (error) {
        console.error('Error:', error)
        setError('Failed to load property')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProperty()
  }, [id])

  const shareProperty = () => {
    if (!property) return
    navigator.share({
      title: `Check out this property in ${property.location}`,
      text: `${property.bedrooms} bed, ${property.bathrooms} bath for R${property.price}`,
      url: window.location.href
    }).catch(console.error)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || 'Property not found'}</p>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const amenities = JSON.parse(property.amenities)

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 backdrop-blur-md bg-white/75 dark:bg-zinc-900/75 -mx-6 px-6 py-4 flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-pink-50 dark:hover:bg-pink-900"
              onClick={() => {}}
            >
              <HeartIcon className="h-5 w-5 text-pink-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={shareProperty}
            >
              <Share2Icon className="h-5 w-5" />
            </Button>
            {session?.user?.id === property.ownerId && (
              <Button
                onClick={() => router.push(`/dashboard/properties/${id}/edit`)}
                className="bg-sky-500 hover:bg-sky-600"
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Property
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl">
            <div className="relative aspect-[16/9]">
            <Carousel images={property.images} interval={3000} />
            </div>

            <div className="p-8 space-y-8">
              {/* Property Header */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-sky-500 hover:bg-sky-600">
                    {property.status}
                  </Badge>
                  {property.sharing && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users2Icon className="h-4 w-4" />
                      Shared Accommodation
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold">{property.location}</h1>
                <p className="text-4xl font-bold text-sky-500 dark:text-sky-400">
                  R{property.price.toLocaleString()}
                  <span className="text-base font-normal text-zinc-500">/month</span>
                </p>
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: BedSingleIcon, label: 'Bedrooms', value: property.bedrooms },
                  { icon: ShowerHead, label: 'Bathrooms', value: property.bathrooms },
                  { icon: MapPinIcon, label: 'Location', value: property.location.split(',')[0] },
                  { icon: Users2Icon, label: 'Max Occupants', value: property.sharing ? `${property.currentOccupants}/${property.maxOccupants}` : '1' }
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                    <Icon className="h-5 w-5 text-sky-500 mb-2" />
                    <p className="text-sm text-zinc-500">{label}</p>
                    <p className="font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Sharing Details */}
              {property.sharing && (
                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-6 space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users2Icon className="h-5 w-5" />
                    Sharing Preferences
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg">
                      <p className="text-sm text-zinc-500">Preferred Gender</p>
                      <p className="font-semibold">{property.gender}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg">
                      <p className="text-sm text-zinc-500">Preferred Religion</p>
                      <p className="font-semibold">{property.religion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* About */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">About this property</h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">What this place offers</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity) => (
                    <div 
                      key={amenity}
                      className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                    >
                      <CheckCircle2Icon className="h-4 w-4 text-sky-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="p-6 border-none shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                    <Users2Icon className="h-6 w-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{property.owner.name}</p>
                    <p className="text-sm text-zinc-500">Property Owner</p>
                  </div>
                </div>
                <Button className="w-full bg-sky-500 hover:bg-sky-600">
                  <MessageCircleIcon className="h-4 w-4 mr-2" />
                  Contact Owner
                </Button>
              </div>
            </Card>

            {/* Quick Info Card */}
            <Card className="p-6 border-none shadow-xl space-y-4">
              <h3 className="font-semibold">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CircleDollarSignIcon className="h-4 w-4 text-sky-500" />
                  <span>Deposit Required</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-sky-500" />
                  <span>Available Immediately</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}