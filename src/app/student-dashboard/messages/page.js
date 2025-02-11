"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  MessageSquareIcon,
  HomeIcon,
  SearchIcon,
  Send as SendIcon,
  ArrowLeftIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLandlord, setSelectedLandlord] = useState(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sending, setSending] = useState(false)

  const truncateText = (text, maxLength = 40) => {
    return text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  const formatDate = (date) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/messages")
        if (!response.ok) throw new Error("Failed to fetch messages")
        const data = await response.json()
        setConversations(Object.values(data))
      } catch (error) {
        console.error("Error:", error)
        setError("Failed to load messages")
        toast.error("Failed to load messages")
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedLandlord || sending) return

    setSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          propertyId: selectedLandlord.messages[0].propertyId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const { data: newMessageData } = await response.json()

      // Update conversations with new message
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.owner.id === selectedLandlord.owner.id) {
            return {
              ...conv,
              messages: [...conv.messages, newMessageData].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              )
            }
          }
          return conv
        })
      )

      // Update selected landlord messages
      setSelectedLandlord(prev => ({
        ...prev,
        messages: [...prev.messages, newMessageData].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )
      }))

      setNewMessage("")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(({ owner, messages }) => 
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    messages.some(m => 
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.property.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-zinc-950">
      {/* Sidebar */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations"
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center p-4 text-zinc-500">
                {searchQuery ? "No conversations found" : "No messages yet"}
              </div>
            ) : (
              filteredConversations.map(({ owner, messages }) => {
                const latestMessage = messages[messages.length - 1]

                return (
                  <button
                    key={owner.id}
                    onClick={() => setSelectedLandlord({ owner, messages })}
                    className={cn(
                      "w-full p-3 flex items-start gap-3 rounded-lg transition-colors",
                      selectedLandlord?.owner.id === owner.id
                        ? "bg-sky-50 dark:bg-sky-900/20"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                      <MessageSquareIcon className="w-5 h-5 text-sky-500" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className="font-medium truncate">{owner.name}</p>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(latestMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate">
                        {messages[0].property.location}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-1">
                        {truncateText(latestMessage.content)}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedLandlord ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                  <MessageSquareIcon className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <p className="font-medium">{selectedLandlord.owner.name}</p>
                  <p className="text-sm text-zinc-500">{selectedLandlord.owner.email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedLandlord.messages.map((message) => {
                  const isSentByMe = message.senderId === session?.user?.id;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col space-y-1",
                        isSentByMe ? "items-end ml-auto" : "items-start mr-auto",
                        "max-w-[80%]"
                      )}
                    >
                      <Card
                        className={cn(
                          "p-3 shadow-sm",
                          isSentByMe
                            ? "bg-sky-500 text-white dark:bg-sky-600"
                            : "bg-zinc-100 dark:bg-zinc-800"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                      </Card>
                      <span className="text-xs text-zinc-500 px-1">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sending}
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  {sending ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}