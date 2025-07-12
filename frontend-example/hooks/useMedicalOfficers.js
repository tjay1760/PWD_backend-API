// Custom hook for managing medical officers
import { useState, useEffect, useCallback } from 'react';
import { fetchPendingOfficers, approveMedicalOfficer } from '../api/medicalOfficerApi';

export const useMedicalOfficers = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch officers
  const loadOfficers = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await fetchPendingOfficers();
      setOfficers(data.officers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve officer
  const approveOfficer = useCallback(async (officerId) => {
    setError('');
    setSuccess('');

    try {
      const result = await approveMedicalOfficer(officerId);
      
      // Remove approved officer from list
      setOfficers(prev => prev.filter(officer => officer.id !== officerId));
      setSuccess(`Officer approved successfully: ${result.officerName}`);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Load officers on mount
  useEffect(() => {
    loadOfficers();
  }, [loadOfficers]);

  return {
    officers,
    loading,
    error,
    success,
    loadOfficers,
    approveOfficer,
    setError,
    setSuccess
  };
};