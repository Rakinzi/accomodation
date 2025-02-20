"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  MessageSquareIcon,
  SearchIcon,
  Send as SendIcon,
  ArrowLeftIcon,
  HomeIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RoomAllocationDialog } from "@/components/dashboard/messages/RoomAllocationDialog"

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sending, setSending] = useState(false)
  const [showAllocationDialog, setShowAllocationDialog] = useState(false)
  const [isAllocated, setIsAllocated] = useState(false)
  const [isCheckingAllocation, setIsCheckingAllocation] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (selectedStudent?.messages?.length > 0) {
      scrollToBottom()
    }
  }, [selectedStudent?.messages])

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

  const checkAllocationStatus = async (conversation) => {
    setIsCheckingAllocation(true)
    try {
      const response = await fetch(`/api/properties/${conversation.property.id}/occupants/${conversation.partner.id}`)
      if (response.ok) {
        const data = await response.json()
        setIsAllocated(data.isActive)
      }
    } catch (error) {
      console.error('Error checking allocation status:', error)
    } finally {
      setIsCheckingAllocation(false)
    }
  }

  const handleUnallocate = async () => {
    if (!selectedStudent) return

    try {
      const response = await fetch(`/api/properties/${selectedStudent.property.id}/occupants/${selectedStudent.partner.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to unallocate rooms')
      }

      setIsAllocated(false)
      toast.success("Rooms unallocated successfully")
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message || "Failed to unallocate rooms")
    }
  }

  const handleAllocation = async (data) => {
    setShowAllocationDialog(false)
    if (data) {
      setIsAllocated(true)
      toast.success("Rooms allocated successfully")
    }
  }

  const handleSelectStudent = async (conversation) => {
    setSelectedStudent(conversation)
    checkAllocationStatus(conversation)
    const unreadMessageIds = conversation.messages
      .filter(m => !m.isRead && m.senderId !== session?.user?.id)
      .map(m => m.id)

    if (unreadMessageIds.length > 0) {
      try {
        const response = await fetch('/api/conversations/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageIds: unreadMessageIds }),
        })

        if (!response.ok) throw new Error('Failed to mark messages as read')

        setConversations(prev =>
          prev.map(conv => {
            if (conv.partner.id === conversation.partner.id) {
              return {
                ...conv,
                messages: conv.messages.map(m => ({
                  ...m,
                  isRead: m.isRead || unreadMessageIds.includes(m.id)
                })),
                unreadCount: 0
              }
            }
            return conv
          })
        )
      } catch (error) {
        console.error('Error marking messages as read:', error)
        toast.error("Failed to mark messages as read")
      }
    }
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/conversations")
        if (!response.ok) throw new Error("Failed to fetch messages")
        const data = await response.json()
        setConversations(data)

        if (selectedStudent) {
          const updatedConversation = data.find(
            conv => conv.id === selectedStudent.id
          )
          if (updatedConversation) {
            const mergedConversation = {
              ...updatedConversation,
              messages: updatedConversation.messages.map(message => ({
                ...message,
                isRead: message.senderId === session?.user?.id ? true :
                  selectedStudent.messages.find(m => m.id === message.id)?.isRead || false
              }))
            }
            setSelectedStudent(mergedConversation)
          }
        }
      } catch (error) {
        console.error("Error:", error)
        setError("Failed to load messages")
        toast.error("Failed to load messages")
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [selectedStudent?.id, session?.user?.id])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedStudent || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/conversations/${selectedStudent.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim()
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setNewMessage("")

      const messagesResponse = await fetch("/api/conversations")
      if (!messagesResponse.ok) throw new Error("Failed to fetch updated messages")

      const data = await messagesResponse.json()
      setConversations(data)

      const updatedConversation = data.find(
        conv => conv.id === selectedStudent.id
      )
      if (updatedConversation) {
        setSelectedStudent(updatedConversation)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations
    .filter(({ partner, messages, property }) =>
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      messages.some(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

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
              filteredConversations.map((conversation) => {
                const { partner, messages, unreadCount, property } = conversation
                const latestMessage = messages[messages.length - 1]

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectStudent(conversation)}
                    className={cn(
                      "w-full p-3 flex items-start gap-3 rounded-lg transition-colors relative",
                      selectedStudent?.id === conversation.id
                        ? "bg-sky-50 dark:bg-sky-900/20"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                        <MessageSquareIcon className="w-5 h-5 text-sky-500" />
                      </div>
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium bg-red-500 text-white rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className="font-medium truncate">{partner.name}</p>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(latestMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate">
                        {property.location}
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
        {selectedStudent ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                    <MessageSquareIcon className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedStudent.partner.name}</p>
                    <p className="text-sm text-zinc-500">{selectedStudent.partner.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isAllocated ? "destructive" : "default"}
                    size="sm"
                    disabled={isCheckingAllocation}
                    onClick={isAllocated ? handleUnallocate : () => setShowAllocationDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <HomeIcon className="w-4 h-4" />
                    {isCheckingAllocation ? (
                      <LoadingSpinner className="w-4 h-4" />
                    ) : isAllocated ? (
                      "Unallocate"
                    ) : (
                      "Allocate"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedStudent.messages.map((message) => {
                  const isSentByMe = message.senderId === session?.user?.id

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
                <div ref={messagesEndRef} />
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
      {/* Add this just before the final closing div */}
      {showAllocationDialog && (
        <RoomAllocationDialog
          isOpen={showAllocationDialog}
          onClose={() => setShowAllocationDialog(false)}
          property={selectedStudent?.property}
          user={selectedStudent?.partner}
          onSuccess={handleAllocation}
        />
      )}
    </div>
  )
}