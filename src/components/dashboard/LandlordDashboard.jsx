"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { PropertyList } from "./PropertyList"
import { PlusIcon, Clock, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPropertyDialog } from "./AddPropertyDialog"

export function LandlordDashboard() {
  const { data: session } = useSession()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState("")

  useEffect(() => {
    fetchProperties()
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentDateTime(now.toISOString().slice(0, 19).replace('T', ' '))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch(`/api/properties?ownerId=${session?.user?.id}`)
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header with DateTime, User, and Add Property Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-1">
                <UserCircle className="w-4 h-4" />
                <span>{session?.user?.name || 'Loading...'}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowAddProperty(true)}
            className="bg-sky-500 hover:bg-sky-600"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Property List */}
        <PropertyList 
          properties={properties} 
          isLoading={isLoading} 
          onRefresh={fetchProperties}
        />
      </div>

      {/* Add Property Dialog */}
      <AddPropertyDialog
        open={showAddProperty}
        onOpenChange={setShowAddProperty}
        onSuccess={() => {
          fetchProperties() // Refresh the property list
          setShowAddProperty(false)
        }}
      />
    </div>
  )
}