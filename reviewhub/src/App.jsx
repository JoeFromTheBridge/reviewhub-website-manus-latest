// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { ProductPage } from './components/ProductPage'
import SearchPage from './components/search/SearchPage'
import UserAnalyticsPage from './components/profile/UserAnalyticsPage'
import PrivacyPage from './components/privacy/PrivacyPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminUsers from './components/admin/AdminUsers'
import AdminPerformance from './components/admin/AdminPerformance'
import AdminVoiceSearch from './components/admin/AdminVoiceSearch'
import { useAuth } from './contexts/AuthContext'
import EmailVerification from './components/auth/EmailVerification'
import ProfilePage from './components/profile/ProfilePage'
import DevSeedPage from './components/DevSeedPage'

// Admin route wrapper to check admin permissions
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Checking your admin access.</p>
        </div>
      </div>
    )
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  return <AdminLayout>{children}</AdminLayout>
}

// Auth-protected route wrapper for regular user pages
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  // While AuthContext is bootstrapping (and during auth actions), block render
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Verifying your session.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Sign in required
          </h1>
          <p className="text-gray-600 mb-6">
            You need to be signed in to view this page.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded-md text-gray-800 hover:bg-gray-300 transition"
            >
              Go to Homepage
            </button>

            <button
              onClick={() => navigate('/?login=1')}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      {children}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <>
                  <Header />
                  <HomePage />
                </>
              }
            />
            <Route
              path="/product/:id"
              element={
                <>
                  <Header />
                  <ProductPage />
                </>
              }
            />
            <Route
              path="/search"
              element={
                <>
                  <Header />
                  <SearchPage />
                </>
              }
            />
            <Route
              path="/verify-email"
              element={
                <>
                  <Header />
                  <EmailVerification />
                </>
              }
            />

            {/* Dev data check route */}
            <Route
              path="/dev-seed"
              element={
                <>
                  <Header />
                  <DevSeedPage />
                </>
              }
            />

            {/* Auth-protected analytics & privacy routes */}
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <UserAnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/privacy"
              element={
                <PrivateRoute>
                  <PrivacyPage />
                </PrivateRoute>
              }
            />

            {/* Auth-protected profile routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage initialTab="profile" />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-reviews"
              element={
                <PrivateRoute>
                  <ProfilePage initialTab="reviews" />
                </PrivateRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/voice-search"
              element={
                <AdminRoute>
                  <AdminVoiceSearch />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/performance"
              element={
                <AdminRoute>
                  <AdminPerformance />
                </AdminRoute>
              }
            />

            {/* 404 Not Found */}
            <Route
              path="/404"
              element={
                <>
                  <Header />
                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-6">
                    <div className="text-center max-w-md mx-auto">
                      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                      <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                        Page Not Found
                      </h2>
                      <p className="text-gray-600 mb-6">
                        The page you're looking for doesn't exist or has been moved.
                      </p>
                      <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition"
                      >
                        Go to Homepage
                      </button>
                    </div>
                  </div>
                </>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
