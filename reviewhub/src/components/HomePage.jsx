// reviewhub/src/components/HomePage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, TrendingUp, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import RecommendationSection from './recommendations/RecommendationSection'
import ImageOptimizer from './ui/image-optimizer'
import Footer from './Footer'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'

import heroImage from '../assets/hero_image.png'
import electronicsIcon from '../assets/category_electronics.png'
import automotiveIcon from '../assets/category_automotive.png'
import homeIcon from '../assets/category_home.png'
import beautyIcon from '../assets/category_beauty.png'

// Helper to safely extract image URL from various API response structures
function getReviewImageUrl(image) {
  if (!image) return ''

  // Plain string - check if it's a valid URL
  if (typeof image === 'string') {
    const trimmed = image.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
      return trimmed
    }
    return `/${trimmed.replace(/^\/+/, '')}`
  }

  // If backend nests inside an `image` field
  if (image.image && typeof image.image === 'string') {
    return getReviewImageUrl(image.image)
  }
  if (image.image && typeof image.image === 'object') {
    const nested = getReviewImageUrl(image.image)
    if (nested) return nested
  }

  // Try various common field names
  const candidate =
    image.file_url ||
    image.url ||
    image.image_url ||
    image.file_path ||
    image.path ||
    image.location ||
    image.src ||
    image.thumbnail_url ||
    null

  if (!candidate) return ''

  const trimmed = String(candidate).trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed
  }

  return `/${trimmed.replace(/^\/+/, '')}`
}

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [featuredReviews, setFeaturedReviews] = useState([])
  const [products, setProducts] = useState([])
  const [reviewCount, setReviewCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [categoryCount, setCategoryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetchHomePageData()
  }, [])

  const fetchHomePageData = async () => {
    try {
      setLoading(true)
      setError('')

      const [categoriesResponse, reviewsResponse, productsResponse] = await Promise.all([
        apiService.getCategories(),
        apiService.getReviews({ limit: 6, sort: 'created_at' }),
        // Fetch products so we can map review.product_id → product name/brand
        apiService.getProducts({ per_page: 100 })
      ])

      // Categories
      const categoriesData = categoriesResponse?.categories || []
      setCategories(categoriesData)
      setCategoryCount(categoriesData.length)

      // Reviews (recent list + total count)
      const reviewsData = reviewsResponse?.reviews || []
      setFeaturedReviews(reviewsData)
      const totalReviews =
        typeof reviewsResponse?.total === 'number'
          ? reviewsResponse.total
          : reviewsData.length
      setReviewCount(totalReviews)

      // Products (list + total count from paginated endpoint)
      const productsData = productsResponse?.products || []
      setProducts(productsData)

      const totalProducts =
        typeof productsResponse?.total === 'number'
          ? productsResponse.total
          : productsData.length
      setProductCount(totalProducts)
    } catch (error) {
      setError('Failed to load homepage data')
      console.error('Error fetching homepage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Build a category-specific search URL (using slug + id when available)
  const buildCategoryHref = (category) => {
    if (!category) return '/search?tab=reviews'

    const isString = typeof category === 'string'
    const slug = isString
      ? category
      : category.slug || category.name || 'all'

    const params = new URLSearchParams()
    params.set('tab', 'reviews')
    params.set('category', slug)

    if (!isString) {
      if (category.id != null) {
        params.set('category_id', String(category.id))
      }
      if (category.name) {
        params.set('category_name', category.name)
      }
    }

    return `/search?${params.toString()}`
  }

  // More forgiving icon picker: handles "Home", "Home & Garden", "Beauty", etc.
  const getCategoryIcon = (categoryName = '') => {
    const n = String(categoryName).toLowerCase()
    if (n.includes('auto')) return automotiveIcon
    if (n.includes('beaut')) return beautyIcon
    if (n.includes('electr')) return electronicsIcon
    if (n.includes('home')) return homeIcon
    // Fallback
    return electronicsIcon
  }

  // Static fallback tiles for Phase 0 when API returns empty
  const STATIC_CATEGORIES = [
    { id: 'electronics', name: 'Electronics', slug: 'electronics', img: electronicsIcon },
    { id: 'automotive', name: 'Automotive', slug: 'automotive', img: automotiveIcon },
    { id: 'home', name: 'Home & Garden', slug: 'home-garden', img: homeIcon },
    { id: 'beauty', name: 'Beauty & Health', slug: 'beauty-health', img: beautyIcon }
  ]

  const formatCount = (value) => {
    return Number(value || 0).toLocaleString()
  }

  // Helper to get product price (similar to SearchResults)
  const getProductPrice = (product) => {
    if (!product) return null
    const priceMin = product.price_min ?? product.price ?? product.priceMin ?? null
    const priceMax = product.price_max ?? product.priceMax ?? null
    if (priceMin !== null) {
      return { min: Number(priceMin), max: priceMax !== null ? Number(priceMax) : Number(priceMin) }
    }
    if (product.price_range) {
      const matches = product.price_range.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)
      if (matches && matches.length >= 1) {
        const prices = matches.map(m => Number(m.replace(/[$,]/g, '')))
        return { min: prices[0], max: prices[prices.length - 1] }
      }
    }
    return null
  }

  const formatPrice = (product) => {
    const price = getProductPrice(product)
    if (!price) return product?.price_range || null
    if (price.min === price.max) {
      return `$${price.min.toLocaleString()}`
    }
    return `$${price.min.toLocaleString()} - $${price.max.toLocaleString()}`
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-star-gold text-star-gold'
                : 'text-border-light'
            }`}
          />
        ))}
      </div>
    )
  }

  // Handle write review button - auth-aware navigation
  const handleWriteReview = () => {
    if (isAuthenticated) {
      navigate('/search?tab=products')
    } else {
      navigate('/signup', { state: { from: '/search?tab=products' } })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue to-soft-lavender flex flex-col">
      {/* Hero Section - with softened CTA gradient */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#5B7DD4]/75 to-[#A391E2]/75">
        <div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{
            paddingTop: 'clamp(32px, 8vh, 120px)',
            paddingBottom: 'clamp(24px, 5vh, 80px)',
          }}
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1
                className="font-semibold text-white mb-4 lg:mb-6 leading-tight"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                }}
              >
                Make Smarter
                <span className="block text-white/90">Purchase Decisions</span>
              </h1>
              <p
                className="text-white/80 mb-6 lg:mb-8 max-w-lg mx-auto lg:mx-0"
                style={{
                  fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)',
                }}
              >
                Read authentic reviews from real customers and share your own experiences
                to help others make informed choices.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {/* Primary: Browse Products - larger, more prominent */}
                <Button
                  size="lg"
                  className="bg-white text-accent-blue hover:bg-white/90 rounded-md font-medium w-full sm:w-auto sm:min-w-[160px] min-h-[48px]"
                  style={{
                    padding: '0.75rem 2rem',
                  }}
                  onClick={() => navigate('/search?tab=products')}
                >
                  Browse Products
                </Button>
                {/* Secondary: Write Your First Review - improved visibility */}
                <Button
                  variant="outline"
                  className="text-white border-white/80 hover:bg-white hover:text-accent-blue rounded-md w-full sm:w-auto sm:min-w-[160px] min-h-[44px] bg-white/10 backdrop-blur-sm shadow-sm"
                  style={{
                    padding: '0.625rem 1.5rem',
                    fontSize: '0.875rem',
                  }}
                  onClick={handleWriteReview}
                >
                  Write Your First Review
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <ImageOptimizer
                src={heroImage}
                alt="ReviewHub - Product Reviews Platform"
                width={500}
                height={400}
                className="rounded-xl shadow-sleek"
                lazy={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main content wrapper - gradient flows across all sections */}
      <div className="flex-1 bg-gradient-to-br from-soft-blue to-soft-lavender">
        {/* Recent Reviews Section - Directly after Hero */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-8 lg:mb-12">
              <p className="text-sm sm:text-base text-text-secondary uppercase tracking-[0.1em] mb-1 sm:mb-2">Community</p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary">Recent Reviews</h2>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
              </div>
            ) : (
              <div
                className="grid gap-4 lg:gap-6"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                }}
              >
                {featuredReviews.map((review) => {
                  // Product id from review
                  const productId =
                    review.product?.id ??
                    review.product?.product_id ??
                    review.product_id ??
                    review.productId ??
                    null

                  // Try to find the full product in the products list
                  const matchedProduct = productId
                    ? products.find(
                        (p) =>
                          p.id === productId ||
                          p.product_id === productId
                      )
                    : null

                  const productName =
                    matchedProduct?.name ||
                    matchedProduct?.title ||
                    matchedProduct?.product_name ||
                    review.product?.name ||
                    review.product?.product_name ||
                    review.product_name ||
                    (review.title && review.title !== 'Review'
                      ? review.title
                      : 'Product')

                  const productBrand =
                    matchedProduct?.brand ||
                    matchedProduct?.manufacturer ||
                    review.product?.brand ||
                    review.product?.manufacturer ||
                    review.brand ||
                    review.product_brand ||
                    null

                  const productCategory =
                    matchedProduct?.category ||
                    review.product?.category ||
                    null

                  const productImage =
                    matchedProduct?.image_url ||
                    matchedProduct?.imageUrl ||
                    matchedProduct?.image ||
                    matchedProduct?.thumbnail ||
                    matchedProduct?.thumbnail_url ||
                    review.product?.image_url ||
                    review.product?.imageUrl ||
                    review.product?.image ||
                    null

                  const priceDisplay = formatPrice(matchedProduct)

                  // Get review images/photos if available (check multiple possible field names)
                  const reviewImages = review.images || review.photos || review.image_urls || review.photo_urls || review.media || []
                  const firstReviewImage = reviewImages.length > 0 ? reviewImages[0]?.url || reviewImages[0] : null

                  const reviewTitle =
                    review.title && review.title !== 'Review'
                      ? review.title
                      : `Review of ${productName}`

                  return (
                    <Card key={review.id} className="bg-white-surface shadow-sleek hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 rounded-md overflow-hidden">
                      {/* Product Image at Top of Tile - only shown if product has an image */}
                      {productImage && (
                        <Link to={productId ? `/product/${productId}` : '#'}>
                          <div className="w-full h-40 bg-soft-blue">
                            <img
                              src={productImage}
                              alt={productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>
                      )}
                      <CardContent className="p-4 lg:p-6">
                        {/* Category Badge */}
                        {productCategory && (
                          <Badge variant="secondary" className="bg-soft-blue text-accent-blue rounded-sm mb-2 text-xs">
                            {productCategory}
                          </Badge>
                        )}

                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            {productId ? (
                              <Link
                                to={`/product/${productId}`}
                                className="font-semibold text-text-primary hover:text-accent-blue transition-colors line-clamp-1 text-sm lg:text-base"
                              >
                                {productName}
                              </Link>
                            ) : (
                              <span className="font-semibold text-text-primary line-clamp-1 text-sm lg:text-base">
                                {productName}
                              </span>
                            )}
                            {productBrand && (
                              <p className="text-xs lg:text-sm text-text-secondary truncate">{productBrand}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {renderStars(review.rating)}
                          </div>
                        </div>

                        {/* Price */}
                        {priceDisplay && (
                          <p className="text-base lg:text-lg font-bold text-accent-blue mb-2">{priceDisplay}</p>
                        )}

                        {/* Review Title & Content */}
                        <h4 className="font-medium text-text-primary mb-2 text-sm lg:text-base line-clamp-1">
                          {reviewTitle}
                        </h4>
                        <p className="text-text-secondary text-xs lg:text-sm mb-3 line-clamp-3">
                          {review.comment || review.content}
                        </p>

                        {/* Review image thumbnails */}
                        {(() => {
                          // Extract valid image URLs using helper
                          const validImages = reviewImages
                            .map(img => getReviewImageUrl(img))
                            .filter(url => url && url.length > 0)

                          if (validImages.length === 0) return null

                          return (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                              {validImages.slice(0, 4).map((imgUrl, idx) => (
                                <img
                                  key={idx}
                                  src={imgUrl}
                                  alt={`Review photo ${idx + 1}`}
                                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-sm"
                                />
                              ))}
                              {validImages.length > 4 && (
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-soft-blue rounded-sm flex items-center justify-center text-xs text-accent-blue font-medium">
                                  +{validImages.length - 4}
                                </div>
                              )}
                            </div>
                          )
                        })()}


                        {/* Reviewer info - tighter spacing, reduced visual weight */}
                        <div className="flex items-center justify-between text-xs text-text-secondary/70 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]">
                              {review.user?.username ||
                                review.user_username ||
                                review.user_name ||
                                'Anonymous'}
                            </span>
                            {(review.is_verified || review.verified_purchase) && (
                              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                Verified
                              </span>
                            )}
                          </div>
                          {/* Only show helpful count if > 0 */}
                          {(review.helpful_count > 0) && (
                            <span className="text-text-secondary/60">{review.helpful_count} helpful</span>
                          )}
                        </div>

                        {/* Review This Product Button */}
                        {productId && (
                          <Button
                            variant="outline"
                            className="w-full border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white rounded-md min-h-[44px] text-sm"
                            onClick={() => {
                              if (isAuthenticated) {
                                navigate(`/product/${productId}?writeReview=true`)
                              } else {
                                navigate('/signup', { state: { from: `/product/${productId}?writeReview=true` } })
                              }
                            }}
                          >
                            Review This Product
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <div className="text-center mt-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] text-white hover:opacity-90 transition-opacity rounded-md px-8"
                onClick={() => navigate('/search?tab=reviews')}
              >
                View All Reviews
              </Button>
            </div>
          </div>
        </section>

        {/* Categories Section - Redesigned as clean navigation tiles */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-8 lg:mb-12">
              <p className="text-sm sm:text-base text-text-secondary uppercase tracking-[0.1em] mb-1 sm:mb-2">Explore</p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary">Browse by Category</h2>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
              </div>
            ) : (
              <div
                className="grid gap-3 sm:gap-4 lg:gap-5"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
                }}
              >
                {(() => {
                  // Use API categories if available, fallback to static
                  const categoryList = categories.length ? categories : STATIC_CATEGORIES

                  // Filter out categories with 0 products (if product_count is available)
                  const visibleCategories = categoryList.filter(cat => {
                    // If product_count is explicitly 0, hide it
                    if (cat.product_count === 0) return false
                    return true
                  })

                  return visibleCategories.map((category) => {
                    const name = category.name || category.title || 'Category'
                    const href = buildCategoryHref(category)
                    const productCount = category.product_count
                    const hasProducts = productCount !== undefined && productCount !== null

                    return (
                      <Link
                        key={category.id || category.slug || name}
                        to={href}
                        className="group block"
                      >
                        <Card className="bg-white border border-border-light/60 shadow-sm hover:shadow-md hover:border-accent-blue/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer rounded-lg overflow-hidden">
                          <CardContent className="p-0">
                            {/* Full-card tappable button */}
                            <div className="min-h-[72px] sm:min-h-[80px] flex flex-col items-center justify-center px-4 py-4 sm:py-5">
                              <h3 className="font-semibold text-text-primary text-sm sm:text-base text-center leading-tight mb-1">
                                {name}
                              </h3>
                              {hasProducts && (
                                <p className="text-xs text-text-secondary/60">
                                  {productCount} {productCount === 1 ? 'product' : 'products'}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        </section>

        {/* Stats (live from API) */}
        {!loading && !error && (
          <section className="py-8 sm:py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="text-center mb-6 sm:mb-8 lg:mb-12">
                <p className="text-sm sm:text-base text-text-secondary uppercase tracking-[0.1em] mb-1 sm:mb-2">Statistics</p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary">Our Community</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="bg-white-surface p-4 rounded-full mb-4 shadow-sleek">
                    <Star className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-4xl font-bold text-text-primary mb-2">
                    {formatCount(reviewCount)}
                  </h3>
                  <p className="text-lg text-text-secondary">Total Reviews</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white-surface p-4 rounded-full mb-4 shadow-sleek">
                    <TrendingUp className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-4xl font-bold text-text-primary mb-2">
                    {formatCount(productCount)}
                  </h3>
                  <p className="text-lg text-text-secondary">Products Listed</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white-surface p-4 rounded-full mb-4 shadow-sleek">
                    <Users className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-4xl font-bold text-text-primary mb-2">
                    {formatCount(categoryCount)}
                  </h3>
                  <p className="text-lg text-text-secondary">Categories Covered</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Personalized Recommendations (for authenticated users) */}
        {isAuthenticated && (
          <section className="py-8 sm:py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <RecommendationSection
                title="Recommended for You"
                type="user"
                limit={6}
                showReasons={true}
              />
            </div>
          </section>
        )}

        {/* Trending Products */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <RecommendationSection
              title="Trending Products"
              type="trending"
              limit={6}
              showReasons={false}
            />
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default HomePage
