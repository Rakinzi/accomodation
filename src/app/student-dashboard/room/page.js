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
} from "lucide-react"

export default function Room() {
    const { data: session, status } = useSession()
    const [allocation, setAllocation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentDateTime, setCurrentDateTime] = useState("")

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

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Server error:', errorData)
                throw new Error('Failed to fetch allocation')
            }

            const data = await response.json()
            setAllocation(data)
        } catch (error) {
            console.error('Failed to fetch allocation details:', error)
        } finally {
            setLoading(false)
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

                {!allocation ? (
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
                        <CardContent className="p-12">
                            <div className="text-center space-y-4">
                                <BedDouble className="h-12 w-12 mx-auto text-zinc-400" />
                                <p className="text-xl font-medium text-zinc-600 dark:text-zinc-400">
                                    No active room allocation found
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
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
                                            {allocation.property.amenities.map((amenity, index) => (
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
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Rooms</p>
                                            <p className="text-2xl font-bold mt-1 text-zinc-800 dark:text-zinc-200">
                                                {allocation.numberOfRooms}
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
                    </>
                )}
            </div>
        </div>
    )
}