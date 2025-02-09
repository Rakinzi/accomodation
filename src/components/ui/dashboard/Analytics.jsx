import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Building2,
  MessageSquare,
  TrendingUp,
  Users
} from "lucide-react"

export function Analytics() {
  const stats = [
    {
      title: "Total Properties",
      value: "12",
      icon: Building2,
      change: "+2 from last month"
    },
    {
      title: "Total Inquiries",
      value: "245",
      icon: MessageSquare,
      change: "+18% from last month"
    },
    {
      title: "Active Visitors",
      value: "1,234",
      icon: Users,
      change: "+7% from last week"
    },
    {
      title: "Revenue",
      value: "R45,231",
      icon: TrendingUp,
      change: "+12% from last month"
    }
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-zinc-500">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Add charts here */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inquiry Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}