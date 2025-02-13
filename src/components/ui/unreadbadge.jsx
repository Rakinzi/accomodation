import { cn } from "@/lib/utils"

export function UnreadBadge({ count }) {
    if (count === 0) return null

    return (
        <div className={cn(
            "absolute -top-1 -right-1",
            "flex items-center justify-center",
            "w-5 h-5 text-xs font-medium",
            "bg-red-500 text-white rounded-full"
        )}>
            {count > 99 ? '99+' : count}
        </div>
    )
}