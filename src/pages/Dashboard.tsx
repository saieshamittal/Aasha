import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { AlertTriangle, Users, MapPin, Heart, TrendingUp, Shield, HelpCircle, Bot } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const getStatsForRole = () => {
    switch (user?.role) {
      case "admin":
        return [
          { title: "Active Cases", value: "127", description: "Currently being tracked", icon: Users, trend: "+12%" },
          { title: "Red Zones", value: "23", description: "High-risk areas identified", icon: MapPin, trend: "+3" },
          { title: "Survivors Helped", value: "1,847", description: "Total since platform launch", icon: Heart, trend: "+156" },
          { title: "Active Missions", value: "8", description: "Ongoing rescue operations", icon: Shield, trend: "2 completed today" },
        ]
      case "ngo":
        return [
          { title: "My Cases", value: "34", description: "Cases assigned to your organization", icon: Users, trend: "+5 this week" },
          { title: "Pending Reports", value: "7", description: "Reports awaiting review", icon: AlertTriangle, trend: "2 urgent" },
          { title: "Therapy Sessions", value: "89", description: "Sessions completed this month", icon: Heart, trend: "+23%" },
          { title: "Success Rate", value: "94%", description: "Successful interventions", icon: TrendingUp, trend: "+2%" },
        ]
      case "guest":
        return [
          { title: "Resources Available", value: "1,200+", description: "Help resources and guides", icon: HelpCircle, trend: "Updated daily" },
          { title: "Support Channels", value: "24/7", description: "Always available assistance", icon: Bot, trend: "Instant response" },
          { title: "Safe Locations", value: "150+", description: "Verified safe houses nearby", icon: MapPin, trend: "Real-time updates" },
          { title: "Success Stories", value: "500+", description: "Inspiring survivor journeys", icon: Heart, trend: "New stories weekly" },
        ]
      default:
        return []
    }
  }

  const stats = getStatsForRole()

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case "admin":
        return "Here's an overview of the platform's current status."
      case "ngo":
        return "Here's your organization's current activity summary."
      case "guest":
        return "Access resources, submit reports, and get help safely."
      default:
        return "Welcome to the platform."
    }
  }

  const recentAlerts = [
    {
      id: 1,
      type: "High Priority",
      message: "Suspicious activity reported in Zone 7",
      time: "2 minutes ago",
      status: "active",
    },
    {
      id: 2,
      type: "Rescue Update",
      message: "Operation Delta completed successfully",
      time: "1 hour ago",
      status: "completed",
    },
    {
      id: 3,
      type: "New Report",
      message: "Anonymous tip received via WhatsApp",
      time: "3 hours ago",
      status: "pending",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-gray-600">{getWelcomeMessage()}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600">{stat.description}</p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stat.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {user?.role === "guest" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Need Immediate Help?</CardTitle>
            <CardDescription className="text-blue-700">
              If you're in immediate danger, contact emergency services. For non-emergency support, use our resources below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">Emergency: 911</button>
              <button
                className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-md"
                onClick={() => navigate('/dashboard/ai-chat')}
              >
                Chat with AI Support
              </button>
              <button
                className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-md"
                onClick={() => navigate('/dashboard/get-help')}
              >
                Find Local Resources
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest system notifications and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          alert.status === "active"
                            ? "destructive"
                            : alert.status === "completed"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {alert.type}
                      </Badge>
                      <span className="text-sm text-gray-600">{alert.time}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used platform features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {user?.role === "admin" ? (
                <>
                  <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Review Pending Reports</span>
                  </button>
                  <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-left">
                    <MapPin className="h-4 w-4" />
                    <span>Update Red Zone Map</span>
                  </button>
                  <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-left">
                    <Users className="h-4 w-4" />
                    <span>Assign New Case</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-left"
                    onClick={() => navigate('/dashboard/submit-report')}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Submit New Report</span>
                  </button>
                  <button
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-left"
                    onClick={() => navigate('/dashboard/therapy-network')}
                  >
                    <Heart className="h-4 w-4" />
                    <span>Schedule Therapy Session</span>
                  </button>
                  <button
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-left"
                    onClick={() => navigate('/dashboard/my-cases')}
                  >
                    <Users className="h-4 w-4" />
                    <span>Update Case Status</span>
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 