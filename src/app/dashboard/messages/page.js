"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { SearchIcon, Users2Icon, SendIcon, ArrowLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { RoomAllocationDialog } from "@/components/dashboard/messages/RoomAllocationDialog"

export default function MessagesPage() {
    // States
    const { data: session } = useSession()
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [newMessage, setNewMessage] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)
    const [showAllocationDialog, setShowAllocationDialog] = useState(false)
    const [occupancyStatus, setOccupancyStatus] = useState(null)
    const [unallocating, setUnallocating] = useState(false)

    // Scroll to bottom function
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Auto-scroll effect
    useEffect(() => {
        if (selectedConversation?.messages?.length > 0) {
            scrollToBottom()
        }
    }, [selectedConversation?.messages])

    // Helper functions
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

    // Fetch messages effect
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch("/api/messages")
                if (!response.ok) throw new Error("Failed to fetch messages")
                const data = await response.json()
                setConversations(data)

                if (selectedConversation) {
                    const updatedConversation = data.find(
                        conv => conv.property.id === selectedConversation.property.id
                    )
                    if (updatedConversation) {
                        setSelectedConversation({
                            ...updatedConversation,
                            messages: updatedConversation.messages.map(message => ({
                                ...message,
                                isRead: message.senderId === session?.user?.id ? true :
                                    selectedConversation.messages.find(m => m.id === message.id)?.isRead || false
                            }))
                        })
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
    }, [selectedConversation?.property.id, session?.user?.id])

    // Check occupancy status effect
    useEffect(() => {
        const checkOccupancyStatus = async () => {
            if (!selectedConversation || !session?.user) return

            try {
                const partner = getConversationPartner(selectedConversation)
                const response = await fetch(
                    `/api/properties/${selectedConversation.property.id}/occupancy?userId=${partner.id}`
                )
                if (!response.ok) throw new Error("Failed to fetch occupancy status")
                const data = await response.json()
                setOccupancyStatus(data)
            } catch (error) {
                console.error("Error checking occupancy status:", error)
                toast.error("Failed to check occupancy status")
            }
        }

        checkOccupancyStatus()
    }, [selectedConversation, session?.user])

    // Get conversation partner
    const getConversationPartner = (conversation) => {
        const isOwner = conversation.owner.id === session?.user?.id
        const messages = conversation.messages
        if (isOwner && messages.length > 0) {
            const otherMessage = messages.find(m => m.senderId !== session?.user?.id)
            if (otherMessage) {
                return otherMessage.sender
            }
        }
        return conversation.owner
    }

    // Handle send message
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConversation || sending) return

        setSending(true)
        try {
            const response = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: newMessage.trim(),
                    propertyId: selectedConversation.property.id,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to send message")
            }

            setNewMessage("")

            // Refresh messages
            const messagesResponse = await fetch("/api/messages")
            if (!messagesResponse.ok) throw new Error("Failed to fetch updated messages")

            const data = await messagesResponse.json()
            setConversations(data)

            // Update selected conversation
            const updatedConversation = data.find(
                conv => conv.owner.id === selectedConversation.owner.id
            )
            if (updatedConversation) {
                setSelectedConversation(updatedConversation)
            }
        } catch (error) {
            console.error("Error:", error)
            toast.error(error.message || "Failed to send message")
        } finally {
            setSending(false)
        }
    }

    // Handle unallocation
    const handleUnallocate = async () => {
        if (!selectedConversation || !occupancyStatus?.occupancyDetails || unallocating) return

        setUnallocating(true)
        try {
            const response = await fetch(`/api/properties/${selectedConversation.property.id}/unallocate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    occupancyId: occupancyStatus.occupancyDetails.id
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to unallocate rooms")
            }

            toast.success("Rooms unallocated successfully")
            setOccupancyStatus(prev => ({ ...prev, isOccupant: false, occupancyDetails: null }))
        } catch (error) {
            console.error("Error:", error)
            toast.error(error.message || "Failed to unallocate rooms")
        } finally {
            setUnallocating(false)
        }
    }

    // Handle conversation selection
    const handleSelectConversation = async (conversation) => {
        setSelectedConversation(conversation)
        const unreadMessageIds = conversation.messages
            .filter(m => !m.isRead && m.senderId !== session?.user?.id)
            .map(m => m.id)

        if (unreadMessageIds.length > 0) {
            try {
                const response = await fetch('/api/messages/read', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ messageIds: unreadMessageIds }),
                })

                if (!response.ok) throw new Error('Failed to mark messages as read')

                setConversations(prev =>
                    prev.map(conv => {
                        if (conv.owner.id === conversation.owner.id) {
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

    // Loading state
    if (loading) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    // Error state
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

    // Filter and sort conversations
    const filteredConversations = conversations
        .filter(conversation => {
            const searchTerm = searchQuery.toLowerCase()
            const partner = getConversationPartner(conversation)
            return (
                partner.name.toLowerCase().includes(searchTerm) ||
                conversation.property.location.toLowerCase().includes(searchTerm) ||
                conversation.messages.some(m =>
                    m.content.toLowerCase().includes(searchTerm)
                )
            )
        })
        .sort((a, b) => {
            const aLatest = new Date(a.messages[a.messages.length - 1].createdAt)
            const bLatest = new Date(b.messages[b.messages.length - 1].createdAt)
            return bLatest - aLatest
        })

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-zinc-950">
            {/* Conversations List */}
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
                                const partner = getConversationPartner(conversation)
                                return (
                                    <button
                                        key={conversation.owner.id}
                                        onClick={() => handleSelectConversation(conversation)}
                                        className={cn(
                                            "w-full p-3 flex items-start gap-3 rounded-lg transition-colors relative",
                                            selectedConversation?.owner.id === conversation.owner.id
                                                ? "bg-sky-50 dark:bg-sky-900/20"
                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                        )}
                                    >
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                                                <Users2Icon className="w-5 h-5 text-sky-500" />
                                            </div>
                                            {conversation.unreadCount > 0 && (
                                                <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium bg-red-500 text-white rounded-full">
                                                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex justify-between items-center gap-2">
                                                <p className="font-medium truncate">{partner.name}</p>
                                                <span className="text-xs text-zinc-500 whitespace-nowrap">
                                                    {formatDate(conversation.messages[conversation.messages.length - 1].createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-500 truncate">
                                                {conversation.property.location}
                                            </p>
                                            <p className="text-xs text-zinc-400 truncate mt-1">
                                                {truncateText(conversation.messages[conversation.messages.length - 1].content)}
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
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                                        <Users2Icon className="w-5 h-5 text-sky-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {getConversationPartner(selectedConversation).name}
                                        </p>
                                        <p className="text-sm text-zinc-500">
                                            {getConversationPartner(selectedConversation).email}
                                        </p>
                                    </div>
                                </div>
                                {session?.user?.userType === 'LANDLORD' && (
                                    occupancyStatus?.isOccupant ? (
                                        <Button
                                        variant="destructive"
                                        onClick={handleUnallocate}
                                        disabled={unallocating}
                                        className="ml-auto"
                                    >
                                        {unallocating ? (
                                            <LoadingSpinner className="w-4 h-4" />
                                        ) : (
                                            'Unallocate Rooms'
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAllocationDialog(true)}
                                        className="ml-auto"
                                    >
                                        Allocate Rooms
                                    </Button>
                                )
                            )}
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {selectedConversation.messages.map((message) => {
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

                    {/* Room Allocation Dialog */}
                    {session?.user?.userType === 'LANDLORD' && (
                        <RoomAllocationDialog
                            isOpen={showAllocationDialog}
                            onClose={() => setShowAllocationDialog(false)}
                            property={selectedConversation.property}
                            user={getConversationPartner(selectedConversation)}
                            onSuccess={(data) => {
                                toast.success(`Rooms allocated to ${getConversationPartner(selectedConversation).name}`)
                                setOccupancyStatus({
                                    isOccupant: true,
                                    occupancyDetails: data.occupant
                                })
                                setShowAllocationDialog(false)
                            }}
                        />
                    )}
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