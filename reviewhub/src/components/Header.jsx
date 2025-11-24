// src/components/Header.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, User, Menu, X, LogOut, Settings, TrendingUp, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '../contexts/AuthContext'
import { LoginModal } from './auth/LoginModal'
import { RegisterModal } from './auth/RegisterModal'
import logoImage from '../assets/reviewhub_logo.png'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()

  // Open login modal when redirected from a protected route with ?login=1
  useEffect(() => {
    if (!isAuthenticated) {
      const params = new URLSearchParams(location.search)
      if (params.get('login') === '1') {
        setShowLoginModal(true)
        // Clean up URL so refreshing doesn't keep triggering the modal
        navigate('/', { replace: true })
      }
    }
  }, [location.search, isAuthenticated, navigate])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  const switchToRegister = () => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }

  const switchToLogin = () => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img
                src={logoImage}
                alt="ReviewHub"
                className="h-10 w-auto md:h-12 lg:h-14 object-contain"
                loading="eager"
                fetchPriority="high"
              />
              <span className="sr-only">ReviewHub</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/categories" className="text-gray-700 hover:text-primary transition-colors">
                Categories
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-primary transition-colors">
                About
              </Link>
              {isAuthenticated && (
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Profile
                </Link>
              )}
            </nav>

            {/* Search Icon (linking to SearchPage) */}
            <div className="hidden md:flex items-center">
              <form onSubmit={handleSearch} className="flex items-center">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 mr-2"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 hover:text-primary"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </form>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={showUserMenu}
                  >
                    <User className="h-4 w-4" />
                    <span>{user?.first_name || user?.username}</span>
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-50 border"
                      role="menu"
                    >
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profile
                      </Link>

                      <Link
                        to="/my-reviews"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <User className="h-4 w-4 mr-2" />
                        My Reviews
                      </Link>

                      <Link
                        to="/analytics"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Analytics
                      </Link>

                      <Link
                        to="/privacy"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Shield className="h-4 w-4" />
                        Privacy & Data
                      </Link>

                      {user?.is_admin && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowLoginModal(true)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button onClick={() => setShowRegisterModal(true)}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
                    setIsMenuOpen(false)
                  }
                }}
                className="flex items-center mb-2"
              >
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mr-2"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 hover:text-primary w-10"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <nav className="space-y-2">
                <Link
                  to="/"
                  className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/categories"
                  className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  to="/about"
                  className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </nav>

              <div className="mt-4 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-600">
                      Welcome, {user?.first_name || user?.username}!
                    </div>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/my-reviews"
                      className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Reviews
                    </Link>
                    <Link
                      to="/analytics"
                      className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/privacy"
                      className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Privacy &amp; Data
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowLoginModal(true)
                        setIsMenuOpen(false)
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setShowRegisterModal(true)
                        setIsMenuOpen(false)
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={switchToRegister}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={switchToLogin}
      />
    </>
  )
}
