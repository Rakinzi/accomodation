import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { toast } from "sonner"

export function RoomAllocationDialog({
    isOpen,
    onClose,
    property,
    user,
    onSuccess
}) {
    if (!property || !user) {
        return null;
    }

    const [numberOfRooms, setNumberOfRooms] = useState(1)
    const [loading, setLoading] = useState(false)
    const [propertyDetails, setPropertyDetails] = useState(null)
    const [maxAllowableRooms, setMaxAllowableRooms] = useState(1)

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            if (!isOpen || !property.id) return;
            
            try {
                const response = await fetch(`/api/properties/${property.id}`)
                if (!response.ok) throw new Error("Failed to fetch property details")
                
                const data = await response.json()
                setPropertyDetails(data)

                // Calculate max allowable rooms
                const maxRooms = Math.min(
                    data.allocation.availableRooms,
                    Math.ceil(data.allocation.availableRooms / Math.max(data.allocation.remainingOccupantSlots, 1)),
                    data.sharing ? 2 : 1
                )
                setMaxAllowableRooms(maxRooms)
            } catch (error) {
                console.error("Error fetching property details:", error)
                toast.error("Failed to load property details")
                onClose()
            }
        }

        fetchPropertyDetails()
    }, [isOpen, property.id, onClose])

    const handleAllocate = async () => {
        if (!propertyDetails) return;

        setLoading(true)
        try {
            const response = await fetch("/api/properties/allocate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    propertyId: property.id,
                    userId: user.id,
                    numberOfRooms
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message)
            }

            const data = await response.json()
            onSuccess(data)
        } catch (error) {
            console.error("Error:", error)
            toast.error(error.message || "Failed to allocate rooms")
        } finally {
            setLoading(false)
        }
    }

    // Loading state
    if (!propertyDetails) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Loading Property Details</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4">
                        <LoadingSpinner />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const { allocation } = propertyDetails
    const totalPrice = numberOfRooms * allocation.pricePerRoom

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Allocate Rooms to {user.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <p className="text-sm text-zinc-500">
                            Property: {property.location}
                        </p>
                        <p className="text-sm text-zinc-500">
                            Price per room: ${allocation.pricePerRoom}
                        </p>
                        <p className="text-sm text-zinc-500">
                            Total bedrooms: {allocation.totalRooms}
                        </p>
                        <p className="text-sm text-zinc-500">
                            Remaining bedrooms: {allocation.availableRooms}
                        </p>
                        <p className="text-sm text-zinc-500">
                            Maximum rooms allowed: {maxAllowableRooms}
                        </p>
                        {allocation.isShared && (
                            <>
                                <p className="text-sm text-zinc-500">
                                    Shared property: Yes
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Current occupants: {allocation.totalOccupants} / {allocation.maxOccupants}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Number of Rooms
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={maxAllowableRooms}
                            value={numberOfRooms}
                            onChange={(e) => {
                                const value = parseInt(e.target.value)
                                if (value >= 1 && value <= maxAllowableRooms) {
                                    setNumberOfRooms(value)
                                }
                            }}
                            disabled={loading}
                        />
                        <p className="text-xs text-zinc-500">
                            {!allocation.isShared
                                ? "Non-shared properties can only have one occupant"
                                : `You can allocate up to ${maxAllowableRooms} room(s) to ensure fair distribution`}
                        </p>
                    </div>
                    <div className="pt-2 border-t">
                        <p className="text-lg font-semibold">
                            Total Price: ${totalPrice}
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAllocate}
                        disabled={
                            loading ||
                            numberOfRooms < 1 ||
                            numberOfRooms > maxAllowableRooms ||
                            allocation.availableRooms < numberOfRooms
                        }
                    >
                        {loading ? <LoadingSpinner className="w-4 h-4" /> : "Allocate Rooms"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}