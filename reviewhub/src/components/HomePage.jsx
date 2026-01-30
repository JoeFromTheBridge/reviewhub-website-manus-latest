// reviewhub/src/components/HomePage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, TrendingUp, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import RecommendationSection from './recommendations/RecommendationSection'
import ImageOptimizer from './ui/image-optimizer'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'

import heroImage from '../assets/hero_image.png'
import electronicsIcon from '../assets/category_electronics.png'
import automotiveIcon from '../assets/category_automotive.png'
import homeIcon from '../assets/category_home.png'
import beautyIcon from '../assets/category_beauty.png'

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue to-soft-lavender">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] pb-[80px]">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-[48px] font-semibold text-text-primary mb-6 leading-tight">
                Make Smarter
                <span className="block text-accent-blue">Purchase Decisions</span>
              </h1>
              <p className="text-lg text-text-secondary mb-8">
                Read authentic reviews from real customers and share your own experiences
                to help others make informed choices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {/* From hero, go to SearchPage showing review results */}
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] text-white hover:opacity-90 transition-opacity rounded-md px-8"
                  onClick={() => navigate('/search?tab=reviews')}
                >
                  Explore Reviews
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white rounded-md px-8"
                  onClick={() => navigate('/search')}
                >
                  Write a Review
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

      {/* Stats (live from API) */}
      {!loading && !error && (
        <section className="py-16 bg-white-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-soft-blue p-4 rounded-full mb-4">
                  <Star className="h-8 w-8 text-accent-blue" />
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-2">
                  {formatCount(reviewCount)}
                </h3>
                <p className="text-text-secondary">Total Reviews</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-soft-blue p-4 rounded-full mb-4">
                  <TrendingUp className="h-8 w-8 text-accent-blue" />
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-2">
                  {formatCount(productCount)}
                </h3>
                <p className="text-text-secondary">Products Listed</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-soft-blue p-4 rounded-full mb-4">
                  <Users className="h-8 w-8 text-accent-blue" />
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-2">
                  {formatCount(categoryCount)}
                </h3>
                <p className="text-text-secondary">Categories Covered</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm text-text-secondary uppercase tracking-[0.1em] mb-2">Explore</p>
            <h2 className="text-2xl font-semibold text-text-primary">Browse by Category</h2>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
            </div>
          ) : error ? (
            // If error, still show static categories so the section isn't empty
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STATIC_CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  to={buildCategoryHref(category)}
                  className="group"
                >
                  <Card className="bg-white-surface shadow-sleek hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-md">
                    <CardContent className="p-6 text-center">
                      <img
                        src={category.img}
                        alt={category.name}
                        className="w-8 h-8 mx-auto mb-4 group-hover:scale-110 transition-transform"
                      />
                      <h3 className="font-semibold text-text-primary mb-2">{category.name}</h3>
                      <p className="text-sm text-text-secondary">Explore products</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(categories.length ? categories : STATIC_CATEGORIES).map((category) => {
                const name = category.name || category.title || 'Category'
                const href = buildCategoryHref(category)
                const img = category.img || getCategoryIcon(name)

                return (
                  <Link
                    key={category.id || category.slug || name}
                    to={href}
                    className="group"
                  >
                    <Card className="bg-white-surface shadow-sleek hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-md">
                      <CardContent className="p-6 text-center">
                        <img
                          src={img}
                          alt={name}
                          className="w-8 h-8 mx-auto mb-4 group-hover:scale-110 transition-transform"
                        />
                        <h3 className="font-semibold text-text-primary mb-2">{name}</h3>
                        <p className="text-sm text-text-secondary">
                          {category.product_count ?? 'Explore products'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recent Reviews Section */}
      <section className="py-16 bg-white-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm text-text-secondary uppercase tracking-[0.1em] mb-2">Community</p>
            <h2 className="text-2xl font-semibold text-text-primary">Recent Reviews</h2>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                const reviewTitle =
                  review.title && review.title !== 'Review'
                    ? review.title
                    : `Review of ${productName}`

                const ReviewProductWrapper = ({ children }) =>
                  productId ? (
                    <Link
                      to={`/product/${productId}`}
                      className="font-semibold text-text-primary hover:text-accent-blue transition-colors"
                    >
                      {children}
                    </Link>
                  ) : (
                    <span className="font-semibold text-text-primary">
                      {children}
                    </span>
                  )

                return (
                  <Card key={review.id} className="bg-white-surface shadow-sleek hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 rounded-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <ReviewProductWrapper>
                            {productName}
                          </ReviewProductWrapper>
                          {productBrand && (
                            <p className="text-sm text-text-secondary">{productBrand}</p>
                          )}
                        </div>
                        {renderStars(review.rating)}
                      </div>

                      <h4 className="font-medium text-text-primary mb-2">
                        {reviewTitle}
                      </h4>
                      <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                        {review.comment || review.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <div className="flex items-center space-x-2">
                          <span>
                            By{' '}
                            {review.user?.username ||
                              review.user_username ||
                              review.user_name ||
                              'Anonymous'}
                          </span>
                          {(review.is_verified || review.verified_purchase) && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              Verified
                            </span>
                          )}
                        </div>
                        <span>{review.helpful_count || 0} helpful</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="text-center mt-8">
            {/* From Recent Reviews, go to SearchPage showing reviews */}
            <Button
              variant="outline"
              size="lg"
              className="border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white rounded-md"
              onClick={() => navigate('/search?tab=reviews')}
            >
              View All Reviews
            </Button>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations (for authenticated users) */}
      {isAuthenticated && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <section className="py-16 bg-white-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecommendationSection
            title="Trending Products"
            type="trending"
            limit={6}
            showReasons={false}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-[0.1em] mb-2 opacity-80">Get Started</p>
          <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
          <p className="text-lg mb-8 opacity-90">
            Share your experiences and help others make better purchasing decisions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-accent-blue hover:bg-white/90 rounded-md px-8"
              onClick={() => navigate('/search')}
            >
              Write Your First Review
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-accent-blue rounded-md px-8"
              onClick={() => navigate('/search?tab=products')}
            >
              Browse Products
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
