export function LoadingSpinner() {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-sky-500" />
      </div>
    )
  }