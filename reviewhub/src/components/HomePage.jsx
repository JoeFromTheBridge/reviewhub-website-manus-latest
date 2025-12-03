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

// Removed: import HealthStatusBanner from '@/components/HealthStatusBanner'

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
        apiService.getProducts({ per_page: 100 })
      ])

      const categoriesData = categoriesResponse?.categories || []
      setCategories(categoriesData)
      setCategoryCount(categoriesData.length)

      const reviewsData = reviewsResponse?.reviews || []
      setFeaturedReviews(reviewsData)
      const totalReviews =
        typeof reviewsResponse?.total === 'number'
          ? reviewsResponse.total
          : reviewsData.length
      setReviewCount(totalReviews)

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

  const getCategoryIcon = (categoryName = '') => {
    const n = String(categoryName).toLowerCase()
    if (n.includes('auto')) return automotiveIcon
    if (n.includes('beaut')) return beautyIcon
    if (n.includes('electr')) return electronicsIcon
    if (n.includes('home')) return homeIcon
    return electronicsIcon
  }

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
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Removed: HealthStatusBanner */}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white overflow-hidden mt-4">
        ...
      </section>

      {/* (Remaining sections unchanged) */}
    </div>
  )
}

export default HomePage
