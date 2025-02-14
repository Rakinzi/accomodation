"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import {
  Building2,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  UserCircle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const COLORS = ['#0ea5e9', '#f97316', '#22c55e', '#8b5cf6']

export function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentDateTime, setCurrentDateTime] = useState("")

  useEffect(() => {
    fetchAnalytics()
    // Update time every second
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentDateTime(now.toISOString().slice(0, 19).replace('T', ' '))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [propertiesRes, occupantsRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/properties/occupants')
      ])

      const properties = await propertiesRes.json()
      const occupants = await occupantsRes.json()

      // Calculate metrics
      const totalProperties = properties.length
      const totalOccupants = occupants.length
      const totalRevenue = occupants.reduce((sum, occ) => sum + occ.totalPrice, 0)
      const occupancyRate = (totalOccupants / totalProperties) * 100 || 0

      // Calculate month-over-month changes
      const lastMonthProperties = totalProperties - 2 // Example change
      const lastMonthRevenue = totalRevenue * 0.88 // Example change

      setAnalyticsData({
        stats: [
          {
            title: "Total Properties",
            value: totalProperties,
            icon: Building2,
            change: `${totalProperties - lastMonthProperties} from last month`
          },
          {
            title: "Total Occupants",
            value: totalOccupants,
            icon: Users,
            change: `${occupancyRate.toFixed(1)}% occupancy rate`
          },
          {
            title: "Active Listings",
            value: properties.filter(p => p.status === 'AVAILABLE').length,
            icon: MessageSquare,
            change: "Available for rent"
          },
          {
            title: "Total Revenue",
            value: `$${totalRevenue.toLocaleString()}`,
            icon: TrendingUp,
            change: `+${((totalRevenue / lastMonthRevenue - 1) * 100).toFixed(1)}% from last month`
          }
        ],
        charts: {
          monthlyOccupancy: properties.reduce((acc, prop) => {
            const month = new Date(prop.createdAt).toLocaleString('default', { month: 'short' })
            acc[month] = (acc[month] || 0) + 1
            return acc
          }, {}),
          propertyStatus: [
            { name: 'Available', value: properties.filter(p => p.status === 'AVAILABLE').length },
            { name: 'Occupied', value: properties.filter(p => p.status !== 'AVAILABLE').length }
          ]
        }
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8 m-8">
      {/* Header with DateTime and User */}
     
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {analyticsData.stats.map((stat, index) => {
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Property Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(analyticsData.charts.monthlyOccupancy).map(([month, count]) => ({
                  month,
                  count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.charts.propertyStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {analyticsData.charts.propertyStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}