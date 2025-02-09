import { Navbar } from "@/components/ui/dashboard/NavBar"

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}