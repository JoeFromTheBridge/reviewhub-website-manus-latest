import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Star, Grid, List, Loader2, Filter, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import apiService from '../services/api'
import { useIsMobileFiltersMode } from '../hooks/useIsMobileFiltersMode'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const priceDebounceTimer = useRef(null)

  // Mobile filters modal state
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const isMobileFiltersMode = useIsMobileFiltersMode()

  // Lock body scroll when mobile filters modal is open
  useBodyScrollLock(showMobileFilters)

  // Filter states
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minRating: searchParams.get('minRating') || '',
    minPrice: searchParams.get('minPrice') || '0',
    maxPrice: searchParams.get('maxPrice') || '2000',
    sortBy: searchParams.get('sort') || 'relevance'
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentPage])

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories()
      setCategories(response.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Helper to get product price
  const getProductPrice = (product) => {
    // Try different price fields
    const priceMin = product.price_min ?? product.price ?? product.priceMin ?? null
    const priceMax = product.price_max ?? product.priceMax ?? null

    // If we have direct price fields, use them
    if (priceMin !== null) {
      return { min: Number(priceMin), max: priceMax !== null ? Number(priceMax) : Number(priceMin) }
    }

    // Try to parse from price_range string (e.g., "$100 - $200")
    if (product.price_range) {
      const matches = product.price_range.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)
      if (matches && matches.length >= 1) {
        const prices = matches.map(m => Number(m.replace(/[$,]/g, '')))
        return { min: prices[0], max: prices[prices.length - 1] }
      }
    }

    return null
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch ALL products and filter client-side for reliability
      const response = await apiService.getProducts({
        page: 1,
        per_page: 100 // Get more products to work with
      })

      let allProducts = response.products || []

      // Apply client-side filters
      const query = (searchParams.get('q') || '').toLowerCase()
      const category = searchParams.get('category') || ''
      const minRating = parseInt(searchParams.get('minRating') || '0')
      const minPrice = parseFloat(searchParams.get('minPrice') || '0')
      const maxPrice = parseFloat(searchParams.get('maxPrice') || '2000')
      const sortBy = searchParams.get('sort') || 'relevance'

      // Filter by search query
      if (query) {
        allProducts = allProducts.filter(p =>
          (p.name || '').toLowerCase().includes(query) ||
          (p.brand || '').toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query)
        )
      }

      // Filter by category
      if (category) {
        allProducts = allProducts.filter(p => p.category === category)
      }

      // Filter by minimum rating
      // "5 stars" means >= 4.75 for better UX (shows 4.8, 4.9, 5.0)
      // "4+" means >= 4.0, "3+" means >= 3.0, etc.
      if (minRating > 0) {
        const ratingThreshold = minRating === 5 ? 4.75 : minRating
        allProducts = allProducts.filter(p => (p.average_rating || 0) >= ratingThreshold)
      }

      // Filter by price range
      const isPriceFilterActive = minPrice > 0 || maxPrice < 2000
      if (isPriceFilterActive) {
        allProducts = allProducts.filter(p => {
          const price = getProductPrice(p)
          if (!price) return true // Show products without price data
          // Product passes if its price range overlaps with the filter range
          return price.max >= minPrice && price.min <= maxPrice
        })
      }

      // Sort products
      if (sortBy === 'rating') {
        allProducts.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      } else if (sortBy === 'reviews') {
        allProducts.sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
      } else if (sortBy === 'price_low') {
        allProducts.sort((a, b) => {
          const priceA = getProductPrice(a)?.min || 0
          const priceB = getProductPrice(b)?.min || 0
          return priceA - priceB
        })
      } else if (sortBy === 'price_high') {
        allProducts.sort((a, b) => {
          const priceA = getProductPrice(a)?.max || 0
          const priceB = getProductPrice(b)?.max || 0
          return priceB - priceA
        })
      } else if (sortBy === 'newest') {
        allProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      }

      setProducts(allProducts)
      setTotalResults(allProducts.length)
    } catch (error) {
      setError('Failed to load products. Please try again.')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    // Update URL params
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key === 'sortBy' ? 'sort' : key, value)
    } else {
      newParams.delete(key === 'sortBy' ? 'sort' : key)
    }
    setSearchParams(newParams)
    setCurrentPage(1)
  }

  const handlePriceChange = (type, value) => {
    // Update filter state immediately for UI responsiveness
    setFilters({ ...filters, [type]: value })

    // Debounce URL update and refetch
    if (priceDebounceTimer.current) {
      clearTimeout(priceDebounceTimer.current)
    }

    priceDebounceTimer.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams)

      if (type === 'minPrice') {
        if (value && parseInt(value) > 0) {
          newParams.set('minPrice', value)
        } else {
          newParams.delete('minPrice')
        }
      } else if (type === 'maxPrice') {
        if (value && parseInt(value) < 2000) {
          newParams.set('maxPrice', value)
        } else {
          newParams.delete('maxPrice')
        }
      }

      setSearchParams(newParams)
      setCurrentPage(1)
    }, 500) // Wait 500ms after slider stops moving
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      minRating: '',
      minPrice: '0',
      maxPrice: '2000',
      sortBy: 'relevance'
    })
    setSearchParams({})
    setCurrentPage(1)
  }

  // Count active filters for badge display
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category) count++
    if (filters.minRating) count++
    if (parseInt(filters.minPrice) > 0) count++
    if (parseInt(filters.maxPrice) < 2000) count++
    if (filters.sortBy && filters.sortBy !== 'relevance') count++
    return count
  }

  // Improved star rendering with proper half-star support
  const renderStars = (rating) => {
    const value = Number(rating) || 0
    const displayRating = value.toFixed(1)
    const fullStars = Math.floor(value)
    const hasHalfStar = value % 1 >= 0.25 && value % 1 < 0.75
    const hasFullFromPartial = value % 1 >= 0.75
    const actualFullStars = fullStars + (hasFullFromPartial ? 1 : 0)

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          if (i < actualFullStars) {
            // Full star
            return (
              <Star
                key={i}
                className="h-4 w-4 text-star-gold fill-star-gold"
              />
            )
          } else if (i === actualFullStars && hasHalfStar) {
            // Half star
            return (
              <div key={i} className="relative w-4 h-4">
                <Star className="absolute inset-0 h-4 w-4 text-border-light" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="h-4 w-4 text-star-gold fill-star-gold" />
                </div>
              </div>
            )
          } else {
            // Empty star
            return (
              <Star
                key={i}
                className="h-4 w-4 text-border-light"
              />
            )
          }
        })}
        <span className="ml-1.5 text-sm font-medium text-text-primary">{displayRating}</span>
      </div>
    )
  }

  // Format price display
  const formatPrice = (product) => {
    const price = getProductPrice(product)
    if (!price) return product.price_range || null

    if (price.min === price.max) {
      return `$${price.min.toLocaleString()}`
    }
    return `$${price.min.toLocaleString()} - $${price.max.toLocaleString()}`
  }

  const ProductCard = ({ product }) => {
    const priceDisplay = formatPrice(product)

    return (
      <Card className="bg-white-surface shadow-card card-hover-lift rounded-md overflow-hidden h-full flex flex-col">
        {/* Responsive padding: smaller on mobile, normal on desktop */}
        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          <Link to={`/product/${product.id}`}>
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300'}
              alt={product.name}
              className="w-full h-36 sm:h-48 object-cover rounded-sm mb-3 sm:mb-4"
            />
          </Link>
          <div className="space-y-1.5 sm:space-y-2 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${product.id}`}
                  className="font-semibold text-sm sm:text-base text-text-primary hover:text-accent-blue transition-smooth line-clamp-2"
                >
                  {product.name}
                </Link>
                <p className="text-xs sm:text-sm text-text-secondary">{product.brand}</p>
              </div>
            </div>

            {product.category && (
              <Badge variant="secondary" className="bg-soft-blue text-accent-blue rounded-sm text-xs">
                {product.category}
              </Badge>
            )}

            <div className="flex-1" />

            {priceDisplay && (
              <p className="text-lg sm:text-xl font-bold text-accent-blue">{priceDisplay}</p>
            )}

            <div className="flex items-center justify-between">
              {renderStars(product.average_rating || 0)}
              <span className="text-xs sm:text-sm text-text-secondary">
                ({product.review_count || 0})
              </span>
            </div>

            {product.description && (
              <p className="text-xs sm:text-sm text-text-secondary line-clamp-2">{product.description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const ProductListItem = ({ product }) => {
    const priceDisplay = formatPrice(product)

    return (
      <Card className="bg-white-surface shadow-card card-hover-lift rounded-md overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex space-x-3 sm:space-x-4">
            <Link to={`/product/${product.id}`} className="flex-shrink-0">
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300'}
                alt={product.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-sm"
              />
            </Link>
            <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${product.id}`}
                    className="font-semibold text-sm sm:text-lg text-text-primary hover:text-accent-blue transition-smooth line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs sm:text-sm text-text-secondary">{product.brand}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {product.category && (
                    <Badge variant="secondary" className="bg-soft-blue text-accent-blue rounded-sm text-xs hidden sm:inline-flex">
                      {product.category}
                    </Badge>
                  )}
                  {priceDisplay && (
                    <p className="text-sm sm:text-lg font-bold text-accent-blue mt-0.5 sm:mt-1">{priceDisplay}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                {renderStars(product.average_rating || 0)}
                <span className="text-xs sm:text-sm text-text-secondary">
                  ({product.review_count || 0})
                </span>
              </div>

              {product.description && (
                <p className="text-xs sm:text-sm text-text-secondary line-clamp-1 sm:line-clamp-2">{product.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filters content - reused in both sidebar and mobile modal
  const FiltersContent = ({ inModal = false }) => (
    <div className={inModal ? 'p-4 space-y-6' : 'space-y-6'}>
      {/* Categories */}
      <Card className={`bg-white-surface shadow-card rounded-md ${inModal ? 'shadow-none border-0' : ''}`}>
        <CardContent className="p-6">
          <h3 className="font-semibold text-text-primary mb-4">Categories</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleFilterChange('category', '')}
              className={`block w-full text-left px-3 py-2 rounded-sm transition-smooth min-h-[44px] ${
                !filters.category
                  ? 'bg-soft-blue text-accent-blue font-medium'
                  : 'text-text-secondary hover:bg-soft-blue/50'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleFilterChange('category', category.name)}
                className={`block w-full text-left px-3 py-2 rounded-sm transition-smooth min-h-[44px] ${
                  filters.category === category.name
                    ? 'bg-soft-blue text-accent-blue font-medium'
                    : 'text-text-secondary hover:bg-soft-blue/50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card className={`bg-white-surface shadow-card rounded-md ${inModal ? 'shadow-none border-0' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Price Range</h3>
            <span className="text-sm font-semibold text-accent-blue">
              ${filters.minPrice || 0} - ${filters.maxPrice || 2000}
            </span>
          </div>
          <div className="space-y-4">
            {/* Dual range slider simulation with two inputs */}
            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={filters.maxPrice || 2000}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                className="w-full h-2 bg-border-light rounded-full appearance-none cursor-pointer accent-accent-blue"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-text-secondary mb-1 block">Min ($)</label>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={filters.minPrice || '0'}
                  onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border-light rounded-sm bg-white-surface shadow-input focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20 focus:outline-none transition-smooth min-h-[44px]"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-secondary mb-1 block">Max ($)</label>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={filters.maxPrice || '2000'}
                  onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border-light rounded-sm bg-white-surface shadow-input focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20 focus:outline-none transition-smooth min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating */}
      <Card className={`bg-white-surface shadow-card rounded-md ${inModal ? 'shadow-none border-0' : ''}`}>
        <CardContent className="p-6">
          <h3 className="font-semibold text-text-primary mb-4">Rating</h3>
          <div className="space-y-2">
            {[
              { value: '5', label: '5 stars' },
              { value: '4', label: '4+ stars' },
              { value: '3', label: '3+ stars' },
              { value: '2', label: '2+ stars' }
            ].map((rating) => (
              <label
                key={rating.value}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-sm transition-smooth min-h-[44px] ${
                  filters.minRating === rating.value
                    ? 'bg-soft-blue'
                    : 'hover:bg-soft-blue/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.minRating === rating.value}
                  onChange={(e) => handleFilterChange('minRating', e.target.checked ? rating.value : '')}
                  className="rounded border-border-light text-accent-blue focus:ring-accent-blue w-5 h-5"
                />
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < parseInt(rating.value)
                          ? 'text-star-gold fill-star-gold'
                          : 'text-border-light'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-text-secondary ml-1">{rating.label}</span>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sort By */}
      <Card className={`bg-white-surface shadow-card rounded-md ${inModal ? 'shadow-none border-0' : ''}`}>
        <CardContent className="p-6">
          <h3 className="font-semibold text-text-primary mb-4">Sort by:</h3>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full rounded-sm border border-border-light bg-white-surface px-3 py-2 text-sm shadow-input focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20 focus:outline-none transition-smooth min-h-[44px]"
          >
            <option value="relevance">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviews</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </CardContent>
      </Card>

      {/* Reset Filters - only show in sidebar, not modal (modal has its own buttons) */}
      {!inModal && (
        <Card className="bg-white-surface shadow-card rounded-md">
          <CardContent className="p-6">
            <Button
              onClick={clearFilters}
              className="w-full bg-soft-blue text-accent-blue hover:bg-soft-blue/80 transition-smooth min-h-[44px]"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Mobile Filters Modal
  const MobileFiltersModal = () => {
    if (!showMobileFilters) return null

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowMobileFilters(false)
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-filters-title"
      >
        <div
          className="bg-white w-full sm:max-w-md sm:mx-4 sm:rounded-lg flex flex-col"
          style={{
            maxHeight: '90vh',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-light flex-shrink-0">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-text-primary" />
              <h2 id="mobile-filters-title" className="text-lg font-semibold text-text-primary">
                Filters
              </h2>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="rounded-sm bg-soft-blue text-accent-blue">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </div>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-gray-100"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable filter content */}
          <div
            data-scroll-lock-scrollable
            className="flex-1 overflow-y-auto"
            style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <FiltersContent inModal={true} />
          </div>

          {/* Sticky action bar */}
          <div className="flex-shrink-0 p-4 border-t border-border-light bg-white flex gap-3">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1 min-h-[48px] rounded-md transition-smooth"
              disabled={getActiveFiltersCount() === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={() => setShowMobileFilters(false)}
              className="flex-1 min-h-[48px] rounded-md bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] text-white hover:opacity-90 transition-smooth"
            >
              Show Results
              {totalResults > 0 && ` (${totalResults})`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
            {filters.query ? `Search results for "${filters.query}"` : 'All Products'}
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1">
            {loading ? 'Loading...' : `${totalResults} products found`}
          </p>
        </div>

        {/* Results Toolbar - unified row for all controls */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-2 flex-wrap">
          {/* Left side: Filter controls (mobile only) */}
          {isMobileFiltersMode && (
            <div className="flex items-center gap-2">
              {/* Primary Filters button */}
              <Button
                size="sm"
                onClick={() => setShowMobileFilters(true)}
                className="h-9 px-3 rounded-md bg-accent-blue text-white hover:bg-accent-blue/90 border border-black flex items-center gap-1.5"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">Filters</span>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-[20px] rounded bg-white text-accent-blue text-xs px-1.5">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
              {/* Secondary Reset button (ghost style) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-3 rounded-md text-text-secondary hover:text-text-primary hover:bg-gray-100 border border-black flex items-center gap-1.5"
                disabled={getActiveFiltersCount() === 0}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="text-sm">Reset</span>
              </Button>
            </div>
          )}

          {/* Spacer for desktop (pushes view toggles to right) */}
          {!isMobileFiltersMode && <div className="flex-1" />}

          {/* Right side: View toggles */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`h-9 w-9 p-0 rounded-md border border-black ${viewMode === 'grid' ? 'bg-soft-blue text-accent-blue hover:bg-soft-blue/80' : 'hover:bg-gray-50'}`}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-9 w-9 p-0 rounded-md border border-black ${viewMode === 'list' ? 'bg-soft-blue text-accent-blue hover:bg-soft-blue/80' : 'hover:bg-gray-50'}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content area - conditional layout based on mobile/desktop */}
        <div className={`grid gap-4 sm:gap-8 items-start ${isMobileFiltersMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
          {/* Filters Sidebar - ONLY rendered on desktop */}
          {!isMobileFiltersMode && (
            <div className="lg:col-span-1">
              <FiltersContent inModal={false} />
            </div>
          )}

          {/* Results */}
          <div className={isMobileFiltersMode ? '' : 'lg:col-span-3'}>
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
                <span className="ml-2 text-text-secondary">Loading products...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchProducts} className="mt-4 bg-accent-blue hover:bg-accent-blue/90">
                  Try Again
                </Button>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-12 bg-white-surface rounded-md shadow-card">
                <p className="text-text-secondary mb-4">No products found matching your criteria.</p>
                <Button onClick={clearFilters} className="bg-soft-blue text-accent-blue hover:bg-soft-blue/80 transition-smooth">
                  Reset Filters
                </Button>
              </div>
            )}

            {/* Products Grid/List */}
            {!loading && !error && products.length > 0 && (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {products.map((product) => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center mt-8 sm:mt-12">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="h-9 px-3 sm:px-4 text-sm rounded-md border border-black disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 min-w-[36px] px-3 text-sm rounded-md bg-soft-blue text-accent-blue hover:bg-soft-blue/80 border border-black"
                    >
                      {currentPage}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={products.length < 12}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="h-9 px-3 sm:px-4 text-sm rounded-md border border-black disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal - ONLY rendered on mobile */}
      {isMobileFiltersMode && <MobileFiltersModal />}
    </div>
  )
}
