"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquareIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ContactDialog({ open, onOpenChange, property }) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Input validation
    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    if (!property?.id) {
      toast.error("Property information is missing")
      return
    }

    setIsSending(true)
    try {
      // Using the new conversations endpoint
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message.trim(),
          propertyId: property.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      toast.success("Message sent successfully")
      setMessage("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error:", error)
      toast.error(error.message || "Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (!isSending) {
      setMessage("")
      onOpenChange(false)
    }
  }

  if (!property || !property.owner) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Landlord</DialogTitle>
          <DialogDescription>
            Send a message about {property.location}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">To: {property.owner.name}</p>
            <p className="text-sm text-zinc-500">{property.owner.email}</p>
            {property.price && (
              <p className="text-sm text-zinc-500">
                Price: ${property.price.toLocaleString()}/room
              </p>
            )}
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            required
            disabled={isSending}
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">
              {message.length}/1000 characters
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSending}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSending || !message.trim()}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquareIcon className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}