/**
 * MAIN ENTRY POINT
 * React application entry with security considerations
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
// Self-hosted variable font (weight + width axes): CSP allows fonts from 'self' only.
import '@fontsource-variable/archivo/wdth.css';
import App from './App';
import './index.css';
import './styles/screens.css';

// Security: Strict mode helps identify potential problems
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
