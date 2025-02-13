// src/components/dashboard/messages/MessageList.jsx
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useRef } from "react"
import { useEffect } from "react"



export function MessageList({ messages, userId }) {

  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


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

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isSentByMe = message.senderId === userId
          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col space-y-1",
                isSentByMe ? "items-end ml-auto" : "items-start mr-auto", // Swapped alignment
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
  )
}