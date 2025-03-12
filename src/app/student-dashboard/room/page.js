"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import {
    Clock,
    UserCircle,
    Building2,
    BedDouble,
    Calendar,
    CreditCard,
    Receipt,
    AlertCircle,
    LogOut
} from "lucide-react"
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

export default function Room() {
    const { data: session, status } = useSession()
    const [allocation, setAllocation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentDateTime, setCurrentDateTime] = useState("")
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)

    useEffect(() => {
        if (status === "authenticated" && session?.user?.id) {
            fetchAllocationDetails()
        }

        // Update time every second with UTC format
        const timer = setInterval(() => {
            const now = new Date()
            const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ')
            setCurrentDateTime(formattedDate)
        }, 1000)

        return () => clearInterval(timer)
    }, [status, session])

    const fetchAllocationDetails = async () => {
        try {
            if (!session?.user?.id) {
                console.log("No user ID available")
                return
            }

            const response = await fetch(`/api/allocations/student/${session.user.id}`)

            // Handle not found as a normal state, not an error
            if (response.status === 404) {
                setAllocation(null)
                setLoading(false)
                return
            }

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Server error:', errorData)
                throw new Error(errorData.message || 'Failed to fetch allocation')
            }

            const data = await response.json()
            setAllocation(data)
        } catch (error) {
            console.error('Failed to fetch allocation details:', error)
            setError(error.message || "An error occurred while fetching your room details")
        } finally {
            setLoading(false)
        }
    }

    const handleLeaveRoom = async () => {
        if (!allocation) return
        
        setIsLeaving(true)
        try {
            const response = await fetch(`/api/allocations/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    propertyId: allocation.property.id,
                    occupantId: allocation.id
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to leave room')
            }

            toast.success("Successfully left room")
            setAllocation(null)
        } catch (error) {
            console.error('Error leaving room:', error)
            toast.error(error.message || "Failed to leave room")
        } finally {
            setIsLeaving(false)
            setLeaveDialogOpen(false)
        }
    }

    // Format dates for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ')
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <p>Please log in to view your room details</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 md:p-8 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Card */}
                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date/Time Display */}
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-zinc-800 shadow-sm">
                                <Clock className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                                <div>
                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Current Time (CAT)</p>
                                    <p className="text-2xl font-mono font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
                                        {currentDateTime}
                                    </p>
                                </div>
                            </div>
                            {/* User Info Display */}
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-zinc-800 shadow-sm">
                                <UserCircle className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                                <div>
                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Welcome</p>
                                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
                                        {session?.user?.name || 'Loading...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error State */}
                {error && (
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
                        <CardContent className="p-12">
                            <div className="text-center space-y-4">
                                <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
                                <p className="text-xl font-medium text-red-600 dark:text-red-400">
                                    {error}
                                </p>
                                <Button 
                                    onClick={() => {
                                        setError(null);
                                        setLoading(true);
                                        fetchAllocationDetails();
                                    }}
                                    variant="outline"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Allocation State */}
                {!error && !allocation && (
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
                        <CardContent className="p-12">
                            <div className="text-center space-y-4">
                                <BedDouble className="h-12 w-12 mx-auto text-zinc-400" />
                                <p className="text-xl font-medium text-zinc-600 dark:text-zinc-400">
                                    No active room allocation found
                                </p>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                                    You currently don&apos;t have any active room allocations. Please contact your landlord if you believe this is incorrect.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Allocation Details */}
                {!error && allocation && (
                    <>
                        {/* Action Bar - Leave Room Button at the Top */}
                        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
                            <CardContent className="p-4">
                                <div className="flex justify-end">
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => setLeaveDialogOpen(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Leave Room
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Property Details Grid */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Property Card */}
                            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <Building2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                                        Property Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Location</p>
                                        <p className="text-lg font-semibold mt-1 text-zinc-800 dark:text-zinc-200">
                                            {allocation.property.location}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Bedrooms</p>
                                            <p className="text-2xl font-bold mt-1 text-zinc-800 dark:text-zinc-200">
                                                {allocation.property.bedrooms}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Bathrooms</p>
                                            <p className="text-2xl font-bold mt-1 text-zinc-800 dark:text-zinc-200">
                                                {allocation.property.bathrooms}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Amenities</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(allocation.property.amenities) && allocation.property.amenities.map((amenity, index) => (
                                                <Badge
                                                    key={index}
                                                    className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 rounded-full"
                                                >
                                                    {amenity}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Occupancy Card */}
                            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <Calendar className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                        Occupancy Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                        <div>
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</p>
                                            <Badge className={`mt-2 px-3 py-1 ${allocation.status === 'ACTIVE'
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
                                                    : 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
                                                }`}>
                                                {allocation.status}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Room Number</p>
                                            <p className="text-2xl font-bold mt-1 text-zinc-800 dark:text-zinc-200">
                                                {allocation.roomNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 space-y-4">
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Occupancy Period</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Start Date</p>
                                                <p className="text-sm font-medium mt-1">{formatDate(allocation.startDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">End Date</p>
                                                <p className="text-sm font-medium mt-1">{formatDate(allocation.endDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {allocation.property.roomSharing && (
                                        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 space-y-2">
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Room Sharing</p>
                                            <Badge className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400 rounded-full">
                                                {allocation.property.tenantsPerRoom} tenants per room
                                            </Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Card */}
                        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <CreditCard className="h-6 w-6 text-violet-500 dark:text-violet-400" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-400/10 dark:to-purple-400/10">
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Monthly Rent</p>
                                        <p className="text-3xl font-bold mt-2 text-zinc-800 dark:text-zinc-200">
                                            ${allocation.monthlyRent}
                                        </p>
                                    </div>
                                    <Button
                                        className="h-full min-h-[100px] text-lg bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 shadow-lg"
                                    >
                                        <Receipt className="h-5 w-5 mr-2" />
                                        View Payment History
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Leave Room Confirmation Dialog */}
                        <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to leave this room?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will end your occupancy and notify the landlord. You may not be able to get the same room back if you change your mind.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleLeaveRoom}
                                        disabled={isLeaving}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        {isLeaving ? (
                                            <>
                                                <LoadingSpinner className="mr-2 h-4 w-4" />
                                                Leaving...
                                            </>
                                        ) : (
                                            "Confirm Leave"
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </div>
        </div>
    )
}