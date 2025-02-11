import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users2Icon, UserCheck, CheckCircleIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"

export function ChatHeader({ conversation, onAllocate, allocating }) {
  return (
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
            <Users2Icon className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="font-medium">{conversation.owner.name}</p>
            <p className="text-sm text-zinc-500">{conversation.owner.email}</p>
          </div>
        </div>
        
        {conversation.property.status === 'AVAILABLE' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Allocate Property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Allocate Property</DialogTitle>
                <DialogDescription>
                  Are you sure you want to allocate this property to {conversation.owner.name}?
                  This will mark the property as rented.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {}}
                  disabled={allocating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={onAllocate}
                  disabled={allocating}
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  {allocating ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Allocating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Confirm Allocation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}