// reviewhub/src/components/ProductPage.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  ThumbsUp,
  Shield,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import RecommendationSection from './recommendations/RecommendationSection';
import SimilarProducts from './search/SimilarProducts';
import { ReviewForm } from './reviews/ReviewForm';
import apiService from '../services/api';

const MAX_REVIEW_IMAGES = 5;

// Safely normalize any "image-ish" value to a URL string
function getReviewImageUrl(image) {
  if (!image) return '';

  // Plain string
  if (typeof image === 'string') {
    const trimmed = image.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
      return trimmed;
    }
    return `/${trimmed.replace(/^\/+/, '')}`;
  }

  // If backend nests inside an `image` field
  if (image.image && typeof image.image === 'string') {
    return getReviewImageUrl(image.image);
  }
  if (image.image && typeof image.image === 'object') {
    const nested = getReviewImageUrl(image.image);
    if (nested) return nested;
  }

  const candidate =
    image.file_url ||
    image.url ||
    image.image_url ||
    image.file_path ||
    image.path ||
    image.location ||
    image.src ||
    image.thumbnail_url ||
    null;

  if (!candidate) return '';

  const trimmed = String(candidate).trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, '')}`;
}

// Return { thumb, full } for a single image object/value
function getReviewImagePair(image) {
  if (!image) return null;

  // Simple string: use same URL for thumb and full
  if (typeof image === 'string') {
    const url = getReviewImageUrl(image);
    if (!url) return null;
    return { thumb: url, full: url };
  }

  // Prefer explicit thumbnail / main fields when present
  const thumbUrl = getReviewImageUrl(
    image.thumbnail_url ||
      image.thumb_url ||
      image.thumbnail ||
      image.thumb ||
      image
  );

  const fullUrl = getReviewImageUrl(
    image.file_url ||
      image.main_url ||
      image.full_url ||
      image.url ||
      image.image_url ||
      image
  );

  if (!thumbUrl && !fullUrl) return null;

  return {
    thumb: thumbUrl || fullUrl,
    full: fullUrl || thumbUrl,
  };
}

// Collect image pairs from all likely fields on the review
function collectReviewImages(review) {
  if (!review) return [];

  const candidates = [
    review.images,
    review.review_images,
    review.reviewImages,
    review.image_urls,
    review.imageUrls,
  ].filter(Array.isArray);

  const flat = candidates.flat().filter(Boolean);

  const pairs = flat
    .map((img) => getReviewImagePair(img))
    .filter((p) => p && p.thumb && p.full);

  // Deduplicate by full URL
  const seen = new Set();
  const unique = [];
  for (const p of pairs) {
    const key = p.full;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }

  return unique;
}

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);

  // Lightbox state
  const [lightbox, setLightbox] = useState({
    open: false,
    images: [],
    currentIndex: 0,
    scale: 1,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lightboxContainerRef = useRef(null);
  const thumbRefs = useRef([]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          navigate('/404');
          return;
        }

        const productData = await apiService.getProduct(numericId);
        setProduct(productData);

        // Fetch reviews
        const reviewsData = await apiService.getProductReviews(numericId);
        setReviews(reviewsData.reviews || []);
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  // Parse query params for sort/filter on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sortParam = params.get('sort');
    const ratingParam = params.get('rating');
    const photosParam = params.get('photos');

    if (sortParam && ['newest', 'oldest', 'highest', 'lowest', 'helpful'].includes(sortParam)) {
      setSortBy(sortParam);
    }

    if (ratingParam && ['1', '2', '3', '4', '5'].includes(ratingParam)) {
      setFilterRating(ratingParam);
    }

    if (photosParam === '1') {
      setOnlyWithPhotos(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on initial mount

  // Keep URL in sync with sort/filter/photo state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('sort', sortBy);
    params.set('rating', filterRating);

    if (onlyWithPhotos) {
      params.set('photos', '1');
    } else {
      params.delete('photos');
    }

    const newSearch = params.toString();
    const currentSearch = location.search.replace(/^\?/, '');

    if (newSearch !== currentSearch) {
      navigate(
        {
          pathname: location.pathname,
          search: newSearch,
        },
        { replace: true }
      );
    }
  }, [sortBy, filterRating, onlyWithPhotos, location.pathname, location.search, navigate]);

  // Track product view
  useEffect(() => {
    if (product?.id) {
      apiService.trackInteraction({
        interaction_type: 'view',
        product_id: product.id,
      }).catch((err) => console.error('Failed to track view:', err));
    }
  }, [product?.id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox.open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightbox((prev) => ({ ...prev, open: false, scale: 1 }));
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        setIsFullscreen(false);
      } else if (e.key === 'ArrowLeft') {
        setLightbox((prev) => {
          if (!prev.images.length) return prev;
          const total = prev.images.length;
          const nextIndex = (prev.currentIndex - 1 + total) % total;
          return { ...prev, currentIndex: nextIndex, scale: 1 };
        });
      } else if (e.key === 'ArrowRight') {
        setLightbox((prev) => {
          if (!prev.images.length) return prev;
          const total = prev.images.length;
          const nextIndex = (prev.currentIndex + 1) % total;
          return { ...prev, currentIndex: nextIndex, scale: 1 };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.open]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (lightbox.open && thumbRefs.current[lightbox.currentIndex]) {
      thumbRefs.current[lightbox.currentIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [lightbox.open, lightbox.currentIndex]);

  // Computed values
  const productName = product?.name || 'Product';
  const productBrand = product?.brand || null;
  const description = product?.description || '';
  const category = product?.category || '';
  const imageUrl = product?.image_url || 'https://via.placeholder.com/800x400?text=Product+Image';
  const specs = product?.specifications || [];

  // Calculate rating stats
  const ratingStats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: [
          { stars: 5, count: 0, percentage: 0 },
          { stars: 4, count: 0, percentage: 0 },
          { stars: 3, count: 0, percentage: 0 },
          { stars: 2, count: 0, percentage: 0 },
          { stars: 1, count: 0, percentage: 0 },
        ],
        photoCount: 0,
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const average = total > 0 ? sum / total : 0;

    const countsByRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let photoCount = 0;

    reviews.forEach((r) => {
      const rating = r.rating || 0;
      if (rating >= 1 && rating <= 5) {
        countsByRating[rating] = (countsByRating[rating] || 0) + 1;
      }
      const images = collectReviewImages(r);
      if (images.length > 0) {
        photoCount++;
      }
    });

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = countsByRating[stars] || 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { stars, count, percentage };
    });

    return { average, total, distribution, photoCount };
  }, [reviews]);

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Filter by rating
    if (filterRating !== 'all') {
      const targetRating = parseInt(filterRating, 10);
      filtered = filtered.filter((r) => r.rating === targetRating);
    }

    // Filter by photos
    if (onlyWithPhotos) {
      filtered = filtered.filter((r) => {
        const images = collectReviewImages(r);
        return images.length > 0;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'highest':
          return (b.rating || 0) - (a.rating || 0);
        case 'lowest':
          return (a.rating || 0) - (b.rating || 0);
        case 'helpful':
          return (b.helpful_votes || 0) - (a.helpful_votes || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, sortBy, filterRating, onlyWithPhotos]);

  // Render star icons
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-5 h-5">
            <Star className="w-5 h-5 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-300" />);
      }
    }

    return stars;
  };

  // Lightbox functions
  const openLightbox = (images, startIndex) => {
    if (!images || images.length === 0) return;
    thumbRefs.current = [];
    setLightbox({
      open: true,
      images,
      currentIndex: startIndex ?? 0,
      scale: 1,
    });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, open: false, scale: 1 }));
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setIsFullscreen(false);
  };

  const showPrevImage = (e) => {
    if (e) e.stopPropagation();
    setLightbox((prev) => {
      if (!prev.images.length) return prev;
      const total = prev.images.length;
      const nextIndex = (prev.currentIndex - 1 + total) % total;
      return { ...prev, currentIndex: nextIndex, scale: 1 };
    });
  };

  const showNextImage = (e) => {
    if (e) e.stopPropagation();
    setLightbox((prev) => {
      if (!prev.images.length) return prev;
      const total = prev.images.length;
      const nextIndex = (prev.currentIndex + 1) % total;
      return { ...prev, currentIndex: nextIndex, scale: 1 };
    });
  };

  const toggleFullscreen = async () => {
    const el = lightboxContainerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed', err);
    }
  };

  // Handle zoom
  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      setLightbox((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.1, 3) }));
    } else {
      setLightbox((prev) => ({ ...prev, scale: Math.max(prev.scale - 0.1, 1) }));
    }
  };

  // Handle write review
  const handleWriteReviewClick = () => {
    setShowReviewForm(true);
    setTimeout(() => {
      document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    // Refresh reviews
    apiService.getProductReviews(parseInt(id, 10))
      .then((data) => setReviews(data.reviews || []))
      .catch((err) => console.error('Failed to refresh reviews:', err));
  };

  // Handle helpful vote
  const handleHelpfulVote = async (reviewId, isHelpful) => {
    try {
      await apiService.voteReview(reviewId, isHelpful);
      // Refresh reviews
      const data = await apiService.getProductReviews(parseInt(id, 10));
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Product not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Product Info Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-auto object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openLightbox([{ thumb: imageUrl, full: imageUrl }], 0)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Image+unavailable';
              }}
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
                {productName}
              </h1>
              {productBrand && (
                <p className="text-lg text-gray-600">{productBrand}</p>
              )}
            </div>

            {/* Price */}
            {(product.price_min != null || product.price_max != null) && (
              <div className="text-3xl font-bold text-gray-900">
                {product.price_min != null && product.price_max != null
                  ? `$${product.price_min}`
                  : product.price_min != null
                  ? `$${product.price_min}+`
                  : product.price_max != null
                  ? `Up to $${product.price_max}`
                  : 'N/A'}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {renderStars(ratingStats.average || product.average_rating)}
              </div>
              <span className="text-lg font-semibold">
                {ratingStats.total
                  ? ratingStats.average.toFixed(1)
                  : product.average_rating?.toFixed?.(1) || 'N/A'}
              </span>
              <span className="text-gray-600">
                ({ratingStats.total || product.review_count || 0} Reviews)
              </span>
            </div>

            {/* Category */}
            {category && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700">Category:</span>
                <Badge variant="secondary">{category}</Badge>
              </div>
            )}

            {/* Description */}
            <p className="text-gray-700 leading-relaxed">{description}</p>

            {/* Write a Review Button */}
            <Button
              size="lg"
              variant="outline"
              onClick={handleWriteReviewClick}
              className="w-full max-w-md mx-auto"
            >
              Write a Review
            </Button>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Customer Reviews</h2>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Rating Distribution - Left Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Overall Rating</h3>
                <div className="space-y-3">
                  {ratingStats.distribution.map((item) => (
                    <div key={item.stars} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {renderStars(item.stars)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-yellow-400 h-full transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {Math.round(item.percentage)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews List - Right Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Review Form */}
              {showReviewForm && (
                <div id="review-form" className="bg-white rounded-2xl shadow-lg p-6">
                  <ReviewForm
                    productId={parseInt(id, 10)}
                    onSuccess={handleReviewSubmitted}
                    onCancel={() => setShowReviewForm(false)}
                    maxImages={MAX_REVIEW_IMAGES}
                  />
                </div>
              )}

              {/* Filters */}
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                    <option value="helpful">Most Helpful</option>
                  </select>

                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyWithPhotos}
                      onChange={(e) => setOnlyWithPhotos(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">With Photos Only</span>
                  </label>
                </div>
              </div>

              {/* Reviews */}
              {filteredReviews.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <p className="text-gray-600">No reviews found matching your criteria.</p>
                </div>
              ) : (
                filteredReviews.map((review) => {
                  const images = collectReviewImages(review);
                  const lightboxImages = images.map((img) => ({
                    ...img,
                    captionTitle: review.title || 'Review',
                    captionMeta: review.user?.username || 'Anonymous',
                  }));

                  const reviewerName = review.user?.username || 'Anonymous';
                  const reviewDate = review.created_at
                    ? new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '';

                  return (
                    <div key={review.id} className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-lg">
                            {reviewerName.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {reviewerName}
                                </span>
                                <div className="flex items-center">
                                  {renderStars(review.rating)}
                                </div>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {review.title || 'Review'}
                              </h3>
                            </div>
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {reviewDate}
                            </span>
                          </div>

                          <p className="text-gray-700 mb-4">{review.content}</p>

                          {/* Review Images */}
                          {images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {images.map((img, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => openLightbox(lightboxImages, index)}
                                  className="focus:outline-none"
                                >
                                  <img
                                    src={img.thumb}
                                    alt="Review"
                                    className="w-20 h-20 object-cover rounded hover:opacity-80 transition"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src =
                                        'https://via.placeholder.com/80?text=Img';
                                    }}
                                  />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Helpful Buttons */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleHelpfulVote(review.id, true)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                              >
                                Helpful
                              </button>
                              <button
                                onClick={() => handleHelpfulVote(review.id, false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                              >
                                Not Helpful
                              </button>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 transition">
                              <Flag className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {product.id && (
          <div className="mb-12">
            <RecommendationSection productId={product.id} />
          </div>
        )}

        {/* Similar Products */}
        {product.id && (
          <div className="mb-12">
            <SimilarProducts productId={product.id} />
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightbox.open && lightbox.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <div
            ref={lightboxContainerRef}
            className="relative w-full h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-30 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-16 z-30 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            >
              {isFullscreen ? (
                <Minimize2 className="w-6 h-6" />
              ) : (
                <Maximize2 className="w-6 h-6" />
              )}
            </button>

            {/* Main Image Container */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div
                className="relative max-w-full max-h-full flex items-center justify-center"
                onWheel={handleWheel}
              >
                {lightbox.images.length > 1 && (
                  <button
                    type="button"
                    onClick={showPrevImage}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center rounded-full bg-black/70 p-2 text-gray-100 hover:bg-black/90 focus:outline-none"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}

                <img
                  src={lightbox.images[lightbox.currentIndex]?.full}
                  alt={`Review image ${lightbox.currentIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                  style={{
                    transform: `scale(${lightbox.scale || 1})`,
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://via.placeholder.com/800x600?text=Image+unavailable';
                  }}
                />

                {lightbox.images.length > 1 && (
                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center rounded-full bg-black/70 p-2 text-gray-100 hover:bg-black/90 focus:outline-none"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Image Counter */}
            <div className="px-4 py-3 border-t border-white/10 text-sm text-gray-100 text-center">
              <div>
                Image {lightbox.currentIndex + 1} of {lightbox.images.length}
              </div>
              <div className="mt-2 mx-auto w-40 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white/80"
                  style={{
                    width: `${
                      ((lightbox.currentIndex + 1) / lightbox.images.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Thumbnail Strip */}
            {lightbox.images.length > 1 && (
              <div className="px-4 pb-3 pt-1 border-t border-white/10">
                <div className="flex justify-center gap-2 overflow-x-auto">
                  {lightbox.images.map((img, idx) => {
                    const isActive = idx === lightbox.currentIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        ref={(el) => (thumbRefs.current[idx] = el)}
                        onClick={() =>
                          setLightbox((prev) => ({ ...prev, currentIndex: idx, scale: 1 }))
                        }
                        className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                          isActive
                            ? 'border-white ring-2 ring-white/50'
                            : 'border-white/20 hover:border-white/50'
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      >
                        <img
                          src={img.thumb}
                          alt={`Thumbnail ${idx + 1}`}
                          className={`h-14 w-14 object-cover rounded ${
                            isActive ? 'opacity-100' : 'opacity-70'
                          }`}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              'https://via.placeholder.com/80?text=Img';
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
