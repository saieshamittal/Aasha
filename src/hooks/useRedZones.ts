import { useState, useEffect } from 'react';

export interface RedZone {
  _id: string;
  name: string;
  location: string;
  riskLevel: "high" | "medium" | "low";
  lastReport: string;
  activeCases: number;
  description: string;
  coordinates: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
}

export interface RedZoneStats {
  totalZones: number;
  highRiskZones: number;
  mediumRiskZones: number;
  lowRiskZones: number;
  totalActiveCases: number;
  recentReports: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useRedZones = () => {
  const [zones, setZones] = useState<RedZone[]>([]);
  const [stats, setStats] = useState<RedZoneStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/red-zones`);
      const data = await response.json();
      
      if (data.success) {
        setZones(data.data);
      } else {
        setError(data.message || 'Failed to fetch red zones');
      }
    } catch (err) {
      setError('Network error while fetching red zones');
      console.error('Error fetching red zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/red-zones/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Failed to fetch stats:', data.message);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchZones(), fetchStats()]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    zones,
    stats,
    loading,
    error,
    refreshData
  };
}; 