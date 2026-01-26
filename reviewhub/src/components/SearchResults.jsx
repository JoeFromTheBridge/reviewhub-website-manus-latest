import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Star, Filter, Grid, List, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import apiService from '../services/api'

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

  // Filter states
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minRating: searchParams.get('minRating') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sort') || 'relevance'
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [searchParams, currentPage])

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories()
      setCategories(response.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
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
      const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
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
      if (minRating > 0) {
        allProducts = allProducts.filter(p => (p.average_rating || 0) >= minRating)
      }

      // Filter by max price
      if (maxPrice < 999999) {
        allProducts = allProducts.filter(p => {
          // Extract numeric price from price_range if it exists
          if (!p.price_range) return true
          const priceMatch = p.price_range.match(/\$(\d+)/)
          if (!priceMatch) return true
          return parseInt(priceMatch[1]) <= maxPrice
        })
      }

      // Sort products
      if (sortBy === 'rating') {
        allProducts.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      } else if (sortBy === 'reviews') {
        allProducts.sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
      } else if (sortBy === 'price_low') {
        allProducts.sort((a, b) => {
          const priceA = a.price_range?.match(/\$(\d+)/)?.[1] || 0
          const priceB = b.price_range?.match(/\$(\d+)/)?.[1] || 0
          return parseInt(priceA) - parseInt(priceB)
        })
      } else if (sortBy === 'price_high') {
        allProducts.sort((a, b) => {
          const priceA = a.price_range?.match(/\$(\d+)/)?.[1] || 0
          const priceB = b.price_range?.match(/\$(\d+)/)?.[1] || 0
          return parseInt(priceB) - parseInt(priceA)
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

  const handlePriceChange = (value) => {
    // Update filter state immediately for UI responsiveness
    setFilters({ ...filters, maxPrice: value })

    // Debounce URL update and refetch
    if (priceDebounceTimer.current) {
      clearTimeout(priceDebounceTimer.current)
    }

    priceDebounceTimer.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams)
      if (value && value < 2000) {
        newParams.set('maxPrice', value)
      } else {
        newParams.delete('maxPrice')
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
      maxPrice: '',
      sortBy: 'relevance'
    })
    setSearchParams({})
    setCurrentPage(1)
  }

  const renderStars = (rating) => {
    const displayRating = rating ? rating.toFixed(1) : '0.0'
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{displayRating}</span>
      </div>
    )
  }

  const ProductCard = ({ product }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300'}
            alt={product.name}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        </Link>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link
                to={`/product/${product.id}`}
                className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2"
              >
                {product.name}
              </Link>
              <p className="text-sm text-gray-600">{product.brand}</p>
            </div>
            <Badge variant="outline">{product.category}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            {renderStars(product.average_rating || 0)}
            <span className="text-sm text-gray-600">
              ({product.review_count || 0} reviews)
            </span>
          </div>
          
          {product.price_range && (
            <p className="text-lg font-semibold text-gray-900">{product.price_range}</p>
          )}
          
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        </div>
      </CardContent>
    </Card>
  )

  const ProductListItem = ({ product }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <Link to={`/product/${product.id}`} className="flex-shrink-0">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300'}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-md"
            />
          </Link>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link
                  to={`/product/${product.id}`}
                  className="font-semibold text-lg text-gray-900 hover:text-primary transition-colors"
                >
                  {product.name}
                </Link>
                <p className="text-gray-600">{product.brand}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline">{product.category}</Badge>
                {product.price_range && (
                  <p className="text-lg font-semibold text-gray-900 mt-1">{product.price_range}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {renderStars(product.average_rating || 0)}
              <span className="text-sm text-gray-600">
                ({product.review_count || 0} reviews)
              </span>
            </div>
            
            <p className="text-gray-600 line-clamp-2">{product.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {filters.query ? `Search results for "${filters.query}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${totalResults} products found`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                      !filters.category ? 'text-primary font-medium' : 'text-gray-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterChange('category', category.name)}
                      className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                        filters.category === category.name ? 'text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Range */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={filters.maxPrice || 2000}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>$0</span>
                    <span className="font-medium text-gray-900">
                      ${filters.maxPrice || 2000}
                    </span>
                    <span>$2000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Rating</h3>
                <div className="space-y-2">
                  {[
                    { value: '4', label: '4 stars & up' },
                    { value: '3', label: '3 stars & up' },
                    { value: '2', label: '2 stars & up' }
                  ].map((rating) => (
                    <label key={rating.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.minRating === rating.value}
                        onChange={(e) => handleFilterChange('minRating', e.target.checked ? rating.value : '')}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{rating.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sort By */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Sort by:</h3>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

            {/* Reset Filters Button */}
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* View Controls */}
            <div className="flex items-center justify-end mb-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Loading products...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchProducts} className="mt-4">
                  Try Again
                </Button>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No products found matching your criteria.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}

            {/* Products Grid/List */}
            {!loading && !error && products.length > 0 && (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center mt-12">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button variant="default">{currentPage}</Button>
                    <Button 
                      variant="outline"
                      disabled={products.length < 12}
                      onClick={() => setCurrentPage(currentPage + 1)}
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
    </div>
  )
}

