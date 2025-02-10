import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ContactDialog } from "./ContactDialog"
import {
    HeartIcon,
    BedSingleIcon,
    ShowerHead,
    MapPinIcon,
    Share2Icon,
    WifiIcon,
    CarIcon,
    HomeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PhoneIcon,
    MailIcon
} from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PlayIcon, PauseIcon } from "lucide-react"


export function PropertyDetails({ id }) {
    const [selectedImage, setSelectedImage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showContact, setShowContact] = useState(false)
    const [isPlaying, setIsPlaying] = useState(true)
    const [slideInterval] = useState(5000)

    // Mock data - In real app, fetch from API
    const property = {
        id,
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
        ],
        price: 5000,
        location: "City Center, Johannesburg",
        bedrooms: 2,
        bathrooms: 1,
        amenities: ["WiFi", "Parking", "Furnished", "Security", "Pool", "Gym"],
        description: "Experience luxury living in this modern apartment located in the heart of the city. This well-appointed space features contemporary design, premium finishes, and all the amenities you need for comfortable student living.",
        landlord: {
            name: "John Doe",
            phone: "+27 123 456 789",
            email: "john@example.com",
            responseTime: "Usually responds within 1 hour"
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!isPlaying) return

        const timer = setInterval(() => {
            setSelectedImage((prev) => (prev + 1) % property.images.length)
        }, slideInterval)

        return () => clearInterval(timer)
    }, [isPlaying, property.images.length, slideInterval])

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
            {/* Back Navigation */}
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
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Image Gallery */}
                        <div className="relative group">
                            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                                <Image
                                    src={property.images[selectedImage]}
                                    alt={`View ${selectedImage + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                {/* Gallery Navigation */}
                                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="bg-white/20 hover:bg-white/40 backdrop-blur-lg text-white"
                                        onClick={() => {
                                            setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length)
                                            setIsPlaying(false)
                                        }}
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="bg-white/20 hover:bg-white/40 backdrop-blur-lg text-white"
                                        onClick={() => {
                                            setSelectedImage((prev) => (prev + 1) % property.images.length)
                                            setIsPlaying(false)
                                        }}
                                    >
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Slideshow Controls */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setIsPlaying(!isPlaying)}
                                >
                                    {isPlaying ? (
                                        <PauseIcon className="w-5 h-5" />
                                    ) : (
                                        <PlayIcon className="w-5 h-5" />
                                    )}
                                </Button>

                                {/* Progress Bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                    <div
                                        className="h-full bg-sky-500 transition-all duration-[5000ms] ease-linear"
                                        style={{
                                            width: isPlaying ? '100%' : '0%',
                                            transition: isPlaying ? 'width 5000ms linear' : 'none',
                                            transform: `scaleX(${selectedImage / (property.images.length - 1)})`
                                        }}
                                    />
                                </div>
                            </AspectRatio>


                            {/* Thumbnails */}
                            <ScrollArea className="mt-4">
                                <div className="flex gap-4">
                                    {property.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setSelectedImage(index)
                                                setIsPlaying(false)
                                            }}
                                            className={`relative flex-none w-20 aspect-video rounded-lg overflow-hidden transition-all
            ${selectedImage === index
                                                    ? 'ring-2 ring-sky-500 scale-95'
                                                    : 'ring-1 ring-zinc-200 hover:ring-sky-500/50'
                                                }`}
                                        >
                                            <Image
                                                src={image}
                                                alt={`Thumbnail ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Details Tabs */}
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="w-full grid grid-cols-3">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                                <TabsTrigger value="location">Location</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="mt-6">
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                                        {property.description}
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="amenities" className="mt-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {property.amenities.map((amenity, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900">
                                            <Badge variant="secondary" className="h-8 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                                                {amenity}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="location" className="mt-6">
                                <div className="aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-800">
                                    {/* Add Map Component Here */}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24 bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-xl ring-1 ring-zinc-950/5 dark:ring-white/5">
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-semibold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent">
                                        R{property.price.toLocaleString()}/month
                                    </h1>
                                    <p className="flex items-center text-zinc-600 dark:text-zinc-400 mt-2">
                                        <MapPinIcon className="w-4 h-4 mr-1" />
                                        {property.location}
                                    </p>
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
                                    <ContactDialog
                                        open={showContact}
                                        onOpenChange={setShowContact}
                                        property={property}
                                    />
                                    <Button variant="outline" size="icon" className="hover:text-pink-600 hover:border-pink-600">
                                        <HeartIcon className="w-5 h-5" />
                                    </Button>
                                    <Button variant="outline" size="icon">
                                        <Share2Icon className="w-5 h-5" />
                                    </Button>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <h3 className="font-medium">Landlord</h3>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{property.landlord.name}</p>
                                        <p className="text-xs text-zinc-500">{property.landlord.responseTime}</p>
                                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                                            <PhoneIcon className="w-4 h-4" />
                                            {property.landlord.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                                            <MailIcon className="w-4 h-4" />
                                            {property.landlord.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    )
}