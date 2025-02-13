// src/components/dashboard/messages/MessageInput.jsx
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send as SendIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { toast } from "sonner"

export function MessageInput({ onSendMessage, sending }) {
    const [message, setMessage] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!message.trim() || sending) return

        try {
            await onSendMessage(message.trim())
            setMessage("")
        } catch (error) {
            console.error("Error sending message:", error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex gap-2">
                <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={sending}
                />
                <Button
                    type="submit"
                    disabled={!message.trim() || sending}
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
    )
}