const API_BASE_URL = import.meta.env.VITE_API_URL;
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { 
  FileText, 
  Upload, 
  MapPin, 
  Calendar, 
  User, 
  AlertTriangle, 
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react'

interface ReportForm {
  incidentType: string
  location: string
  date: string
  time: string
  description: string
  victimCount: number
  perpetratorCount: number
  urgency: "low" | "medium" | "high" | "urgent"
  contactInfo: {
    name: string
    phone: string
    email: string
    anonymous: boolean
  }
  evidence: File[]
  additionalNotes: string
}

export default function SubmitReport() {
  const [formData, setFormData] = useState<ReportForm>({
    incidentType: "",
    location: "",
    date: "",
    time: "",
    description: "",
    victimCount: 0,
    perpetratorCount: 0,
    urgency: "medium",
    contactInfo: {
      name: "",
      phone: "",
      email: "",
      anonymous: false
    },
    evidence: [],
    additionalNotes: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof ReportForm] || {}) as object),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...files]
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  const form = new FormData()

  // Append regular fields
  form.append("incidentType", formData.incidentType)
  form.append("location", formData.location)
  form.append("date", formData.date)
  form.append("time", formData.time)
  form.append("description", formData.description)
  form.append("victimCount", formData.victimCount.toString())
  form.append("perpetratorCount", formData.perpetratorCount.toString())
  form.append("urgency", formData.urgency)
  form.append("additionalNotes", formData.additionalNotes)

  // Append contactInfo as JSON string
  form.append("contactInfo", JSON.stringify(formData.contactInfo))

  // Append files
  formData.evidence.forEach((file) => {
    form.append("evidence", file)
  })

  try {
    const response = await fetch(`${API_BASE_URL}/reports/submit`, {
      method: "POST",
      body: form
    })

    if (!response.ok) throw new Error("Submission failed")

    const data = await response.json()
    console.log("✅ Report submitted:", data)

    setIsSubmitting(false)
    setSubmitted(true)
  } catch (error) {
    console.error("❌ Error submitting report:", error)
    alert("Failed to submit report. Please try again.")
    setIsSubmitting(false)
  }
}


  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent": return "text-red-600"
      case "high": return "text-orange-600"
      case "medium": return "text-yellow-600"
      case "low": return "text-green-600"
      default: return "text-gray-600"
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight mb-2">Report Submitted Successfully</h1>
          <p className="text-gray-600 mb-6">Thank you for your report. Our team will review it and take appropriate action.</p>
          <div className="space-y-4 max-w-md mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Report ID: RP-{Date.now()}</span>
                </div>
                <p className="text-sm text-gray-600">Keep this ID for future reference</p>
              </CardContent>
            </Card>
            <Button onClick={() => setSubmitted(false)} className="w-full">
              Submit Another Report
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submit Report</h1>
        <p className="text-gray-600">Report suspicious activity or incidents securely and anonymously</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Incident Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Incident Details
            </CardTitle>
            <CardDescription>Provide information about the incident you're reporting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Type of Incident</label>
                <select 
                  value={formData.incidentType}
                  onChange={(e) => handleInputChange('incidentType', e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                  required
                >
                  <option value="">Select incident type</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="recruitment">Recruitment Attempt</option>
                  <option value="trafficking">Human Trafficking</option>
                  <option value="exploitation">Exploitation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Urgency Level</label>
                <select 
                  value={formData.urgency}
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  placeholder="Enter location details"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Time</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Number of Victims</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.victimCount}
                  onChange={(e) => handleInputChange('victimCount', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <textarea
                placeholder="Provide a detailed description of the incident..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 resize-none"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Your contact information (optional for anonymous reports)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.contactInfo.anonymous}
                onChange={(e) => handleInputChange('contactInfo.anonymous', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="anonymous" className="text-sm">Submit anonymously</label>
            </div>

            {!formData.contactInfo.anonymous && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    placeholder="Your name"
                    value={formData.contactInfo.name}
                    onChange={(e) => handleInputChange('contactInfo.name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input
                    placeholder="Phone number"
                    value={formData.contactInfo.phone}
                    onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={formData.contactInfo.email}
                    onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Evidence & Documentation
            </CardTitle>
            <CardDescription>Upload any relevant photos, documents, or other evidence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Upload Files</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to select</p>
                <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose Files
                  </Button>

                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />

              </div>
            </div>

            {formData.evidence.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Uploaded Files</label>
                <div className="space-y-2">
                  {formData.evidence.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFiles = formData.evidence.filter((_, i) => i !== index)
                          setFormData(prev => ({ ...prev, evidence: newFiles }))
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Additional Notes</label>
              <textarea
                placeholder="Any additional information or context..."
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                className="w-full h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 text-sm space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>All reports are encrypted and secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Your identity will be protected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Reports are reviewed by trained professionals</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>You can submit anonymously if preferred</span>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setFormData({
              incidentType: "",
              location: "",
              date: "",
              time: "",
              description: "",
              victimCount: 0,
              perpetratorCount: 0,
              urgency: "medium",
              contactInfo: {
                name: "",
                phone: "",
                email: "",
                anonymous: false
              },
              evidence: [],
              additionalNotes: ""
            })}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  )
} 