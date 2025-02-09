import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Send } from "lucide-react"

export function Messages() {
  const messages = [
    {
      id: 1,
      sender: {
        name: "Alice Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"
      },
      property: "City Center Apartment",
      message: "Hi, is this property still available?",
      time: "2 hours ago",
      unread: true
    },
    // Add more messages...
  ]

  return (
    <div className="rounded-xl border bg-white dark:bg-zinc-950">
      <div className="flex h-[600px]">
        {/* Conversations List */}
        <div className="w-1/3 border-r">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 h-4 w-4" />
              <Input
                placeholder="Search messages..."
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(600px-73px)]">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer border-b"
              >
                <Avatar>
                  <AvatarImage src={message.sender.avatar} />
                  <AvatarFallback>
                    {message.sender.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{message.sender.name}</p>
                    <span className="text-xs text-zinc-500">{message.time}</span>
                  </div>
                  <p className="text-sm text-zinc-500 truncate">{message.property}</p>
                </div>
                {message.unread && (
                  <div className="w-2 h-2 bg-sky-500 rounded-full" />
                )}
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Alice Smith</h3>
            <p className="text-sm text-zinc-500">City Center Apartment</p>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {/* Chat messages go here */}
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input placeholder="Type a message..." />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}