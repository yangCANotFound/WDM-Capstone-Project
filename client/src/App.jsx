/**
 * src/App.jsx — routing table (Phase 8).
 *
 * PUBLIC
 *   /              Home / About me
 *   /projects      Projects gallery          -> GET /api/projects
 *   /blog          Blog list                 -> GET /api/blog
 *   /blog/:id      Blog detail (+ comments)  -> GET /api/blog/:id, POST .../comments
 *   /contact       Contact form              -> POST /api/contact
 *   /login         Login page                -> POST /api/users/login
 *   /register      Register page             -> POST /api/users/register
 *   *              404 Not Found
 *
 * PROTECTED  (ProtectedRoute -> redirects to /login when not authenticated)
 *   /admin         Admin Dashboard
 *
 * Layout: Header + <main><Routes/></main> + Footer are persistent on every page.
 */
import { Route, Routes } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

import Home from './pages/Home.jsx';
import Projects from './pages/Projects.jsx';
import Blog from './pages/Blog.jsx';
import BlogDetail from './pages/BlogDetail.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />

      <main className="flex-1">
        <Routes>
          {/* ---------- Public routes ---------- */}
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ---------- Protected route ---------- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ---------- Fallback ---------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
