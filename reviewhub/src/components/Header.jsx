// src/components/Header.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, User, Menu, X, LogOut, Settings, TrendingUp, Shield, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { LoginModal } from './auth/LoginModal'
import logoImage from '../assets/reviewhub_logo.png'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
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
    navigate('/signup')
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  return (
    <>
      <header className="bg-white-surface shadow-card border-b border-border-light sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo - Far Left (acts as Home link) */}
            <Link to="/" className="flex-shrink-0">
              <img
                src={logoImage}
                alt="ReviewHub - Home"
                className="h-10 w-auto md:h-12 object-contain"
                loading="eager"
                fetchPriority="high"
              />
            </Link>

            {/* Search Bar - Primary Focus, Wide */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products, brands, reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-4 pr-12 text-sm border border-border-light rounded-md bg-white-surface shadow-input focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 focus:outline-none transition-smooth"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-text-secondary hover:text-accent-blue transition-smooth"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Categories - Right of Search */}
            <Link
              to="/categories"
              className="hidden md:flex items-center gap-1 px-3 py-2 text-text-secondary hover:text-accent-blue font-medium transition-smooth whitespace-nowrap"
            >
              Categories
              <ChevronDown className="h-4 w-4" />
            </Link>

            {/* Spacer to push auth to far right */}
            <div className="flex-1" />

            {/* Auth / Profile Actions - Far Right */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-text-secondary hover:text-accent-blue hover:bg-soft-blue/50 transition-smooth"
                    aria-haspopup="menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-blue text-white flex items-center justify-center text-sm font-semibold">
                      {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <span className="hidden lg:inline font-medium">
                      {user?.first_name || user?.username}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white-surface rounded-md shadow-card-hover py-1 z-50 border border-border-light"
                      role="menu"
                    >
                      <div className="px-4 py-2 border-b border-border-light">
                        <p className="text-sm font-medium text-text-primary">
                          {user?.first_name || user?.username}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {user?.email}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>

                      <Link
                        to="/my-reviews"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <User className="h-4 w-4" />
                        My Reviews
                      </Link>

                      <Link
                        to="/analytics"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Analytics
                      </Link>

                      <Link
                        to="/privacy"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Shield className="h-4 w-4" />
                        Privacy & Data
                      </Link>

                      {user?.is_admin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth border-t border-border-light"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <Settings className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-smooth border-t border-border-light"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setShowLoginModal(true)}
                    className="text-text-secondary hover:text-purple-600 hover:bg-soft-lavender/50"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/signup')}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: '#6A5CFF' }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                className="text-text-secondary"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border-light bg-white-surface">
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
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-4 pr-12 text-sm border border-border-light rounded-md bg-white-surface shadow-input focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-text-secondary"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>

              <nav className="space-y-1">
                <Link
                  to="/categories"
                  className="block px-3 py-2 rounded-md text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  to="/about"
                  className="block px-3 py-2 rounded-md text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </nav>

              <div className="pt-4 border-t border-border-light space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-accent-blue text-white flex items-center justify-center text-sm font-semibold">
                        {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {user?.first_name || user?.username}
                        </p>
                        <p className="text-xs text-text-secondary">{user?.email}</p>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/my-reviews"
                      className="block px-3 py-2 rounded-md text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Reviews
                    </Link>
                    <Link
                      to="/analytics"
                      className="block px-3 py-2 rounded-md text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/privacy"
                      className="block px-3 py-2 rounded-md text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Privacy & Data
                    </Link>

                    {user?.is_admin && (
                      <Link
                        to="/admin"
                        className="block px-3 py-2 rounded-md text-text-secondary hover:bg-soft-blue hover:text-accent-blue transition-smooth"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50 transition-smooth"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-border-light"
                      onClick={() => {
                        setShowLoginModal(true)
                        setIsMenuOpen(false)
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full text-white hover:opacity-90"
                      style={{ backgroundColor: '#6A5CFF' }}
                      onClick={() => {
                        navigate('/signup')
                        setIsMenuOpen(false)
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={switchToRegister}
      />
    </>
  )
}
