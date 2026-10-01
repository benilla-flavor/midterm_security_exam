/**
 * REGISTRATION PAGE
 * Security Features:
 * - Strong password requirements
 * - Input validation
 * - XSS prevention via DOMPurify
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DOMPurify from 'dompurify';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    specialization: '',
    licenseNumber: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    
    if (formData.role === 'doctor') {
      if (!formData.specialization) newErrors.specialization = 'Specialization is required for doctors';
      if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required for doctors';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    // Sanitize all text inputs
    const sanitizedData = {
      ...formData,
      email: DOMPurify.sanitize(formData.email.trim()),
      firstName: DOMPurify.sanitize(formData.firstName.trim()),
      lastName: DOMPurify.sanitize(formData.lastName.trim()),
      phone: formData.phone.trim(),
      specialization: DOMPurify.sanitize(formData.specialization.trim()),
      licenseNumber: DOMPurify.sanitize(formData.licenseNumber.trim())
    };
    
    const result = await register(sanitizedData);
    
    if (result.success) {
      alert('Registration successful! Please login.');
      navigate('/login');
    } else {
      if (result.details) {
        const fieldErrors = {};
        result.details.forEach(detail => {
          fieldErrors[detail.field] = detail.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: result.error });
      }
    }
    
    setLoading(false);
  };
  
  return (
    <div className="card" style={{ maxWidth: '600px', margin: '50px auto' }}>
      <h2>Register for Secure Clinic</h2>
      
      {errors.general && <div className="error">{errors.general}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="role">Register as:</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label htmlFor="firstName">First Name *</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            {errors.firstName && <div className="error">{errors.firstName}</div>}
          </div>
          
          <div>
            <label htmlFor="lastName">Last Name *</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            {errors.lastName && <div className="error">{errors.lastName}</div>}
          </div>
        </div>
        
        <div>
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <div className="error">{errors.email}</div>}
        </div>
        
        <div>
          <label htmlFor="dateOfBirth">Date of Birth *</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />
          {errors.dateOfBirth && <div className="error">{errors.dateOfBirth}</div>}
        </div>
        
        <div>
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        
        {formData.role === 'doctor' && (
          <>
            <div>
              <label htmlFor="specialization">Specialization *</label>
              <input
                id="specialization"
                name="specialization"
                type="text"
                value={formData.specialization}
                onChange={handleChange}
                required={formData.role === 'doctor'}
              />
              {errors.specialization && <div className="error">{errors.specialization}</div>}
            </div>
            
            <div>
              <label htmlFor="licenseNumber">License Number *</label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                value={formData.licenseNumber}
                onChange={handleChange}
                required={formData.role === 'doctor'}
              />
              {errors.licenseNumber && <div className="error">{errors.licenseNumber}</div>}
            </div>
          </>
        )}
        
        <div>
          <label htmlFor="password">Password *</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <small>Min 8 chars, uppercase, lowercase, number, special char</small>
          {errors.password && <div className="error">{errors.password}</div>}
        </div>
        
        <div>
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
        </div>
        
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default Register;
