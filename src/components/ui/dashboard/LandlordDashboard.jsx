import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PropertyList } from "./PropertyList"
import { Analytics } from "./Analytics"
import { Messages } from "./Messages"
import { Settings } from "./Settings"
import {
  HomeIcon,
  BarChart3Icon,
  MessageSquareIcon,
  SettingsIcon,
  PlusIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPropertyDialog } from "./AddPropertyDialog"

export function LandlordDashboard() {
  const [showAddProperty, setShowAddProperty] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
          <Button 
            onClick={() => setShowAddProperty(true)}
            className="bg-sky-500 hover:bg-sky-600"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3Icon className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquareIcon className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <PropertyList />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="messages">
            <Messages />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>

      <AddPropertyDialog 
        open={showAddProperty} 
        onOpenChange={setShowAddProperty} 
      />
    </div>
  )
}