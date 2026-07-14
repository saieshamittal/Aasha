const API_BASE_URL = import.meta.env.VITE_API_URL;
"use client"

import React, { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  AlertTriangle, Clock, MapPin, Phone, MessageSquare, Camera, User
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '../../hooks/use-toast'

interface Report {
  id: string
  type: "photo" | "whatsapp" | "web" | "phone"
  status: "pending" | "verified" | "investigating" | "resolved" | "false_alarm"
  priority: "low" | "medium" | "high" | "critical"
  submittedAt: string
  location: string
  description: string
  submitterInfo: {
    anonymous: boolean
    contact?: string
  }
  assignedTo?: string
  evidence: string[]
  aiConfidence?: number
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [ngos, setNGOs] = useState<any[]>([])
  const [ngoLoading, setNGOLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedNGO, setSelectedNGO] = useState<any | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/reports`)
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          // Map backend report fields to frontend Report interface
          const mappedReports: Report[] = json.data.map((r: any) => ({
            id: r._id,
            type: (r.incidentType || 'web'),
            status: r.status || 'pending',
            priority: r.urgency === 'urgent' ? 'critical' : (r.urgency || 'medium'),
            submittedAt: r.createdAt || r.date || '',
            location: r.location || '',
            description: r.description || '',
            submitterInfo: {
              anonymous: r.contactInfo?.anonymous ?? true,
              contact: r.contactInfo?.phone || r.contactInfo?.email || undefined
            },
            assignedTo: r.assignedTo || undefined,
            evidence: Array.isArray(r.evidence) ? r.evidence : [],
            aiConfidence: r.aiConfidence || undefined
          }))
          setReports(mappedReports)
        }
      } catch (err) {
        // Optionally handle error
        console.error('Failed to fetch reports', err)
      }
    }
    fetchReports()
  }, [])

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || report.status === filterStatus
    const matchesPriority = filterPriority === "all" || report.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "default"
      case "verified": return "secondary"
      case "investigating": return "default"
      case "resolved": return "secondary"
      case "false_alarm": return "secondary"
      default: return "secondary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
      case "high": return "destructive"
      case "medium": return "default"
      case "low": return "secondary"
      default: return "secondary"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "photo": return Camera
      case "whatsapp": return MessageSquare
      case "phone": return Phone
      case "web": return AlertTriangle
      default: return AlertTriangle
    }
  }

  const handleExportPDF = (report: Report) => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text(`Report Details - ${report.id}`, 10, 15)

    doc.setFontSize(12)
    doc.text(`Location: ${report.location}`, 10, 30)
    doc.text(`Status: ${report.status}`, 10, 40)
    doc.text(`Priority: ${report.priority}`, 10, 50)
    doc.text(`Submitted At: ${new Date(report.submittedAt).toLocaleString()}`, 10, 60)
    doc.text(`Anonymous: ${report.submitterInfo.anonymous ? "Yes" : "No"}`, 10, 70)

    if (report.submitterInfo.contact) {
      doc.text(`Contact: ${report.submitterInfo.contact}`, 10, 80)
    }

    if (report.aiConfidence) {
      doc.text(`AI Confidence: ${report.aiConfidence}%`, 10, 90)
    }

    if (report.assignedTo) {
      doc.text(`Assigned To: ${report.assignedTo}`, 10, 100)
    }

    doc.text(`\nDescription:`, 10, 110)
    doc.setFontSize(11)
    doc.text(report.description, 10, 120, { maxWidth: 180 })

    doc.setFontSize(12)
    doc.text(`\nEvidence: ${report.evidence.join(", ")}`, 10, 150)

    doc.save(`${report.id}_report.pdf`)
  }

  const handleAssignTeamClick = async () => {
    if (!selectedReport) return;
    setNGOLoading(true);
    setShowAssignModal(true);
    setNGOs([]);
    
    try {
      // Try to parse location for better matching
      const locationParts = selectedReport.location.split(',').map(part => part.trim());
      const city = locationParts[0];
      const locality = locationParts.slice(1).join(', ');
      
      // First try structured query (city + locality)
      let res = await fetch(
  `${API_BASE_URL}/ngos?city=${encodeURIComponent(city)}&locality=${encodeURIComponent(locality)}&available=true`
);
      let data = await res.json();
      
      // If no results, fall back to free-form location search
      if (!data || data.length === 0) {
        res = await fetch(
  `${API_BASE_URL}/ngos?location=${encodeURIComponent(selectedReport.location)}&available=true`
);
        data = await res.json();
      }
      
      setNGOs(data);
    } catch (err) {
      toast({ title: 'Failed to fetch NGOs', description: String(err), variant: 'destructive' });
    }
    setNGOLoading(false);
  };

  const handleAssignToNGO = async (ngo: any) => {
    if (!selectedReport) return;
    setAssigning(true);
    try {
      const res = await fetch(
      `${API_BASE_URL}/ngos/${ngo._id}/assign-task`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: selectedReport.id }),
      }
    );
      const data = await res.json();
      if (res.ok) {
        toast({ title: `Task assigned to ${ngo.name}!` });
        setShowAssignModal(false);
        setSelectedReport(null);
        // Refetch reports from backend to get updated status and assignedTo
        const reportsRes = await fetch(`${API_BASE_URL}/reports`);
        const reportsJson = await reportsRes.json();
        if (reportsJson.success && Array.isArray(reportsJson.data)) {
          const mappedReports: Report[] = reportsJson.data.map((r: any) => ({
            id: r._id,
            type: (r.incidentType || 'web'),
            status: r.status || 'pending',
            priority: r.urgency === 'urgent' ? 'critical' : (r.urgency || 'medium'),
            submittedAt: r.createdAt || r.date || '',
            location: r.location || '',
            description: r.description || '',
            submitterInfo: {
              anonymous: r.contactInfo?.anonymous ?? true,
              contact: r.contactInfo?.phone || r.contactInfo?.email || undefined
            },
            assignedTo: r.assignedTo || undefined,
            evidence: Array.isArray(r.evidence) ? r.evidence : [],
            aiConfidence: r.aiConfidence || undefined
          }))
          setReports(mappedReports)
        }
      } else {
        toast({ title: 'Failed to assign task', description: data.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Failed to assign task', description: String(err), variant: 'destructive' });
    }
    setAssigning(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports & Alerts</h1>
      <p className="text-muted-foreground">Multichannel tip submission and AI-powered report triage system</p>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        <Input
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="false_alarm">False Alarm</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4">
        {filteredReports.map((report) => {
          const Icon = getTypeIcon(report.type)
          return (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md"
              onClick={() => setSelectedReport(report)}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <CardTitle>{report.id}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {report.location}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(report.priority)}>{report.priority.toUpperCase()}</Badge>
                    <Badge variant={getStatusColor(report.status)}>{report.status.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedReport(null)}>
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Details: {selectedReport.id}</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedReport(null)}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p><strong>Location:</strong> {selectedReport.location}</p>
              <p><strong>Status:</strong> {selectedReport.status}</p>
              <p><strong>Priority:</strong> {selectedReport.priority}</p>
              <p><strong>Submitted At:</strong> {new Date(selectedReport.submittedAt).toLocaleString()}</p>
              <p><strong>Description:</strong> {selectedReport.description}</p>
              <p><strong>Anonymous:</strong> {selectedReport.submitterInfo.anonymous ? "Yes" : "No"}</p>
              {selectedReport.submitterInfo.contact && <p><strong>Contact:</strong> {selectedReport.submitterInfo.contact}</p>}
              {selectedReport.aiConfidence && <p><strong>AI Confidence:</strong> {selectedReport.aiConfidence}%</p>}
              {selectedReport.assignedTo && <p><strong>Assigned To:</strong> {selectedReport.assignedTo}</p>}
              <div className="space-y-1">
                <p><strong>Evidence:</strong></p>
                {selectedReport.evidence.map((ev, i) => (
                  <Badge key={i} variant="outline" className="mr-2">{ev}</Badge>
                ))}
              </div>

              {/* ✅ Added Buttons */}
              <div className="pt-4 flex justify-end gap-3">
                <Button onClick={handleAssignTeamClick}>Assign Team</Button>
                <Button variant="outline" onClick={() => handleExportPDF(selectedReport)}>
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Team Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAssignModal(false)}>
          <Card className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Assign Team for {selectedReport?.location}</CardTitle>
            </CardHeader>
            <CardContent>
              {ngoLoading ? (
                <p>Loading NGOs...</p>
              ) : ngos.length === 0 ? (
                <p>No available NGOs found for this location.</p>
              ) : (
                <ul className="space-y-2">
                  {ngos.map(ngo => (
                    <li key={ngo._id} className="flex justify-between items-center">
                      <span>{ngo.name} ({ngo.contact?.phone})</span>
                      <Button size="sm" disabled={assigning} onClick={() => handleAssignToNGO(ngo)}>
                        {assigning ? 'Assigning...' : 'Assign'}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="ghost" className="mt-4" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
