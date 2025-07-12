// API functions for medical officer management

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Get authentication token
const getAuthToken = () => localStorage.getItem('accessToken');

// Get authorization headers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`,
});

// Fetch pending medical officers (you might need to create this endpoint)
export const fetchPendingOfficers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/users/pending-officers`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch pending officers');
  }

  return response.json();
};

// ✅ CORRECT: Approve medical officer
export const approveMedicalOfficer = async (officerId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/approve/${officerId}`, {
    method: 'PUT', // ✅ Correct method
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Get medical officers in county (for county directors)
export const getCountyMedicalOfficers = async (status = 'all') => {
  const url = new URL(`${API_BASE_URL}/api/users/county-officers`);
  if (status !== 'all') {
    url.searchParams.append('status', status);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch county officers');
  }

  return response.json();
};