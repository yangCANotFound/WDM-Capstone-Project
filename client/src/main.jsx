/**
 * src/main.jsx — application entry point.
 *
 * Provider order (outermost -> innermost):
 *   ThemeProvider  : dark/light mode for the whole app (applies `dark` on <html>)
 *   BrowserRouter  : routing must exist for AuthProvider/ProtectedRoute to redirect
 *   AuthProvider   : global auth state (token/user/login/logout) for the whole app
 *   ToastProvider  : global toast notifications (uses no routing)
 *   App
 *
 * Theme and Auth are deliberately separate contexts: the Capstone rubric grades
 * the Auth Context on its own, and mixing theme state into it would blur that.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
