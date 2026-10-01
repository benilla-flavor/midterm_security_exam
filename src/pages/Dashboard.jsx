/**
 * DASHBOARD PAGE
 * Role-based dashboard with secure data display
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Welcome to Your Dashboard</h1>
      
      <div className="card">
        <h2>User Information</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>User ID:</strong> {user?.userId}</p>
      </div>
      
      <div className="card">
        <h2>Role-Specific Features</h2>
        {user?.role === 'patient' && (
          <div>
            <h3>Patient Features:</h3>
            <ul>
              <li>View and book appointments</li>
              <li>View medical history</li>
              <li>Update profile</li>
            </ul>
          </div>
        )}
        
        {user?.role === 'doctor' && (
          <div>
            <h3>Doctor Features:</h3>
            <ul>
              <li>View scheduled appointments</li>
              <li>Create medical records</li>
              <li>Update availability</li>
            </ul>
          </div>
        )}
        
        {user?.role === 'admin' && (
          <div>
            <h3>Admin Features:</h3>
            <ul>
              <li>Manage users</li>
              <li>View audit logs</li>
              <li>System configuration</li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="card">
        <h2>Security Note</h2>
        <p>This dashboard demonstrates role-based access control (RBAC). Each role has different permissions and can only access their authorized resources.</p>
      </div>
    </div>
  );
}

export default Dashboard;
