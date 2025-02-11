"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { ConversationList } from "@/components/dashboard/messages/ConversationList"
import { ChatHeader } from "@/components/dashboard/messages/ChatHeader"
import { MessageList } from "@/components/dashboard/messages/MessageList"
import { MessageInput } from "@/components/dashboard/messages/MessageInput"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"

export default function MessagesPage() {
    const { data: session } = useSession()
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [sending, setSending] = useState(false)

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
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleSendMessage = async (content) => {
        if (!content.trim() || !selectedConversation || sending) return

        setSending(true)
        try {
            const response = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: content.trim(),
                    propertyId: selectedConversation.messages[0].propertyId,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to send message")
            }

            const { data: newMessageData } = await response.json()

            // Update conversations
            setConversations(prevConversations =>
                prevConversations.map(conv => {
                    if (conv.owner.id === selectedConversation.owner.id) {
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

            // Update selected conversation
            setSelectedConversation(prev => ({
                ...prev,
                messages: [...prev.messages, newMessageData].sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                )
            }))
        } catch (error) {
            console.error("Error:", error)
            toast.error(error.message || "Failed to send message")
            throw error
        } finally {
            setSending(false)
        }
    }


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

                // Update conversations to reflect read status
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
            <ConversationList
                conversations={conversations}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
            />

            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        <ChatHeader conversation={selectedConversation} />
                        <MessageList
                            messages={selectedConversation.messages}
                            userId={session?.user?.id}
                        />
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            sending={sending}
                        />
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