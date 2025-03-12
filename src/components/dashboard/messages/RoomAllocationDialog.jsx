import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, User } from "lucide-react"

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
    
    const [roomNumber, setRoomNumber] = useState(1)
    const [loading, setLoading] = useState(false)
    const [propertyDetails, setPropertyDetails] = useState(null)
    const [roomOccupants, setRoomOccupants] = useState({})
    const [compatibilityIssues, setCompatibilityIssues] = useState([])
    const [fullUserData, setFullUserData] = useState(null)
    const [errorMessage, setErrorMessage] = useState("")
    const initRef = useRef(false)

    // Reset error when dialog opens/closes
    useEffect(() => {
        setErrorMessage("")
    }, [isOpen])

    // Simplified data fetch - only runs once
    useEffect(() => {
        let active = true
        
        if (!isOpen || initRef.current) return
        
        const fetchData = async () => {
            try {
                // Fetch property details
                const propertyResponse = await fetch(`/api/properties/${property.id}`)
                if (!propertyResponse.ok) throw new Error("Failed to fetch property details")
                const propertyData = await propertyResponse.json()
                
                if (!active) return
                
                // Fetch full user data 
                let userData = { ...user }
                try {
                    const userResponse = await fetch(`/api/users/${user.id}`)
                    if (userResponse.ok) {
                        const fetchedUserData = await userResponse.json()
                        userData = { ...user, ...fetchedUserData }
                    }
                } catch (userError) {
                    console.error("Error fetching user details:", userError)
                    // Continue even if user fetch fails
                }
                
                if (!active) return
                
                setPropertyDetails(propertyData)
                setFullUserData(userData)
                
                // Organize occupants by room number
                const occupantsByRoom = {}
                if (propertyData.occupants && Array.isArray(propertyData.occupants)) {
                    propertyData.occupants.forEach(occupant => {
                        if (occupant.status === 'ACTIVE') {
                            if (!occupantsByRoom[occupant.roomNumber]) {
                                occupantsByRoom[occupant.roomNumber] = []
                            }
                            occupantsByRoom[occupant.roomNumber].push(occupant)
                        }
                    })
                }
                
                if (!active) return
                
                setRoomOccupants(occupantsByRoom)
                
                // Find first available room
                const totalRooms = propertyData.bedrooms || 1
                let bestRoom = 1; // Default to first room
                
                for (let i = 1; i <= totalRooms; i++) {
                    const roomOcc = occupantsByRoom[i] || []
                    if (roomOcc.length === 0) {
                        // Empty room is always best
                        bestRoom = i;
                        break;
                    } else if (propertyData.roomSharing && roomOcc.length < propertyData.tenantsPerRoom) {
                        // If it's a shared room with space, check compatibility
                        let compatible = true;
                        
                        // Strict compatibility check
                        const firstOccupant = roomOcc[0]?.user;
                        if (firstOccupant) {
                            // Check gender compatibility - MUST match if both specified
                            if (firstOccupant.gender && userData.gender && 
                                firstOccupant.gender !== userData.gender) {
                                compatible = false;
                            }
                            
                            // Check religion compatibility - MUST match if both specified
                            if (firstOccupant.religion && userData.religion && 
                                firstOccupant.religion !== userData.religion) {
                                compatible = false;
                            }
                        }
                        
                        if (compatible) {
                            bestRoom = i;
                            break;
                        }
                    }
                }
                
                if (active) {
                    setRoomNumber(bestRoom)
                }
                
                initRef.current = true
            } catch (error) {
                console.error("Error:", error)
                if (active) {
                    toast.error("Failed to load property details")
                    onClose()
                }
            }
        }
        
        fetchData()
        
        return () => {
            active = false
        }
    }, [isOpen, property.id, user, onClose])
    
    // Check compatibility whenever room number changes - STRICT COMPATIBILITY CHECK
    useEffect(() => {
        if (!propertyDetails || !roomOccupants || !fullUserData || !roomNumber) return
        
        const currentOccupants = roomOccupants[roomNumber] || []
        const issues = []
        
        // Empty room is always compatible
        if (currentOccupants.length === 0) {
            setCompatibilityIssues([])
            return
        }
        
        // For non-shared rooms, any occupancy is an issue
        if (!propertyDetails.roomSharing) {
            issues.push("Room is already occupied and not set for sharing")
            setCompatibilityIssues(issues)
            return
        }
        
        // For shared rooms, check if there's space
        if (currentOccupants.length >= propertyDetails.tenantsPerRoom) {
            issues.push(`Room is at full capacity (${propertyDetails.tenantsPerRoom} occupants)`)
        }
        
        // STRICT gender compatibility - ANY difference is an issue
        const firstOccupantGender = currentOccupants[0]?.user?.gender
        if (firstOccupantGender && fullUserData.gender && 
            firstOccupantGender !== fullUserData.gender) {
            issues.push(`Gender mismatch: Room has ${firstOccupantGender.toLowerCase()} occupants`)
        }
        
        // STRICT religion compatibility - ANY difference is an issue
        const firstOccupantReligion = currentOccupants[0]?.user?.religion
        if (firstOccupantReligion && fullUserData.religion && 
            firstOccupantReligion !== fullUserData.religion) {
            issues.push(`Religion mismatch: Room has ${firstOccupantReligion.toLowerCase()} occupants`)
        }
        
        setCompatibilityIssues(issues)
    }, [roomNumber, propertyDetails, roomOccupants, fullUserData])
    
    // Simple handler for room number changes
    const handleRoomChange = (e) => {
        const newRoomNumber = Math.max(1, parseInt(e.target.value) || 1)
        setRoomNumber(newRoomNumber)
        setErrorMessage("") // Clear error when room changes
    }
    
    // Handle allocation submission
    const handleAllocate = async () => {
        if (!propertyDetails || !fullUserData) return;
        
        // Prevent allocation if there are compatibility issues
        if (compatibilityIssues.length > 0) {
            toast.error("Cannot allocate due to compatibility issues")
            return
        }
        
        setLoading(true)
        setErrorMessage("")
        
        try {
            console.log("Allocating room with data:", {
                propertyId: property.id,
                userId: user.id,
                roomNumber
            })
            
            const response = await fetch("/api/properties/allocate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    propertyId: property.id,
                    userId: user.id,
                    roomNumber
                })
            })
            
            // Get the full response text for debugging
            const responseText = await response.text()
            console.log("Server response:", responseText)
            
            // Parse the response if possible
            let errorData = null
            try {
                errorData = JSON.parse(responseText)
            } catch (e) {
                console.error("Failed to parse response:", e)
            }
            
            if (!response.ok) {
                const errorMsg = errorData?.message || "Failed to allocate room"
                setErrorMessage(errorMsg)
                throw new Error(errorMsg)
            }
            
            const data = errorData || {}
            toast.success(data.message || "Room allocated successfully")
            onSuccess(data)
            onClose()
        } catch (error) {
            console.error("Error:", error)
            toast.error(error.message || "Failed to allocate room")
        } finally {
            setLoading(false)
        }
    }
    
    // Loading state
    if (!propertyDetails || !fullUserData) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Loading Details</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4">
                        <LoadingSpinner />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }
    
    // Prepare display values
    const pricePerPerson = propertyDetails.price
    const roomCapacity = propertyDetails.roomSharing ? propertyDetails.tenantsPerRoom : 1
    const currentRoomOccupants = roomOccupants[roomNumber] || []
    const roomAvailableSpaces = roomCapacity - currentRoomOccupants.length
    
    // Format gender and religion for display
    const formatGender = (gender) => {
        if (!gender) return "Not specified";
        return gender.toLowerCase();
    };

    const formatReligion = (religion) => {
        if (!religion) return "Not specified";
        return religion.toLowerCase();
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Allocate Room to {fullUserData.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <p className="text-sm text-zinc-500">
                            Property: {propertyDetails.location}
                        </p>
                        <p className="text-sm text-zinc-500">
                            Price per person: ${pricePerPerson}
                        </p>
                        <div className="space-y-2">
                            <p className="text-sm text-zinc-500">
                                Student: {fullUserData.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                    Gender: {formatGender(fullUserData.gender)}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                    Religion: {formatReligion(fullUserData.religion)}
                                </Badge>
                            </div>
                        </div>
                        
                        {propertyDetails.roomSharing && (
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-zinc-500">
                                    Shared Room:
                                </p>
                                <Badge variant="secondary">
                                    {propertyDetails.tenantsPerRoom} tenants per room
                                </Badge>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        <Label>Room Number</Label>
                        <Input
                            type="number"
                            min={1}
                            max={propertyDetails.bedrooms}
                            value={roomNumber}
                            onChange={handleRoomChange}
                        />
                        
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-zinc-500">
                                Room {roomNumber} Status:
                            </p>
                            <Badge variant={roomAvailableSpaces > 0 ? "success" : "destructive"}>
                                {currentRoomOccupants.length}/{roomCapacity} occupied
                            </Badge>
                        </div>
                        
                        {currentRoomOccupants.length > 0 && (
                            <div className="border rounded-lg p-3 space-y-2">
                                <p className="text-sm font-medium">Current Occupants:</p>
                                <div className="space-y-2">
                                    {currentRoomOccupants.map((occupant) => (
                                        <div key={occupant.id} className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-zinc-500" />
                                            <span className="text-sm">{occupant.user.name}</span>
                                            {occupant.user.gender && (
                                                <Badge variant="outline" size="sm" className="capitalize text-xs px-1.5 py-0">
                                                    {occupant.user.gender.toLowerCase()}
                                                </Badge>
                                            )}
                                            {occupant.user.religion && (
                                                <Badge variant="outline" size="sm" className="capitalize text-xs px-1.5 py-0">
                                                    {occupant.user.religion.toLowerCase()}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {compatibilityIssues.length > 0 && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Allocation Issues</AlertTitle>
                            <AlertDescription className="mt-2">
                                <ul className="list-disc pl-5 space-y-1">
                                    {compatibilityIssues.map((issue, index) => (
                                        <li key={index} className="text-sm">{issue}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {errorMessage && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Allocation Failed</AlertTitle>
                            <AlertDescription className="mt-2">
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAllocate} 
                        disabled={loading || compatibilityIssues.length > 0}
                    >
                        {loading ? <LoadingSpinner /> : "Allocate Room"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}