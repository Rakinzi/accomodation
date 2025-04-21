"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  Users2Icon, 
  BedDouble, 
  Bath, 
  HomeIcon, 
  Star 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PropertySkeleton } from "@/components/dashboard/PropertySkeleton"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"

export default function PropertiesPage() {
    const { data: session } = useSession()
    const [properties, setProperties] = useState([])
    const [occupants, setOccupants] = useState([])
    const [loading, setLoading] = useState(true)
    const [unallocating, setUnallocating] = useState(null)
    const [unallocateDialogOpen, setUnallocateDialogOpen] = useState(false)
    const [selectedOccupant, setSelectedOccupant] = useState(null)

    // Render star rating function
    const renderStars = (rating, reviewCount) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        className={`h-4 w-4 ${
                            rating >= star 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-zinc-300'
                        }`} 
                    />
                ))}
                <span className="text-xs text-zinc-500 ml-1">
                    ({reviewCount || 0})
                </span>
            </div>
        )
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all properties owned by the user
                const propertiesResponse = await fetch(`/api/properties?ownerId=${session?.user?.id}`)
                if (!propertiesResponse.ok) throw new Error("Failed to fetch properties")
                const propertiesData = await propertiesResponse.json()
                setProperties(propertiesData)

                // Fetch active occupants
                const occupantsResponse = await fetch("/api/properties/occupants")
                if (!occupantsResponse.ok) throw new Error("Failed to fetch occupants")
                const occupantsData = await occupantsResponse.json()
                setOccupants(occupantsData)
            } catch (error) {
                console.error("Error:", error)
                toast.error("Failed to load data")
            } finally {
                setLoading(false)
            }
        }

        if (session?.user?.id) {
            fetchData()
        }
    }, [session?.user?.id])

    const handleUnallocate = async () => {
        if (unallocating || !selectedOccupant) return

        setUnallocating(selectedOccupant.id)
        try {
            const response = await fetch("/api/properties/allocate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    propertyId: selectedOccupant.property.id,
                    userId: selectedOccupant.user.id,
                    roomNumber: null, // Explicitly set to null for unallocation
                    action: "unallocate"
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to unallocate rooms")
            }

            toast.success("Rooms unallocated successfully")

            // Update occupants list
            setOccupants(prev => prev.filter(occ => occ.id !== selectedOccupant.id))

            // Update property status in properties list
            setProperties(prev => prev.map(prop =>
                prop.id === selectedOccupant.property.id
                    ? { ...prop, status: 'AVAILABLE', currentOccupants: prop.currentOccupants - 1 }
                    : prop
            ))

            // Close dialog
            setUnallocateDialogOpen(false)
        } catch (error) {
            console.error("Error:", error)
            toast.error(error.message || "Failed to unallocate rooms")
        } finally {
            setUnallocating(null)
        }
    }

    const openUnallocateDialog = (occupant) => {
        setSelectedOccupant(occupant)
        setUnallocateDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="p-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <PropertySkeleton key={index} />
                ))}
            </div>
            </div>
        )
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="properties" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                    <TabsTrigger value="properties">
                        <HomeIcon className="w-4 h-4 mr-2" />
                        Properties ({properties.length})
                    </TabsTrigger>
                    <TabsTrigger value="occupants">
                        <Users2Icon className="w-4 h-4 mr-2" />
                        Occupants ({occupants.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="properties">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map(property => (
                            <Card key={property.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                                <div className="aspect-video relative">
                                    {property.images?.[0] ? (
                                        <Image
                                            src={property.images[0].url}
                                            alt={property.location}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <HomeIcon className="w-12 h-12 text-zinc-400" />
                                        </div>
                                    )}
                                    <Badge
                                        className={`absolute top-2 right-2 ${property.status === 'AVAILABLE'
                                            ? 'bg-green-500 hover:bg-green-600'
                                            : 'bg-orange-500 hover:bg-orange-600'
                                            }`}
                                    >
                                        {property.status}
                                    </Badge>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg truncate">{property.location}</h3>
                                        {property.averageRating !== undefined && 
                                            renderStars(property.averageRating, property._count?.reviews)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                                        <div className="flex items-center gap-1">
                                            <BedDouble className="w-4 h-4" />
                                            {property.bedrooms} beds
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Bath className="w-4 h-4" />
                                            {property.bathrooms} baths
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                        <p className="font-medium text-lg">${property.price.toLocaleString()}</p>
                                        <div className="flex items-center gap-1 text-sm text-zinc-500">
                                            <Users2Icon className="w-4 h-4" />
                                            {property.currentOccupants}/{property.tenantsPerRoom * property.bedrooms}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {properties.length === 0 && (
                            <div className="col-span-full text-center py-12">
                                <HomeIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                    No Properties Found
                                </h3>
                                <p className="text-sm text-zinc-500">
                                    You haven&apos;t added any properties yet.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="occupants">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 gap-6">
                            {occupants.map(occupant => (
                                <Card key={occupant.id} className="p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                                                <Users2Icon className="w-6 h-6 text-sky-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{occupant.user.name}</h3>
                                                <p className="text-sm text-zinc-500">{occupant.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-zinc-500 mb-2">
                                                {occupant.property.location}
                                            </p>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={unallocating === occupant.id}
                                                onClick={() => openUnallocateDialog(occupant)}
                                            >
                                                {unallocating === occupant.id ? (
                                                    <LoadingSpinner className="w-4 h-4" />
                                                ) : (
                                                    'Unallocate'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-zinc-500">Rooms</p>
                                            <p className="font-medium">{occupant.roomNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Total Price</p>
                                            <p className="font-medium">${occupant.totalPrice.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Start Date</p>
                                            <p className="font-medium">
                                                {new Date(occupant.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {occupants.length === 0 && (
                                <div className="text-center py-12">
                                    <Users2Icon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                        No Active Occupants
                                    </h3>
                                    <p className="text-sm text-zinc-500">
                                        You don&apos;t have any active occupants in your properties.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Unallocate Confirmation Dialog */}
            <AlertDialog 
                open={unallocateDialogOpen} 
                onOpenChange={setUnallocateDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unallocate Room</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unallocate the room for {selectedOccupant?.user.name} 
                            from {selectedOccupant?.property.location}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={unallocating !== null}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleUnallocate}
                            disabled={unallocating !== null}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {unallocating ? <LoadingSpinner className="w-4 h-4" /> : 'Unallocate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}