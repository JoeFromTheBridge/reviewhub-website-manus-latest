// reviewhub/src/components/HomePage.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, TrendingUp, Users, Loader2, Home, Mountain, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import RecommendationSection from './recommendations/RecommendationSection'
import Footer from './Footer'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'

// Sample reviews for scrolling feed (used when API returns insufficient data)
const SAMPLE_REVIEWS = [
  { id: 1, username: "Sarah M.", initials: "SM", rating: 5, snippet: "This vacuum changed my life! No more pet hair everywhere.", productName: "Dyson V15 Detect" },
  { id: 2, username: "Mike T.", initials: "MT", rating: 4, snippet: "Great build quality, sturdy and reliable for outdoor use.", productName: "YETI Tundra 45 Cooler" },
  { id: 3, username: "Emily R.", initials: "ER", rating: 5, snippet: "My dog absolutely loves this bed. Best purchase ever!", productName: "Casper Dog Bed" },
  { id: 4, username: "Jason L.", initials: "JL", rating: 5, snippet: "Finally, a blender that actually crushes ice properly.", productName: "Vitamix E310" },
  { id: 5, username: "Amanda K.", initials: "AK", rating: 4, snippet: "Perfect for camping trips. Keeps food cold for days.", productName: "Coleman Xtreme Cooler" },
  { id: 6, username: "Chris P.", initials: "CP", rating: 5, snippet: "My cats are obsessed with this automatic feeder.", productName: "PetSafe Smart Feed" },
  { id: 7, username: "Linda W.", initials: "LW", rating: 5, snippet: "Super quiet and powerful. Worth every penny.", productName: "Miele Complete C3" },
  { id: 8, username: "David H.", initials: "DH", rating: 4, snippet: "Excellent tent, easy setup even in windy conditions.", productName: "REI Half Dome Plus" },
  { id: 9, username: "Rachel G.", initials: "RG", rating: 5, snippet: "Best cat litter I've ever used. No tracking!", productName: "World's Best Cat Litter" },
  { id: 10, username: "Tom B.", initials: "TB", rating: 5, snippet: "Makes smoothies in seconds. So easy to clean.", productName: "Ninja Professional Blender" },
  { id: 11, username: "Jessica N.", initials: "JN", rating: 4, snippet: "Great hiking boots, broke in quickly with no blisters.", productName: "Salomon X Ultra 4" },
  { id: 12, username: "Kevin S.", initials: "KS", rating: 5, snippet: "My puppy loves these treats. Vet approved!", productName: "Zuke's Mini Naturals" },
]

// Category data for the three launch categories
const LAUNCH_CATEGORIES = [
  {
    id: "home-everyday",
    name: "Home & Everyday",
    shortName: "Home",
    description: "Trusted reviews for products you use every day",
    iconGradient: "from-blue-500 to-blue-600",
    icon: Home,
    route: "/search?category=home-everyday&tab=products"
  },
  {
    id: "outdoor-sports",
    name: "Outdoor & Sporting Goods",
    shortName: "Outdoor",
    description: "Gear tested by real adventurers and athletes",
    iconGradient: "from-green-500 to-green-600",
    icon: Mountain,
    route: "/search?category=outdoor-sports&tab=products"
  },
  {
    id: "pet-products",
    name: "Pet Products",
    shortName: "Pets",
    description: "Reviews from pet parents who care",
    iconGradient: "from-purple-500 to-purple-600",
    icon: Heart,
    route: "/search?category=pet-products&tab=products"
  }
]

// Single Column Scrolling Review Feed Component
function ScrollingReviewFeed({ reviews }) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const prefersReducedMotion = useRef(false)

  // Tile height (approximate for single wide tile)
  const tileHeight = 110

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = mediaQuery.matches

    const handleChange = (e) => {
      prefersReducedMotion.current = e.matches
      if (e.matches) {
        setIsPaused(true)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Duplicate reviews for seamless loop
  const loopedReviews = useMemo(() => {
    return [...reviews, ...reviews, ...reviews]
  }, [reviews])

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion.current || isPaused) return

    let lastTime = 0
    const animate = (timestamp) => {
      if (!lastTime) lastTime = timestamp
      const delta = timestamp - lastTime

      // Target ~20fps for performance
      if (delta >= 50) {
        lastTime = timestamp
        setScrollPosition(prev => {
          const singleSetHeight = reviews.length * tileHeight
          const newPos = prev + 0.5 * (delta / 50)
          return newPos >= singleSetHeight ? 0 : newPos
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [reviews.length, isPaused])

  // Pause animation when not visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!prefersReducedMotion.current) {
          setIsPaused(!entry.isIntersecting)
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <section
      ref={containerRef}
      aria-label="Recent Community Reviews"
      className="relative overflow-hidden h-[400px]"
      style={{ willChange: 'transform' }}
    >
      <div
        className="absolute w-full"
        style={{
          transform: `translateY(-${scrollPosition}px)`,
          transition: prefersReducedMotion.current ? 'none' : undefined
        }}
      >
        {loopedReviews.map((review, idx) => (
          <article
            key={`${review.id}-${idx}`}
            className="bg-white rounded-lg shadow-sm p-4 mb-3"
          >
            <div className="flex items-start gap-4">
              {/* Avatar - Left side */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-base">
                  {review.initials || review.username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </span>
              </div>

              {/* Content - Right side */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-base truncate">
                    {review.username}
                  </span>
                  {renderStars(review.rating)}
                </div>
                <p className="text-gray-700 text-sm line-clamp-2 mb-1">
                  {review.snippet || review.comment || review.content || ''}
                </p>
                <p className="text-gray-400 text-xs mt-1 truncate">
                  {review.productName || review.product?.name || 'Product'}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Gradient overlays for smooth fade - match rich hero gradient */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#4A69BD] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#7B5DD6] to-transparent pointer-events-none z-10" />
    </section>
  )
}

// Mobile Scrolling Review Feed (contained in rounded box)
function MobileScrollingReviewFeed({ reviews }) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const prefersReducedMotion = useRef(false)

  const tileHeight = 100

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = mediaQuery.matches

    const handleChange = (e) => {
      prefersReducedMotion.current = e.matches
      if (e.matches) {
        setIsPaused(true)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const loopedReviews = useMemo(() => {
    return [...reviews, ...reviews, ...reviews]
  }, [reviews])

  useEffect(() => {
    if (prefersReducedMotion.current || isPaused) return

    let lastTime = 0
    const animate = (timestamp) => {
      if (!lastTime) lastTime = timestamp
      const delta = timestamp - lastTime

      if (delta >= 50) {
        lastTime = timestamp
        setScrollPosition(prev => {
          const singleSetHeight = reviews.length * tileHeight
          const newPos = prev + 0.4 * (delta / 50)
          return newPos >= singleSetHeight ? 0 : newPos
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [reviews.length, isPaused])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!prefersReducedMotion.current) {
          setIsPaused(!entry.isIntersecting)
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <section
      ref={containerRef}
      aria-label="Recent Community Reviews"
      className="relative overflow-hidden h-[280px] bg-white/10 rounded-xl mx-auto max-w-sm"
      style={{ willChange: 'transform' }}
    >
      <div
        className="absolute w-full px-3 pt-2"
        style={{
          transform: `translateY(-${scrollPosition}px)`,
          transition: prefersReducedMotion.current ? 'none' : undefined
        }}
      >
        {loopedReviews.map((review, idx) => (
          <article
            key={`${review.id}-${idx}`}
            className="bg-white rounded-lg shadow-sm p-3 mb-2"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {review.initials || review.username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {review.username}
                  </span>
                  {renderStars(review.rating)}
                </div>
                <p className="text-gray-700 text-xs line-clamp-2">
                  {review.snippet || ''}
                </p>
                <p className="text-gray-400 text-xs truncate mt-0.5">
                  {review.productName || 'Product'}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10 rounded-t-xl" />
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/10 to-transparent pointer-events-none z-10 rounded-b-xl" />
    </section>
  )
}

// Category Card Component
function CategoryCard({ category, featuredProducts = [] }) {
  const navigate = useNavigate()
  const IconComponent = category.icon

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
      {/* Icon Badge */}
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.iconGradient} flex items-center justify-center mb-4`}>
        <IconComponent className="w-6 h-6 text-white" />
      </div>

      {/* Category Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4">{category.description}</p>

      {/* Product Count */}
      <p className="text-sm text-gray-500 mb-4">
        {featuredProducts.length > 0
          ? `${featuredProducts.length}+ products reviewed`
          : 'First reviews coming soon!'
        }
      </p>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div className="space-y-2 mb-4">
          {featuredProducts.slice(0, 2).map((product, index) => (
            <div key={product.id || index} className="flex items-center gap-2">
              {renderStars(product.average_rating || product.averageRating || 5)}
              <span className="text-gray-600 text-sm truncate">
                {product.name || product.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA Button */}
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        onClick={() => navigate(category.route)}
      >
        Explore {category.shortName}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Card>
  )
}

export function HomePage() {
  const [categories, setCategories] = useState([])
  const [featuredReviews, setFeaturedReviews] = useState([])
  const [products, setProducts] = useState([])
  const [reviewCount, setReviewCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [categoryCount, setCategoryCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
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
        apiService.getReviews({ limit: 15, sort: 'created_at' }),
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

      // Try to fetch user count (gracefully handle if endpoint doesn't exist)
      try {
        const statsResponse = await apiService.getStats?.()
        if (statsResponse?.user_count != null) {
          setUserCount(statsResponse.user_count)
        } else if (statsResponse?.users != null) {
          setUserCount(statsResponse.users)
        }
      } catch {
        // User count endpoint may not exist yet - that's OK
      }
    } catch (error) {
      setError('Failed to load homepage data')
      console.error('Error fetching homepage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCount = (value) => {
    return Number(value || 0).toLocaleString()
  }

  // Dynamic subheadline based on user count thresholds
  const getHeroSubheadline = () => {
    if (userCount >= 10000) {
      return "Join 10,000+ shoppers who've found honest product feedback—no brands, no bots, no paid promotions."
    } else if (userCount >= 1000) {
      return "Join 1,000+ shoppers who've found honest product feedback—no brands, no bots, no paid promotions."
    } else if (userCount >= 100) {
      return "Join 100+ shoppers who've found honest product feedback—no brands, no bots, no paid promotions."
    }
    return "Join shoppers building Canada's most trusted review community—no brands, no bots, no paid promotions."
  }

  // Handle write review button - auth-aware navigation
  const handleWriteReview = () => {
    if (isAuthenticated) {
      navigate('/search?tab=products')
    } else {
      navigate('/signup', { state: { from: '/search?tab=products' } })
    }
  }

  // Prepare reviews for scrolling feed - use API data if sufficient, otherwise use samples
  const scrollingReviews = useMemo(() => {
    if (featuredReviews.length >= 6) {
      return featuredReviews.map((review, index) => ({
        id: review.id || index,
        username: review.user?.username || review.user_username || review.user_name || 'Anonymous',
        initials: (review.user?.username || review.user_username || 'A')[0].toUpperCase(),
        rating: review.rating || 5,
        snippet: review.comment || review.content || '',
        productName: review.product?.name || review.product_name || 'Product'
      }))
    }
    return SAMPLE_REVIEWS
  }, [featuredReviews])

  // Get featured products for each category
  const getCategoryFeaturedProducts = (categoryId) => {
    // Map our launch category IDs to potential API category names
    const categoryMappings = {
      'home-everyday': ['home', 'home & garden', 'home & everyday', 'household', 'kitchen', 'appliances'],
      'outdoor-sports': ['outdoor', 'sports', 'outdoor & sports', 'sporting goods', 'camping', 'hiking'],
      'pet-products': ['pet', 'pets', 'pet products', 'pet supplies', 'animals']
    }

    const matchingNames = categoryMappings[categoryId] || []

    return products.filter(product => {
      const productCategory = (product.category || product.category_name || '').toLowerCase()
      return matchingNames.some(name => productCategory.includes(name))
    }).slice(0, 2)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section - Rich blue-purple gradient */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#4A69BD] via-[#6B5DD6] to-[#8B6DD4]">
        <div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{
            paddingTop: 'clamp(40px, 10vh, 140px)',
            paddingBottom: 'clamp(32px, 7vh, 100px)',
          }}
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="font-bold text-white mb-4 lg:mb-6 leading-[1.1] text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem]">
                Real Reviews. Real People.
                <span className="block text-[#FFC107] mt-1">Zero BS.</span>
              </h1>
              <p className="text-white/90 mb-8 lg:mb-10 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg lg:text-xl leading-relaxed">
                {getHeroSubheadline()}
              </p>

              {/* Mobile: Scrolling feed between subheadline and CTAs */}
              <div className="md:hidden mb-8">
                <MobileScrollingReviewFeed reviews={scrollingReviews} />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {/* Primary CTA: Find Your Next Purchase */}
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-white/95 hover:shadow-lg hover:-translate-y-0.5 rounded-lg font-semibold w-full sm:w-auto px-8 py-4 min-h-[52px] text-lg transition-all duration-200"
                  onClick={() => navigate('/search?tab=products')}
                >
                  Find Your Next Purchase
                </Button>
                {/* Secondary CTA: Share Your Experience */}
                <Button
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-lg font-medium w-full sm:w-auto px-8 py-4 min-h-[52px] text-lg transition-all duration-200"
                  onClick={handleWriteReview}
                >
                  Share Your Experience
                </Button>
              </div>
            </div>

            {/* Right Column - Single Column Scrolling Review Feed (Desktop/Tablet) */}
            <div className="hidden md:block">
              <ScrollingReviewFeed reviews={scrollingReviews} />
            </div>
          </div>
        </div>
      </section>

      {/* Everything below hero uses search page gradient (bg-gradient-primary) */}
      <div className="flex-1 bg-gradient-primary">
        {/* Stats Section - Positioned for credibility (right after hero) */}
        {!loading && !error && (
          <section className="py-12 sm:py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                <p className="text-sm sm:text-base text-gray-500 uppercase tracking-[0.15em] mb-2">Trusted by Canadians</p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Our Community</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="bg-soft-blue p-4 rounded-full mb-4 shadow-sm">
                    <Star className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    {formatCount(reviewCount)}
                  </h3>
                  <p className="text-base lg:text-lg text-gray-600">Total Reviews</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-soft-blue p-4 rounded-full mb-4 shadow-sm">
                    <TrendingUp className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    {formatCount(productCount)}
                  </h3>
                  <p className="text-base lg:text-lg text-gray-600">Products Listed</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-soft-blue p-4 rounded-full mb-4 shadow-sm">
                    <Users className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    {formatCount(categoryCount)}
                  </h3>
                  <p className="text-base lg:text-lg text-gray-600">Categories Covered</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Category Browse Sections */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-gray-500 uppercase tracking-wide text-sm mb-2">EXPLORE</p>
              <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                {LAUNCH_CATEGORIES.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    featuredProducts={getCategoryFeaturedProducts(category.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

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
