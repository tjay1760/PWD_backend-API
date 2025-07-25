// Individual officer card component
import React from 'react';

const OfficerApprovalCard = ({ officer, onApprove, loading }) => {
  const handleApprove = () => {
    if (window.confirm(`Are you sure you want to approve ${officer.fullName}?`)) {
      onApprove(officer.id);
    }
  };

  return (
    <div className="officer-card">
      <div className="officer-header">
        <h3>{officer.fullName}</h3>
        <span className="status-badge pending">Pending Approval</span>
      </div>
      
      <div className="officer-details">
        <div className="detail-row">
          <label>License Number:</label>
          <span>{officer.medicalInfo?.licenseNumber || 'N/A'}</span>
        </div>
        
        <div className="detail-row">
          <label>Specialty:</label>
          <span>{officer.medicalInfo?.specialty || 'N/A'}</span>
        </div>
        
        <div className="detail-row">
          <label>County:</label>
          <span>{officer.county}</span>
        </div>
        
        <div className="detail-row">
          <label>Email:</label>
          <span>{officer.email}</span>
        </div>
        
        <div className="detail-row">
          <label>Phone:</label>
          <span>{officer.phone}</span>
        </div>
        
        <div className="detail-row">
          <label>Registration Date:</label>
          <span>{new Date(officer.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="officer-actions">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="btn btn-success"
        >
          {loading ? 'Approving...' : 'Approve Officer'}
        </button>
      </div>
    </div>
  );
};

export default OfficerApprovalCard;