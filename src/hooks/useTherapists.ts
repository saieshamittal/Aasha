import { useState, useEffect } from 'react';

export interface Therapist {
  _id: string;
  name: string;
  email: string;
  institution: string;
  specialization: string;
  availability: string;
  languages: string[];
  preferred_mode: string;
  consent: boolean;
  notes: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useTherapists = (specialization: string = 'all') => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const url = specialization && specialization !== 'all'
        ? `${API_BASE_URL}/therapists?specialization=${encodeURIComponent(specialization)}`
        : `${API_BASE_URL}/therapists`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setTherapists(data.data);
      } else {
        setError(data.message || 'Failed to fetch therapists');
      }
    } catch (err) {
      setError('Network error while fetching therapists');
      console.error('Error fetching therapists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapists();
    // eslint-disable-next-line
  }, [specialization]);

  return {
    therapists,
    loading,
    error,
    refresh: fetchTherapists
  };
}; 