import React, { useState, useEffect } from 'react';

const MedicalOfficerApproval = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState([]);

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const APPROVAL_API_BASE_URL = `${API_BASE_URL}/api/users/approve`;
  
  const authToken = localStorage.getItem('accessToken');

  // Fetch pending medical officers
  useEffect(() => {
    fetchPendingOfficers();
  }, []);

  const fetchPendingOfficers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/pending-officers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch officers');
      }

      const data = await response.json();
      setOfficers(data.officers || []);
    } catch (err) {
      console.error('Error fetching officers:', err);
      setError(`Failed to load officers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTED: Your approve handler with improvements
  const handleApprove = async (officerId) => {
    if (!authToken) {
      setError("Authentication token is missing. Cannot approve.");
      return;
    }

    // Clear previous messages
    setError('');
    setSuccess('');

    try {
      // ✅ CORRECT: Using PUT method (as per backend route)
      const approveUrl = `${APPROVAL_API_BASE_URL}/${officerId}`;
      const response = await fetch(approveUrl, {
        method: 'PUT', // ✅ Changed from POST to PUT
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        // ✅ No body needed - approval is just the action
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // ✅ IMPROVED: Update state and show success message
      setOfficers((prevOfficers) => 
        prevOfficers.filter((officer) => officer.id !== officerId)
      );
      setSelected((prevSelected) => 
        prevSelected.filter((id) => id !== officerId)
      );
      
      setSuccess(`Medical officer approved successfully: ${data.officerName}`);
      console.log(`Medical officer ${officerId} approved successfully.`, data);
      
    } catch (err) {
      console.error(`Error approving officer ${officerId}:`, err);
      setError(`Failed to approve officer: ${err.message}`);
    }
  };

  // Bulk approve selected officers
  const handleBulkApprove = async () => {
    if (selected.length === 0) {
      setError('Please select officers to approve');
      return;
    }

    setLoading(true);
    const errors = [];
    const successes = [];

    for (const officerId of selected) {
      try {
        await handleApprove(officerId);
        successes.push(officerId);
      } catch (err) {
        errors.push(`${officerId}: ${err.message}`);
      }
    }

    setLoading(false);
    
    if (successes.length > 0) {
      setSuccess(`Successfully approved ${successes.length} officer(s)`);
    }
    
    if (errors.length > 0) {
      setError(`Failed to approve some officers: ${errors.join(', ')}`);
    }
  };

  // Handle selection
  const handleSelectOfficer = (officerId) => {
    setSelected(prev => 
      prev.includes(officerId) 
        ? prev.filter(id => id !== officerId)
        : [...prev, officerId]
    );
  };

  const handleSelectAll = () => {
    setSelected(
      selected.length === officers.length 
        ? [] 
        : officers.map(officer => officer.id)
    );
  };

  return (
    <div className="medical-officer-approval">
      <h2>Medical Officer Approval</h2>
      
      {/* Status Messages */}
      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* Loading State */}
      {loading && <div className="loading">Loading...</div>}

      {/* Bulk Actions */}
      {officers.length > 0 && (
        <div className="bulk-actions">
          <button 
            onClick={handleSelectAll}
            className="btn btn-secondary"
          >
            {selected.length === officers.length ? 'Deselect All' : 'Select All'}
          </button>
          
          <button 
            onClick={handleBulkApprove}
            disabled={selected.length === 0 || loading}
            className="btn btn-primary"
          >
            Approve Selected ({selected.length})
          </button>
        </div>
      )}

      {/* Officers Table */}
      {officers.length === 0 && !loading ? (
        <div className="no-data">
          <p>No pending medical officers found.</p>
          <button onClick={fetchPendingOfficers} className="btn btn-secondary">
            Refresh
          </button>
        </div>
      ) : (
        <div className="officers-table">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selected.length === officers.length && officers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>License Number</th>
                <th>Specialty</th>
                <th>County</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((officer) => (
                <tr key={officer.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(officer.id)}
                      onChange={() => handleSelectOfficer(officer.id)}
                    />
                  </td>
                  <td>{officer.fullName}</td>
                  <td>{officer.medicalInfo?.licenseNumber}</td>
                  <td>{officer.medicalInfo?.specialty}</td>
                  <td>{officer.county}</td>
                  <td>{officer.email}</td>
                  <td>
                    <button
                      onClick={() => handleApprove(officer.id)}
                      disabled={loading}
                      className="btn btn-success btn-sm"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MedicalOfficerApproval;