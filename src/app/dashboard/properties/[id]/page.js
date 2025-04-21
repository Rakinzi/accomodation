"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
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
  CheckCircle2Icon,
  Pencil,
  Video as VideoIcon,
  Image as ImageIcon,
  Play,
  Pause,
  BarChart3Icon,
  MessageSquareIcon,
  Eye
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Video Player Component
const VideoPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
          toast.error("Error playing video");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const progressPercent = (current / duration) * 100;
      
      setCurrentTime(current);
      setProgress(progressPercent);
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onEnded={handleEnded}
        onClick={togglePlayPause}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-sky-500" />
        </div>
      )}
      
      {/* Play/Pause button */}
      <button 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 rounded-full p-4 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-8 w-8 text-white" />
        ) : (
          <Play className="h-8 w-8 text-white" />
        )}
      </button>
      
      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <div className="relative h-1 bg-zinc-700 rounded-full mb-2 cursor-pointer" 
          onClick={(e) => {
            if (videoRef.current) {
              const rect = e.currentTarget.getBoundingClientRect();
              const offsetX = e.clientX - rect.left;
              const newProgress = (offsetX / rect.width) * 100;
              const newTime = (newProgress / 100) * duration;
              
              videoRef.current.currentTime = newTime;
              setProgress(newProgress);
            }
          }}>
          <div 
            className="absolute top-0 left-0 h-full bg-sky-500 rounded-full" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Time and controls */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <button onClick={togglePlayPause}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PropertyDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMedia, setSelectedMedia] = useState(0)
  const [activeTab, setActiveTab] = useState("details")
  const [mapLoaded, setMapLoaded] = useState(false)

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

  // Load map when the location tab is active
  useEffect(() => {
    if (activeTab === 'location' && property && !mapLoaded) {
      // Load Leaflet library
      const loadMap = async () => {
        // Load CSS
        const linkEl = document.createElement('link')
        linkEl.rel = 'stylesheet'
        linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(linkEl)
        
        // Load JS
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
          setMapLoaded(true)
          initMap()
        }
        document.head.appendChild(script)
      }
      
      const initMap = () => {
        if (!window.L || !property.latitude || !property.longitude) return
        
        // Initialize map
        const mapElement = document.getElementById('property-map')
        if (!mapElement) return
        
        const map = window.L.map(mapElement).setView([property.latitude, property.longitude], 15)
        
        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)
        
        // Add marker
        window.L.marker([property.latitude, property.longitude])
          .addTo(map)
          .bindPopup(property.location)
          .openPopup()
      }
      
      loadMap()
    }
  }, [activeTab, property, mapLoaded])

  const shareProperty = () => {
    if (!property) return
    navigator.share({
      title: `Check out this property in ${property.location}`,
      text: `${property.bedrooms} bed, ${property.bathrooms} bath for $${property.price}`,
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
          <ArrowLeftIcon className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const amenities = JSON.parse(property.amenities)
  
  // Find current media
  const currentMedia = property.media?.[selectedMedia]
  const isCurrentMediaVideo = currentMedia?.type === 'video'
  
  // Filter media by type
  const images = property.media?.filter(m => m.type === 'image' || !m.type) || []
  const videos = property.media?.filter(m => m.type === 'video') || []

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
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-pink-50 dark:hover:bg-pink-900"
              onClick={() => { }}
            >
              <HeartIcon className="w-5 h-5 text-pink-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={shareProperty}
            >
              <Share2Icon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl">
            <div className="relative aspect-video">
              {isCurrentMediaVideo ? (
                <VideoPlayer 
                  src={currentMedia.url}
                  poster={images[0]?.url}
                />
              ) : (
                <Image
                  src={currentMedia?.url || '/placeholder-image.jpg'}
                  alt={property.location}
                  fill
                  className="object-cover"
                  priority
                />
              )}
            </div>

            {/* Media thumbnails */}
            <ScrollArea className="p-4">
              <div className="flex gap-4">
                {property.media?.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMedia(index)}
                    className={`relative flex-none w-20 aspect-video rounded-lg overflow-hidden transition-all
                        ${selectedMedia === index
                            ? 'ring-2 ring-sky-500 scale-95'
                            : 'ring-1 ring-zinc-200 hover:ring-sky-500/50'
                        }`}
                  >
                    {media.type === 'video' ? (
                      <>
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <VideoIcon className="h-6 w-6 text-white" />
                        </div>
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      </>
                    ) : (
                      <Image
                        src={media.url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="p-8 space-y-8">
              {/* Property Header */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-sky-500 hover:bg-sky-600">
                    {property.status}
                  </Badge>
                  {property.roomSharing && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users2Icon className="w-4 h-4" />
                      Shared Accommodation
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold">{property.location}</h1>
                <p className="text-4xl font-bold text-sky-500 dark:text-sky-400">
                  ${property.price.toLocaleString()}
                  <span className="text-base font-normal text-zinc-500">/month</span>
                </p>
              </div>

              <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="occupants">Occupants</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6 space-y-6">
                  {/* Property Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: BedSingleIcon, label: 'Bedrooms', value: property.bedrooms },
                      { icon: ShowerHead, label: 'Bathrooms', value: property.bathrooms },
                      { icon: MapPinIcon, label: 'Location', value: property.location.split(',')[0] },
                      { icon: Users2Icon, label: 'Max Occupants Per Room', value: property.tenantsPerRoom},
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                        <Icon className="h-5 w-5 text-sky-500 mb-2" />
                        <p className="text-sm text-zinc-500">{label}</p>
                        <p className="font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sharing Details */}
                  {property.roomSharing && (
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
                </TabsContent>

                <TabsContent value="occupants" className="mt-6">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Users2Icon className="h-5 w-5 text-sky-500" />
                      Current Occupants
                    </h2>
                    
                    {property.occupants && property.occupants.length > 0 ? (
                      <div className="space-y-4">
                        {property.occupants.map((occupant) => (
                          <Card key={occupant.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{occupant.user.name}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
                                  <div className="flex items-center gap-1">
                                    <BedSingleIcon className="h-4 w-4" />
                                    Room {occupant.roomNumber}
                                  </div>
                                  {occupant.user.gender && (
                                    <div className="flex items-center gap-1">
                                      <Users2Icon className="h-4 w-4" />
                                      {occupant.user.gender}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <CircleDollarSignIcon className="h-3 w-3" />
                                ${(occupant.totalPrice).toLocaleString()}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <Users2Icon className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                        <p className="text-zinc-500">No active occupants</p>
                      </div>
                    )}
                    
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-6">
                      <h3 className="font-medium mb-4">Occupancy Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-zinc-500">Total Rooms</p>
                          <p className="text-xl font-bold">{property.bedrooms}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Occupied</p>
                          <p className="text-xl font-bold">{property.currentOccupants || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Available</p>
                          <p className="text-xl font-bold">{property.maxOccupants ? (property.maxOccupants - property.currentOccupants) : property.bedrooms}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Occupancy Rate</p>
                          <p className="text-xl font-bold">
                            {property.maxOccupants ? 
                              `${Math.round((property.currentOccupants / property.maxOccupants) * 100)}%` : 
                              '0%'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5 text-sky-500" />
                      <p className="text-zinc-700 dark:text-zinc-300">{property.location}</p>
                    </div>
                    
                    <div className="aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div id="property-map" className="h-full w-full"></div>
                    </div>
                    
                    {property.latitude && property.longitude && (
                      <div className="text-sm text-zinc-500">
                        <p>Latitude: {property.latitude.toFixed(6)}</p>
                        <p>Longitude: {property.longitude.toFixed(6)}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="media" className="mt-6">
                  <div className="space-y-6">
                    {videos.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <VideoIcon className="h-5 w-5 text-sky-500" />
                          Videos ({videos.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {videos.map((video, index) => (
                            <div key={index} className="aspect-video bg-black rounded-lg overflow-hidden">
                              <VideoPlayer 
                                src={video.url} 
                                poster={images[0]?.url}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {images.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-sky-500" />
                          Images ({images.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {images.map((image, index) => (
                            <div key={index} className="aspect-video rounded-lg overflow-hidden relative">
                              <Image
                                src={image.url}
                                alt={`Property image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="p-6 border-none shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                    <StarIcon className="h-6 w-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Property Status</p>
                    <p className="text-sm text-zinc-500">{property.status}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => router.push(`/dashboard/properties/${id}/edit`)}
                    className="w-full bg-sky-500 hover:bg-sky-600"
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit Property
                  </Button>
                  {property.status === 'AVAILABLE' ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {/* Add mark as rented logic */ }}
                    >
                      <CheckCircle2Icon className="h-4 w-4 mr-2" />
                      Mark as Rented
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {/* Add mark as available logic */ }}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Mark as Available
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Info Card */}
            <Card className="p-6 border-none shadow-xl space-y-4">
              <h3 className="font-semibold">Property Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CircleDollarSignIcon className="h-4 w-4 text-sky-500" />
                  <span>Deposit: ${property.deposit?.toLocaleString() || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-sky-500" />
                  <span>Listed on: {new Date(property.createdAt).toLocaleDateString()}</span>
                </div>
                {property.roomSharing && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users2Icon className="h-4 w-4 text-sky-500" />
                    <span>Current Occupants: {property.currentOccupants}/{(property.tenantsPerRoom * property.bedrooms)}</span>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Stats Card */}
            <Card className="p-6 border-none shadow-xl space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4 text-sky-500" />
                Property Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-center">
                  <p className="text-xs text-zinc-500 mb-1">Reviews</p>
                  <p className="font-semibold">{property._count?.reviews || 0}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-center">
                  <p className="text-xs text-zinc-500 mb-1">Inquiries</p>
                  <p className="font-semibold">{property._count?.messages || 0}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-center">
                  <p className="text-xs text-zinc-500 mb-1">Media</p>
                  <p className="font-semibold">{property.media?.length || 0}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-center">
                  <p className="text-xs text-zinc-500 mb-1">Views</p>
                  <p className="font-semibold">-</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="justify-start text-sky-500"
                  onClick={() => router.push(`/dashboard/messages`)}
                >
                  <MessageSquareIcon className="h-4 w-4 mr-2" />
                  View Messages
                </Button>
                <Button
                  variant="ghost" 
                  className="justify-start text-sky-500"
                  onClick={() => router.push(`/dashboard/analytics`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}