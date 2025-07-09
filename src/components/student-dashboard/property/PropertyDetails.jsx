// Fixed PropertyDetails.jsx with OpenStreetMap and Carousel
"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ContactDialog } from "./ContactDialog"
import { PropertyReviews } from "./PropertyReviews"
import {
  HeartIcon,
  BedSingleIcon,
  ShowerHead,
  MapPinIcon,
  Share2Icon,
  Users2Icon,
  ChevronLeftIcon,
  MessageSquareIcon,
  DollarSign,
  Star,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Pause,
  Phone,
  Mail,
  Calendar,
  Home,
  Wifi,
  Car,
  Coffee,
  Bath,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Volume2,
  VolumeX,
  MoreVertical,
  Download,
  Eye,
  ThumbsUp,
  MessageCircle,
  MapPin,
  Clock,
  Shield,
  Zap,
  Navigation,
  Building,
  Sparkles,
  Grid3X3,
  Maximize2,
  Minimize2
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

// Fullscreen Media Viewer
const FullscreenMediaViewer = ({ isOpen, onClose, media, currentIndex, setCurrentIndex }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length)
  }

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
  }

  const currentMedia = media[currentIndex]

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevMedia()
      if (e.key === 'ArrowRight') nextMedia()
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10 rounded-full p-3"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation */}
      {media.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMedia}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10 rounded-full p-3"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMedia}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10 rounded-full p-3"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Media Counter */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
        {currentIndex + 1} / {media.length}
      </div>

      {/* Media Content */}
      <div className="w-full h-full flex items-center justify-center p-8">
        {currentMedia?.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentMedia.url}
            controls
            autoPlay
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
        ) : (
          <Image
            src={currentMedia?.url}
            alt={`Property media ${currentIndex + 1}`}
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
        )}
      </div>

      {/* Thumbnails */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-md overflow-x-auto bg-black/50 p-2 rounded-2xl backdrop-blur-sm">
        {media.map((item, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
              index === currentIndex ? 'border-white scale-110' : 'border-white/30'
            }`}
          >
            <Image
              src={item.thumbnail || item.url}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Modern Carousel Component
const MediaCarousel = ({ media, onOpenFullscreen }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef(null)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const currentMedia = media[currentIndex]

  return (
    <div className="space-y-4">
      {/* Main Carousel */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden group">
        <div className="relative w-full h-full">
          {currentMedia?.type === 'video' ? (
            <video
              src={currentMedia.url}
              poster={currentMedia.thumbnail}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={currentMedia?.url || '/placeholder.jpg'}
              alt={`Property view ${currentIndex + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        
        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-3"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-3"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        
        {/* Fullscreen Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenFullscreen(currentIndex)}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-3"
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
        
        {/* Media Counter */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          {currentIndex + 1} / {media.length}
        </div>

        {/* Video Play Indicator */}
        {currentMedia?.type === 'video' && (
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm flex items-center gap-1">
            <VideoIcon className="h-3 w-3" />
            Video
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {media.map((item, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
              index === currentIndex 
                ? 'border-sky-500 scale-105 shadow-lg' 
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <Image
              src={item.thumbnail || item.url}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-4 w-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// OpenStreetMap Component (Original Working Version)
const OpenStreetMapView = ({ location, latitude, longitude }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    const loadLeaflet = async () => {
      if (leafletLoaded) return

      // Add Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!window.L) {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
          setLeafletLoaded(true)
        }
        document.head.appendChild(script)
      } else {
        setLeafletLoaded(true)
      }
    }

    loadLeaflet()
  }, [leafletLoaded])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return

    const lat = latitude || -1.2921 // Default to Nairobi
    const lng = longitude || 36.8219

    // Initialize map
    mapInstanceRef.current = window.L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true
    })

    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstanceRef.current)

    // Add custom marker
    const customIcon = window.L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })

    markerRef.current = window.L.marker([lat, lng], { icon: customIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`
        <div style="font-family: system-ui; padding: 8px;">
          <strong style="color: #1e40af;">${location}</strong>
          <br>
          <small style="color: #6b7280;">Property Location</small>
        </div>
      `)

    setIsMapReady(true)

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, location, latitude, longitude])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Location</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => {
            const lat = latitude || -1.2921
            const lng = longitude || 36.8219
            window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`, '_blank')
          }}
        >
          <Navigation className="h-4 w-4" />
          Open in Maps
        </Button>
      </div>
      
      <div className="relative">
        <div 
          ref={mapRef}
          className="w-full h-80 rounded-2xl overflow-hidden shadow-lg bg-gray-100"
          style={{ minHeight: '320px' }}
        />
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 bg-gradient-to-r from-blue-50 to-sky-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Full Address</p>
                <p className="text-sm text-blue-700">{location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Navigation className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">Transport</p>
                <p className="text-sm text-green-700">Near public transport</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main PropertyDetails Component
export function PropertyDetails({ id }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${id}`)
        if (!response.ok) throw new Error('Property not found')
        const data = await response.json()
        setProperty(data)
      } catch (error) {
        console.error('Error fetching property:', error)
        toast.error('Failed to load property')
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  const openFullscreen = (index) => {
    setCurrentMediaIndex(index)
    setFullscreenOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600 mx-auto" />
            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-sky-200 opacity-20 mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading property...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Property not found</h1>
            <p className="text-gray-600 mb-6">This property may have been removed or doesn't exist.</p>
            <Button onClick={() => router.back()} className="bg-gradient-to-r from-sky-500 to-blue-600">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const images = property.media?.filter(m => m.type === 'image' || !m.type) || []
  const videos = property.media?.filter(m => m.type === 'video') || []
  const allMedia = [...images, ...videos]
  const amenities = typeof property.amenities === 'string' ? JSON.parse(property.amenities) : property.amenities || []

  const amenityIcons = {
    'WiFi': Wifi,
    'Parking': Car,
    'Kitchen': Coffee,
    'Bathroom': Bath,
    'Electricity': Zap,
    'Furnished': Home,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-2xl border-b border-white/20 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full px-4 py-2"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className="flex items-center gap-2 hover:bg-red-50 rounded-full px-4 py-2"
              >
                <HeartIcon className={`h-5 w-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                <span className="font-medium">Save</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-blue-50 rounded-full px-4 py-2">
                <Share2Icon className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Property Hero */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1">
                    {property.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{property.averageRating || 'New'}</span>
                    <span className="text-gray-500">({property._count?.reviews || 0} reviews)</span>
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {property.location.split(',')[0]}
                </h1>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{property.location}</span>
                </div>
              </div>

              {/* Modern Media Carousel */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardContent className="p-6">
                  <MediaCarousel media={allMedia} onOpenFullscreen={openFullscreen} />
                </CardContent>
              </Card>
            </div>

            {/* Modern Tabs */}
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg">
                <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
                <TabsTrigger value="amenities" className="rounded-xl">Amenities</TabsTrigger>
                <TabsTrigger value="location" className="rounded-xl">Location</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                {/* Property Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-sky-50 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="bg-blue-100 p-3 rounded-2xl w-fit mx-auto mb-3">
                        <BedSingleIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{property.bedrooms}</p>
                      <p className="text-sm text-gray-600 font-medium">Bedrooms</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-cyan-50 to-blue-50 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="bg-cyan-100 p-3 rounded-2xl w-fit mx-auto mb-3">
                        <ShowerHead className="h-6 w-6 text-cyan-600" />
                      </div>
                      <p className="text-3xl font-bold text-cyan-600">{property.bathrooms}</p>
                      <p className="text-sm text-gray-600 font-medium">Bathrooms</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="bg-purple-100 p-3 rounded-2xl w-fit mx-auto mb-3">
                        <Users2Icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-3xl font-bold text-purple-600">{property.tenantsPerRoom}</p>
                      <p className="text-sm text-gray-600 font-medium">Per Room</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="bg-green-100 p-3 rounded-2xl w-fit mx-auto mb-3">
                        <Building className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-600">{property.currentOccupants || 0}</p>
                      <p className="text-sm text-gray-600 font-medium">Current</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Room Sharing */}
                {property.roomSharing && (
                  <Card className="border-0 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 shadow-xl">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-purple-100 p-3 rounded-2xl">
                          <Users2Icon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-purple-800">Room Sharing</h3>
                          <p className="text-purple-600">Shared accommodation details</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-600 font-medium">Gender Preference</p>
                          <p className="text-lg font-bold text-purple-800">{property.gender}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-600 font-medium">Religion Preference</p>
                          <p className="text-lg font-bold text-purple-800">{property.religion}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-600 font-medium">Occupancy</p>
                          <p className="text-lg font-bold text-purple-800">
                            {property.currentOccupants}/{property.tenantsPerRoom * property.bedrooms}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">About this property</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {property.description || 'This beautiful property offers comfortable living with modern amenities and convenient location. Perfect for students looking for quality accommodation.'}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amenities" className="space-y-6">
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">What this place offers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {amenities.map((amenity, index) => {
                        const IconComponent = amenityIcons[amenity] || CheckCircle
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-shadow"
                          >
                            <div className="bg-green-100 p-2 rounded-full">
                              <IconComponent className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="font-medium text-green-800">{amenity}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="space-y-6">
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-8">
                    <OpenStreetMapView 
                      location={property.location}
                      latitude={property.latitude}
                      longitude={property.longitude}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <PropertyReviews propertyId={id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Modern Sticky Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Booking Card */}
              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardContent className="p-8">
                  {/* Price Section */}
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                      <span className="text-4xl font-bold">${property.price.toLocaleString()}</span>
                    </div>
                    <p className="text-gray-600 text-lg font-medium">per room / month</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {property.deposit 
                          ? `$${property.deposit.toLocaleString()} deposit required`
                          : 'No deposit required'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl">
                      <BedSingleIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="font-bold text-blue-600">{property.bedrooms}</p>
                      <p className="text-xs text-gray-600">Bedrooms</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl">
                      <ShowerHead className="h-6 w-6 text-cyan-600 mx-auto mb-2" />
                      <p className="font-bold text-cyan-600">{property.bathrooms}</p>
                      <p className="text-xs text-gray-600">Bathrooms</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-8">
                    <Badge className={`w-full justify-center py-3 rounded-2xl font-semibold ${
                      property.status === 'AVAILABLE' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                    }`}>
                      {property.status}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setContactDialogOpen(true)}
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Contact Landlord
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="flex items-center gap-2 py-3 rounded-xl border-2 hover:bg-green-50 hover:border-green-300">
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2 py-3 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300">
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Insights */}
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Property Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Popular property</p>
                        <p className="text-xs text-gray-600">Viewed 47 times this week</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Quick response</p>
                        <p className="text-xs text-gray-600">Usually responds within 1 hour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Shield className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Verified landlord</p>
                        <p className="text-xs text-gray-600">Identity confirmed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Media Viewer */}
      <FullscreenMediaViewer
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        media={allMedia}
        currentIndex={currentMediaIndex}
        setCurrentIndex={setCurrentMediaIndex}
      />

      {/* Contact Dialog */}
      <ContactDialog 
        open={contactDialogOpen} 
        onOpenChange={setContactDialogOpen}
        propertyId={id}
        landlordName={property.landlord?.name || 'Landlord'}
      />
    </div>
  )
}