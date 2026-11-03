/**
 * src/main.jsx — application entry point.
 *
 * Provider order (outermost -> innermost):
 *   BrowserRouter  : routing must exist for AuthProvider/ProtectedRoute to redirect
 *   AuthProvider   : global auth state (token/user/login/logout) for the whole app
 *   ToastProvider  : global toast notifications (uses no routing)
 *   App
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
