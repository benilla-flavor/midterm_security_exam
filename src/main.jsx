/**
 * MAIN ENTRY POINT
 * React application entry with security considerations
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Security: Strict mode helps identify potential problems
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
