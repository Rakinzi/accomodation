import { StudentMainNav } from "@/components/ui/student-dashboard/StudentNav";

export default function StudentDashboardLayout({ children }) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <StudentMainNav />
          </div>
        </header>
        
        {children}
      </div>
    )
  }