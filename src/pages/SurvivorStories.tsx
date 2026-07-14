import React, { useState, useEffect } from 'react'
import { useAuth } from '../components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Calendar, MapPin, User, GraduationCap, Briefcase, Home, X } from 'lucide-react'
import './SurvivorStories.css'; // Import custom CSS for fade-in effect

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface SurvivorStory {
  id: string
  rescueDate: string
  location: string
  exploitationType: "sex" | "labor"
  duration: string
  currentStatus: string
  aspirations: string
  livingConditions: string
  age: number
  gender: string
  source: string
  createdAt?: string
  updatedAt?: string
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

function getDisplay(value: string | number, maxLength: number = 100): string {
  if (typeof value === 'string') {
    return value.length > maxLength ? value.slice(0, maxLength) + '...' : value;
  } else if (typeof value === 'number') {
    return value.toString();
  }
  return '';
}

function truncateText(text: string, maxLen = 80) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

export default function SurvivorStories() {
  const { user } = useAuth()
  const [stories, setStories] = useState<SurvivorStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedStory, setSelectedStory] = useState<SurvivorStory | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [newStory, setNewStory] = useState<Omit<SurvivorStory, 'id'>>({
    rescueDate: "",
    location: "",
    exploitationType: "sex",
    duration: "",
    currentStatus: "",
    aspirations: "",
    livingConditions: "",
    age: 0,
    gender: "",
    source: "",
  })

  // Fetch stories from backend
  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE_URL}/survivor-stories`)
      .then(res => res.json())
      .then(data => {
        setStories(data.data || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load stories from backend.')
        setLoading(false)
      })
  }, [])

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      (story.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (story.aspirations?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || story.exploitationType === filterType
    return matchesSearch && matchesFilter
  })

  const handleInputChange = (field: keyof Omit<SurvivorStory, 'id'>, value: any) => {
    setNewStory(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPosting(true)
    setPostError(null)
    fetch(`${API_BASE_URL}/survivor-stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStory)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStories(prev => [data.data, ...prev])
          setShowAddForm(false)
          setNewStory({
            rescueDate: "",
            location: "",
            exploitationType: "sex",
            duration: "",
            currentStatus: "",
            aspirations: "",
            livingConditions: "",
            age: 0,
            gender: "",
            source: "",
          })
        } else {
          setPostError(data.message || 'Failed to add story.')
        }
        setPosting(false)
      })
      .catch(() => {
        setPostError('Failed to add story. Server error.')
        setPosting(false)
      })
  }

  const resetForm = () => {
    setNewStory({
      rescueDate: "",
      location: "",
      exploitationType: "sex",
      duration: "",
      currentStatus: "",
      aspirations: "",
      livingConditions: "",
      age: 0,
      gender: "",
      source: "",
    })
  }

  if (loading) return <div>Loading survivor stories...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Survivor Stories</h1>
        <p className="text-gray-600">
          Flashcard-style profiles showcasing survivor resilience and recovery journeys
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by location or aspirations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="w-48 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          <option value="all">All Types</option>
          <option value="sex">Sex Trafficking</option>
          <option value="labor">Labor Trafficking</option>
        </select>
        <Button onClick={() => setShowAddForm(true)} className="ml-auto">Add New Survivor Story</Button>
      </div>

      {/* Add New Story Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-[95vw] max-w-2xl space-y-4 relative"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              onClick={() => setShowAddForm(false)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">Add New Survivor Story</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rescue Date</label>
                <Input type="date" value={newStory.rescueDate} onChange={e => handleInputChange('rescueDate', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input value={newStory.location} onChange={e => handleInputChange('location', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exploitation Type</label>
                <select
                  value={newStory.exploitationType}
                  onChange={e => handleInputChange('exploitationType', e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="sex">Sex Trafficking</option>
                  <option value="labor">Labor Trafficking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <Input value={newStory.duration} onChange={e => handleInputChange('duration', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Status</label>
                <Input value={newStory.currentStatus} onChange={e => handleInputChange('currentStatus', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aspirations</label>
                <Input value={newStory.aspirations} onChange={e => handleInputChange('aspirations', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Living Conditions</label>
                <Input value={newStory.livingConditions} onChange={e => handleInputChange('livingConditions', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <Input type="number" value={newStory.age} onChange={e => handleInputChange('age', Number(e.target.value))} required min={0} max={120} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  value={newStory.gender}
                  onChange={e => handleInputChange('gender', e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <Input value={newStory.source} onChange={e => handleInputChange('source', e.target.value)} required />
              </div>
            </div>
            {postError && <div className="text-red-500 text-sm">{postError}</div>}
            <div className="flex gap-2 mt-4 justify-center">
              <Button type="submit" disabled={posting}>{posting ? 'Adding...' : 'Add Story'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm}>Reset</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStories.map((story, idx) => (
          <Card
            key={story.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedStory(story)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Case #{idx + 1}</CardTitle>
                <Badge variant={story.exploitationType === "sex" ? "destructive" : "secondary"}>
                  {story.exploitationType === "sex" ? "Sex Trafficking" : "Labor Trafficking"}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {story.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{getDisplay(story.location, 3)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Rescued: {formatDate(story.rescueDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{getDisplay(story.gender)}, {getDisplay(story.age, 1)} years old</span>
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <GraduationCap className="h-4 w-4" />
                  Aspirations
                </div>
                <div className="text-sm text-gray-700 ml-6">{truncateText(getDisplay(story.aspirations), 60)}</div>
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Briefcase className="h-4 w-4" />
                  Current Status
                </div>
                <div className="text-sm text-gray-700 ml-6">{truncateText(getDisplay(story.currentStatus), 60)}</div>
              </div>
              <Button variant="outline" size="sm" className="w-full bg-transparent mt-2" onClick={e => {e.stopPropagation(); setSelectedStory(story)}}>
                View Full Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Profile Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedStory(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Survivor Profile - Case #{filteredStories.findIndex(s => s.id === selectedStory.id) + 1}</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedStory(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Rescue Details
                  </h3>
                  <p><strong>Date:</strong> {formatDate(selectedStory.rescueDate)}</p>
                  <p><strong>Location:</strong> {selectedStory.location}</p>
                  <p><strong>Duration of Exploitation:</strong> {selectedStory.duration}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" /> Demographics
                  </h3>
                  <p><strong>Age:</strong> {selectedStory.age} years</p>
                  <p><strong>Gender:</strong> {selectedStory.gender}</p>
                  <p><strong>Type:</strong> {selectedStory.exploitationType === "sex" ? "Sex Trafficking" : "Labor Trafficking"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Future Aspirations
                </h3>
                <p>{selectedStory.aspirations}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Home className="h-4 w-4" /> Current Living Conditions
                </h3>
                <p>{selectedStory.livingConditions}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Current Status
                </h3>
                <p>{selectedStory.currentStatus}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600"><strong>Source:</strong> {selectedStory.source}</p>
                {selectedStory.createdAt && <p className="text-xs text-gray-400">Created: {formatDate(selectedStory.createdAt)}</p>}
                {selectedStory.updatedAt && <p className="text-xs text-gray-400">Updated: {formatDate(selectedStory.updatedAt)}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 