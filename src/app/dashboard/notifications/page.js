"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner"
import { toast } from "sonner"
import {
  Bell,
  User,
  Home,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Filter,
  RefreshCw,
  Check,
  Search,
  DoorOpen
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function AdminNotifications() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProperty, setFilterProperty] = useState("")
  const [properties, setProperties] = useState([])

  // Verify admin role
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.userType !== "ADMIN" && session?.user?.userType !== "LANDLORD") {
        router.push("/dashboard");
        toast.error("Unauthorized access");
      }
    }
  }, [status, session, router]);

  // Fetch notifications every 5 seconds
  useEffect(() => {
    if (status === "authenticated" && (session?.user?.userType === "ADMIN" || session?.user?.userType === "LANDLORD")) {
      fetchNotifications();
      fetchProperties();
      
      const interval = setInterval(() => {
        fetchNotifications();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [status, session, activeTab, filterProperty]);

  const fetchNotifications = async () => {
    try {
      let url = `/api/admin/notifications?type=TENANT_LEFT`;
      if (activeTab === "unread") {
        url += "&unread=true";
      }
      if (filterProperty) {
        url += `&propertyId=${filterProperty}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch("/api/admin/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications/mark-all-read", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          read: true
        }))
      );
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const viewProperty = (propertyId) => {
    router.push(`/dashboard/properties/${propertyId}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
  };

  // Filter notifications based on search query
  const filteredNotifications = notifications.filter(notification => {
    if (!searchQuery) return true;
    
    // Try to parse metadata for additional searchable fields
    let metadata = {};
    try {
      metadata = JSON.parse(notification.metadata || "{}");
    } catch (e) {
      // If parsing fails, just use empty object
    }
    
    return (
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metadata.propertyLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metadata.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p>Please log in to view notifications</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-xl text-red-500">{error}</p>
        <Button 
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchNotifications();
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Bell className="h-6 w-6 text-blue-500" />
                  Student Room Departure Notifications
                </CardTitle>
                <CardDescription>
                  Notifications when students leave their allocated rooms
                </CardDescription>
              </div>
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  onClick={markAllAsRead}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Mark All as Read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex-1 md:max-w-xs">
                  <select 
                    className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    value={filterProperty}
                    onChange={(e) => setFilterProperty(e.target.value)}
                  >
                    <option value="">All Properties</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <Tabs 
                defaultValue="all" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread" className="relative">
                      Unread
                      {unreadCount > 0 && (
                        <Badge 
                          className="ml-2 bg-red-500 hover:bg-red-600"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchNotifications()}
                    className="text-sm flex items-center gap-1 p-2"
                  >
<RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>

                <TabsContent value="all" className="space-y-4">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="mt-4 text-zinc-500 dark:text-zinc-400">No notifications to display</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotifications.map((notification) => {
                        let metadata = {};
                        try {
                          metadata = JSON.parse(notification.metadata || "{}");
                        } catch (e) {
                          // If parsing fails, use empty object
                        }
                        
                        return (
                          <Card 
                            key={notification.id}
                            className={`transition-colors ${
                              !notification.read
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'
                                : ''
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                  <DoorOpen className="h-5 w-5 text-orange-500" />
                                </div>
                                <div className="flex-grow space-y-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium">{notification.title}</h4>
                                    <div className="flex gap-2 items-center">
                                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {formatDate(notification.createdAt)}
                                      </span>
                                      {!notification.read && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 rounded-full"
                                          onClick={() => markAsRead(notification.id)}
                                        >
                                          <CheckCircle className="h-4 w-4 text-blue-500" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                    {notification.message}
                                  </p>
                                  
                                  {metadata && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {metadata.propertyLocation && (
                                        <Badge variant="outline" className="gap-1 items-center">
                                          <Home className="h-3 w-3" />
                                          {metadata.propertyLocation}
                                        </Badge>
                                      )}
                                      {metadata.roomNumber && (
                                        <Badge variant="outline" className="gap-1 items-center">
                                          <DoorOpen className="h-3 w-3" />
                                          Room {metadata.roomNumber}
                                        </Badge>
                                      )}
                                      {metadata.studentName && (
                                        <Badge variant="outline" className="gap-1 items-center">
                                          <User className="h-3 w-3" />
                                          {metadata.studentName}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="pt-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => metadata.propertyId && viewProperty(metadata.propertyId)}
                                    >
                                      <Home className="mr-1 h-3 w-3" />
                                      View Property
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                  {unreadCount === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="mt-4 text-zinc-500 dark:text-zinc-400">No unread notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotifications
                        .filter(notification => !notification.read)
                        .map((notification) => {
                          let metadata = {};
                          try {
                            metadata = JSON.parse(notification.metadata || "{}");
                          } catch (e) {
                            // If parsing fails, use empty object
                          }
                          
                          return (
                            <Card 
                              key={notification.id}
                              className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30"
                            >
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  <div className="flex-shrink-0 mt-1">
                                    <DoorOpen className="h-5 w-5 text-orange-500" />
                                  </div>
                                  <div className="flex-grow space-y-1">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-medium">{notification.title}</h4>
                                      <div className="flex gap-2 items-center">
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                          {formatDate(notification.createdAt)}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 rounded-full"
                                          onClick={() => markAsRead(notification.id)}
                                        >
                                          <CheckCircle className="h-4 w-4 text-blue-500" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                      {notification.message}
                                    </p>
                                    
                                    {metadata && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {metadata.propertyLocation && (
                                          <Badge variant="outline" className="gap-1 items-center">
                                            <Home className="h-3 w-3" />
                                            {metadata.propertyLocation}
                                          </Badge>
                                        )}
                                        {metadata.roomNumber && (
                                          <Badge variant="outline" className="gap-1 items-center">
                                            <DoorOpen className="h-3 w-3" />
                                            Room {metadata.roomNumber}
                                          </Badge>
                                        )}
                                        {metadata.studentName && (
                                          <Badge variant="outline" className="gap-1 items-center">
                                            <User className="h-3 w-3" />
                                            {metadata.studentName}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    
                                    <div className="pt-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-xs h-7"
                                        onClick={() => metadata.propertyId && viewProperty(metadata.propertyId)}
                                      >
                                        <Home className="mr-1 h-3 w-3" />
                                        View Property
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}