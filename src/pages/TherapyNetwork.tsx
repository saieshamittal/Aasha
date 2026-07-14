import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { 
  Heart, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Clock, 
  Users, 
  Filter,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { useTherapists, Therapist } from '../hooks/useTherapists'

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function TherapyNetwork() {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all")
  const [scheduling, setScheduling] = useState<string | null>(null)
  const [meetLinks, setMeetLinks] = useState<{ [id: string]: string }>({})
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const { therapists, loading, error, refresh } = useTherapists(filterSpecialty)

  // Get all specialties from loaded therapists
  const allSpecialties = Array.from(new Set(therapists.map(t => t.specialization))).filter(Boolean).sort()

  // Filter by search term (client-side)
  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = 
      therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (therapist.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    return matchesSearch
  })

  // Compute therapistsToShow
  const isAllSpecializations = filterSpecialty === 'all'
  const therapistsToShow = isAllSpecializations && !showAll
    ? filteredTherapists.slice(0, 5)
    : filteredTherapists

  // Reset showAll when specialization changes
  useEffect(() => {
    setShowAll(false)
  }, [filterSpecialty])

  // Handler to schedule a meet
  const handleScheduleMeet = async (therapist: Therapist) => {
    setScheduling(therapist._id)
    setScheduleError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/therapists/${therapist._id}/schedule`, { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setMeetLinks(prev => ({ ...prev, [therapist._id]: data.meetLink }))
      } else {
        setScheduleError(data.message || 'Failed to schedule meet')
      }
    } catch (err) {
      setScheduleError('Error scheduling meet')
    } finally {
      setScheduling(null)
    }
  }

  console.log(therapists);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Therapy Network</h1>
        <p className="text-gray-600">Connect with specialized therapists and mental health professionals</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <Input
          placeholder="Search therapists, specializations, or institutions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select 
          value={filterSpecialty} 
          onChange={(e) => setFilterSpecialty(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          <option value="all">All Specialties</option>
          {allSpecialties.map(specialty => (
            <option key={specialty} value={specialty}>{specialty}</option>
          ))}
        </select>
        <Badge variant="outline">{filteredTherapists.length} therapists found</Badge>
        <Button onClick={refresh} variant="outline" size="sm">Refresh</Button>
      </div>

      {loading && <div className="text-center text-gray-500">Loading therapists...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}

      {/* Therapists Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {therapistsToShow.map((therapist) => (
          <Card 
            key={therapist._id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedTherapist(therapist)}
          >
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{therapist.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {therapist.institution}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {therapist.specialization}
                </Badge>
                <p className="text-sm text-gray-600">{therapist.notes}</p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{therapist.availability}</span>
                <span className="text-gray-600">{therapist.preferred_mode}</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span>{therapist.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span>{therapist.languages.join(', ')}</span>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={scheduling === therapist._id}
                  onClick={() => handleScheduleMeet(therapist)}
                  className="w-full"
                >
                  {scheduling === therapist._id ? 'Scheduling...' : 'Schedule Meet'}
                </Button>
                {meetLinks[therapist._id] && (
                  <div className="mt-2 text-green-600 text-xs break-all">
                    Meet Link: <a href={meetLinks[therapist._id]} target="_blank" rel="noopener noreferrer" className="underline">{meetLinks[therapist._id]}</a>
                  </div>
                )}
                {scheduleError && (
                  <div className="mt-2 text-red-600 text-xs">{scheduleError}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View More Button */}
      {isAllSpecializations && !showAll && filteredTherapists.length > 5 && (
        <button onClick={() => setShowAll(true)} className="mt-4 text-blue-600 underline">
          View More
        </button>
      )}

      {/* Therapist Detail Modal */}
      {selectedTherapist && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTherapist(null)}
        >
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Therapist Profile - {selectedTherapist.name}</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedTherapist(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <Heart className="h-10 w-10 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedTherapist.name}</h3>
                  <p className="text-gray-600">{selectedTherapist.specialization}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-600">Available: {selectedTherapist.availability}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location & Availability
                  </h3>
                  <p><strong>Institution:</strong> {selectedTherapist.institution}</p>
                  <p><strong>Availability:</strong> {selectedTherapist.availability}</p>
                  <p><strong>Languages:</strong> {selectedTherapist.languages.join(", ")}</p>
                  <p><strong>Preferred Mode:</strong> {selectedTherapist.preferred_mode}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <p><strong>Email:</strong> {selectedTherapist.email}</p>
                  <p><strong>Notes:</strong> {selectedTherapist.notes}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">About</h3>
                <p>{selectedTherapist.notes}</p>
              </div>

              <div className="pt-4 border-t flex gap-2">
                <Button className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Resources */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Emergency Support</CardTitle>
            <CardDescription>24/7 crisis counseling and immediate assistance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <a href="tel:1800274747">
                <Phone className="h-4 w-4 mr-2" />
                Crisis Hotline: 1-800-CRISIS
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <a href="sms:741741?body=HOME">
                <MessageSquare className="h-4 w-4 mr-2" />
                Text Support: HOME to 741741
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support Groups</CardTitle>
            <CardDescription>Connect with other survivors in a safe environment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <a href="https://discord.gg/u97gVa6f" target="_blank" rel="noopener noreferrer">
                <Users className="h-4 w-4 mr-2" />
                Survivor Support Group
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Heart className="h-4 w-4 mr-2" />
              Family & Friends Group
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 