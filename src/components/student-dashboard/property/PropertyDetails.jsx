"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
    Pause
} from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

// Video Player Component
const VideoPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

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
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
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
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
        <div 
          className="h-full bg-sky-500" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export function PropertyDetails({ id }) {
    const { data: session } = useSession()
    const router = useRouter()
    const [selectedMedia, setSelectedMedia] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [property, setProperty] = useState(null)
    const [showContact, setShowContact] = useState(false)
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
                toast.error("Failed to load property details")
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

    const handleShare = async () => {
        if (!property) return

        try {
            await navigator.share({
                title: `Check out this property in ${property.location}`,
                text: `${property.bedrooms} bed, ${property.bathrooms} bath for $${property.price}`,
                url: window.location.href
            })
        } catch (error) {
            if (error.name !== 'AbortError') {
                toast.error("Failed to share property")
            }
        }
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-red-500">{error || 'Property not found'}</p>
                <Button
                    variant="outline"
                    onClick={() => router.push('/student-dashboard')}
                    className="flex items-center gap-2"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Back to Listings
                </Button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="container mx-auto py-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                        <div className="space-y-4">
                            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Parse amenities if it's a string
    const amenities = typeof property.amenities === 'string' 
        ? JSON.parse(property.amenities) 
        : property.amenities
    
    const currentMedia = property.media?.[selectedMedia]
    const isCurrentMediaVideo = currentMedia?.type === 'video'
    
    // Filter media by type
    const images = property.media?.filter(m => m.type === 'image' || !m.type) || []
    const videos = property.media?.filter(m => m.type === 'video') || []

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b">
                <div className="container mx-auto">
                    <Link
                        href="/student-dashboard"
                        className="flex items-center gap-2 py-4 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Back to Listings
                    </Link>
                </div>
            </div>

            <div className="container mx-auto py-8">
                <div className="grid lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="relative group">
                            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                                {isCurrentMediaVideo ? (
                                    <VideoPlayer 
                                        src={currentMedia.url} 
                                        poster={images[0]?.url}
                                    />
                                ) : (
                                    <Image
                                        src={currentMedia?.url || '/placeholder-image.jpg'}
                                        alt={`View ${selectedMedia + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        priority
                                    />
                                )}
                            </AspectRatio>

                            <ScrollArea className="mt-4">
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
                        </div>

                        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full grid grid-cols-5">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                                <TabsTrigger value="location">Map</TabsTrigger>
                                <TabsTrigger value="media">
                                    All Media ({property.media?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="mt-6">
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                                        {property.description}
                                    </p>

                                    {/* Pricing details section */}
                                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                            <DollarSign className="w-5 h-5" />
                                            Pricing Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-zinc-500">Monthly Rent</p>
                                                <p className="font-medium">${property.price.toLocaleString()} per room</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-zinc-500">Security Deposit</p>
                                                <p className="font-medium">
                                                    {property.deposit > 0
                                                        ? `$${property.deposit.toLocaleString()}`
                                                        : "No deposit required"
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {property.roomSharing && (
                                        <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                                <Users2Icon className="w-5 h-5" />
                                                Sharing Details
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-zinc-500">Gender Preference</p>
                                                    <p className="font-medium">{property.gender}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-zinc-500">Religion Preference</p>
                                                    <p className="font-medium">{property.religion}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-zinc-500">Occupancy</p>
                                                    <p className="font-medium">{property.currentOccupants}/{property.tenantsPerRoom}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="amenities" className="mt-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {amenities.map((amenity, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900">
                                            <Badge variant="secondary" className="h-8 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                                                {amenity}
                                            </Badge>
                                        </div>
                                    ))}
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
                            
                            {/* Reviews Tab */}
                            <TabsContent value="reviews" className="mt-6">
                                <PropertyReviews propertyId={id} />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="sticky top-24 bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-xl ring-1 ring-zinc-950/5 dark:ring-white/5">
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-semibold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent">
                                        ${property.price.toLocaleString()} / room
                                    </h1>

                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 flex items-center">
                                        <DollarSign className="w-4 h-4 mr-1" />
                                        ${property.deposit.toLocaleString()} deposit required
                                    </p>

                                    <p className="flex items-center text-zinc-600 dark:text-zinc-400 mt-2">
                                        <MapPinIcon className="w-4 h-4 mr-1" />
                                        {property.location}
                                    </p>
                                    <Badge className="mt-2">
                                        {property.status}
                                    </Badge>
                                </div>

                                <Separator />

                                <div className="flex gap-4">
                                    <div className="flex-1 text-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900">
                                        <BedSingleIcon className="w-5 h-5 mx-auto mb-1 text-sky-500" />
                                        <span className="text-sm font-medium">{property.bedrooms} Beds</span>
                                    </div>
                                    <div className="flex-1 text-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900">
                                        <ShowerHead className="w-5 h-5 mx-auto mb-1 text-sky-500" />
                                        <span className="text-sm font-medium">{property.bathrooms} Baths</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {session?.user?.id !== property.ownerId && (
                                        <Button
                                            onClick={() => setShowContact(true)}
                                            className="w-full bg-sky-500 hover:bg-sky-600"
                                        >
                                            <MessageSquareIcon className="h-4 w-4 mr-2" />
                                            Contact Landlord
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="hover:text-pink-600 hover:border-pink-600"
                                    >
                                        <HeartIcon className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleShare}
                                    >
                                        <Share2Icon className="w-5 h-5" />
                                    </Button>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <h3 className="font-medium">Landlord</h3>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{property.owner.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            <MessageSquareIcon className="w-4 h-4" />
                                            {property.owner.email}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Media stats */}
                                {(videos.length > 0 || images.length > 0) && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <h3 className="font-medium">Media</h3>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                    <ImageIcon className="w-4 h-4" />
                                                    {images.length} Images
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                    <VideoIcon className="w-4 h-4" />
                                                    {videos.length} Videos
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Dialog */}
            <ContactDialog
                open={showContact}
                onOpenChange={setShowContact}
                property={property}
            />
        </div>
    )
}