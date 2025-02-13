// src/components/dashboard/messages/ConversationList.jsx
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SearchIcon, Users2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export function ConversationList({
    conversations,
    searchQuery,
    setSearchQuery,
    selectedConversation,
    onSelectConversation
}) {
    const { data: session } = useSession()

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

    const truncateText = (text, maxLength = 40) => {
        return text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    }

    // Filter out conversations where the user is the owner
    const filteredConversations = conversations
        .filter(conversation => conversation.owner.id !== session?.user?.id)
        .filter(({ owner, messages, property }) =>
            owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            messages.some(m =>
                m.content.toLowerCase().includes(searchQuery.toLowerCase())
            ) ||
            property.location.toLowerCase().includes(searchQuery.toLowerCase())
        )

    const handleConversationSelect = useCallback(async (conversation) => {
        onSelectConversation(conversation)

        // Get unread message IDs
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

                if (!response.ok) {
                    throw new Error('Failed to mark messages as read')
                }

                // Update local state to reflect read status
                conversation.messages.forEach(m => {
                    if (unreadMessageIds.includes(m.id)) {
                        m.isRead = true
                    }
                })
            } catch (error) {
                console.error('Error marking messages as read:', error)
                toast.error("Failed to mark messages as read")
            }
        }
    }, [onSelectConversation, session?.user?.id])

    return (
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
                <div className="p-2 space-y-2">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center p-4 text-zinc-500">
                            {searchQuery ? "No conversations found" : "No messages yet"}
                        </div>
                    ) : (
                        filteredConversations.map(conversation => {
                            const { owner, messages, property, unreadCount } = conversation
                            const latestMessage = messages[messages.length - 1]

                            return (
                                <button
                                    key={owner.id}
                                    onClick={() => handleConversationSelect(conversation)}
                                    className={cn(
                                        "w-full p-3 flex items-start gap-3 rounded-lg transition-colors",
                                        selectedConversation?.owner.id === owner.id
                                            ? "bg-sky-50 dark:bg-sky-900/20"
                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                    )}
                                >
                                    <div className="relative h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                                            <Users2Icon className="w-5 h-5 text-sky-500" />
                                        </div>
                                        {unreadCount > 0 && (
                                            <Badge 
                                                variant="secondary"
                                                className="absolute -top-2 -right-2 bg-sky-500 text-white hover:bg-sky-500"
                                            >
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center gap-2">
                                            <p className="font-medium truncate">{owner.name}</p>
                                            <span className="text-xs text-zinc-500 whitespace-nowrap">
                                                {formatDate(latestMessage.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-500 truncate">
                                            {property.location}
                                        </p>
                                        <p className={cn(
                                            "text-xs truncate mt-1",
                                            unreadCount > 0
                                                ? "font-medium text-sky-600 dark:text-sky-400"
                                                : "text-zinc-400"
                                        )}>
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
    )
}