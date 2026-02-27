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
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RecommendationSection from './recommendations/RecommendationSection';
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
  const numericId = id ? parseInt(id, 10) : null;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState('helpful'); // helpful | recent | rating | photos
  const [filterRating, setFilterRating] = useState('all'); // all | 1-5
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Lightbox state: images for a single review + current index + zoom
  const [lightbox, setLightbox] = useState({
    open: false,
    images: [],
    currentIndex: 0,
    scale: 1,
  });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Touch tracking for swipe + pinch
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const pinchStartDistance = useRef(null);
  const pinchStartScale = useRef(1);

  // Thumbnail refs for smooth scrolling of active thumb
  const thumbRefs = useRef([]);

  // Lightbox container ref for Fullscreen API
  const lightboxContainerRef = useRef(null);

  // Initialize sort/filter from URL query params (once)
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const sortParam = params.get('sort');
    const ratingParam = params.get('rating');
    const photosParam = params.get('photos');

    if (sortParam && ['helpful', 'recent', 'rating', 'photos'].includes(sortParam)) {
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

  // Track product view interaction
  useEffect(() => {
    if (numericId) {
      apiService.trackInteraction?.(numericId, 'view').catch?.(console.error);
    }
  }, [numericId]);

  // Disable background scroll while lightbox is open
  useEffect(() => {
    if (!lightbox.open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [lightbox.open]);

  // Keyboard navigation: Escape to close, Left/Right arrows to navigate
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

  // Sync fullscreen state with browser's fullscreenchange event
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

  // Smooth scroll active thumbnail into view when image changes
  useEffect(() => {
    if (!lightbox.open) return;
    const el = thumbRefs.current[lightbox.currentIndex];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [lightbox.open, lightbox.currentIndex]);

  // Fetch product + reviews from real API
  useEffect(() => {
    if (!numericId) {
      setProduct(null);
      setReviews([]);
      setLoading(false);
      setError('Invalid product id.');
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [productDataRaw, reviewsResponse] = await Promise.all([
          apiService.getProduct(numericId),
          apiService.getReviews({
            product_id: numericId,
            sort: 'created_at',
            order: 'desc',
            limit: 50,
          }),
        ]);

        if (!isMounted) return;

        const productData = productDataRaw?.product || productDataRaw || null;

        setProduct(productData);
        setReviews(reviewsResponse?.reviews || []);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load product page data', err);
        setError('Failed to load product details.');
        setProduct(null);
        setReviews([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [numericId]);

  const handleReviewSubmitted = (result) => {
    if (!result) return;

    const baseReview = result.review || result;
    if (!baseReview) return;

    const uploadedImages = Array.isArray(result.uploadedImages)
      ? result.uploadedImages
      : [];

    const existingImages = [
      ...(Array.isArray(baseReview.images) ? baseReview.images : []),
      ...(Array.isArray(baseReview.review_images)
        ? baseReview.review_images
        : []),
    ];

    // Merge what the backend returned with any explicitly uploaded images,
    // but do not show any alert here; enforcement happens in the form/upload UI.
    const mergedImages = [...existingImages, ...uploadedImages];

    const finalReview = {
      ...baseReview,
      images: mergedImages,
    };

    setReviews((prev) => [finalReview, ...(prev || [])]);
    setShowReviewForm(false);
  };

  const handleWriteReviewClick = () => {
    setShowReviewForm(true);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('reviews-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Lightbox helpers
  const openLightbox = (images, startIndex) => {
    if (!images || images.length === 0) return;
    thumbRefs.current = [];
    setLightbox({
      open: true,
      images,
      currentIndex: startIndex ?? 0,
      scale: 1,
    });
    setIsFullscreen(false);
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

  // Swipe + pinch handlers
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;

    if (e.touches.length === 1) {
      // Single finger swipe
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    } else if (e.touches.length === 2) {
      // Two-finger pinch
      const [t1, t2] = e.touches;
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      pinchStartDistance.current = Math.hypot(dx, dy);
      pinchStartScale.current = lightbox.scale || 1;
    }
  };

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;

    if (e.touches.length === 1 && pinchStartDistance.current == null) {
      // Only track swipe when not pinching
      touchEndX.current = e.touches[0].clientX;
    } else if (e.touches.length === 2 && pinchStartDistance.current != null) {
      const [t1, t2] = e.touches;
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const distance = Math.hypot(dx, dy);
      if (!distance) return;

      const ratio = distance / pinchStartDistance.current;
      const newScale = Math.min(3, Math.max(1, pinchStartScale.current * ratio));

      setLightbox((prev) => ({
        ...prev,
        scale: newScale,
      }));
    }
  };

  const handleTouchEnd = () => {
    // If pinch ended, reset pinch refs
    if (pinchStartDistance.current != null) {
      pinchStartDistance.current = null;
      pinchStartScale.current = 1;
    }

    // Handle swipe if we had a single-finger gesture
    if (touchStartX.current != null && touchEndX.current != null) {
      const delta = touchStartX.current - touchEndX.current;
      const SWIPE_THRESHOLD = 50;
      if (Math.abs(delta) > SWIPE_THRESHOLD) {
        if (delta > 0) {
          // swipe left → next image
          showNextImage();
        } else {
          // swipe right → previous image
          showPrevImage();
        }
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Mouse/trackpad wheel: scroll through images instead of page
  const handleWheel = (e) => {
    if (!lightbox.open) return;
    e.preventDefault();
    e.stopPropagation();

    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

    if (delta > 0) {
      showNextImage();
    } else if (delta < 0) {
      showPrevImage();
    }
  };

  const ratingStats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: [5, 4, 3, 2, 1].map((stars) => ({
          stars,
          count: 0,
          percentage: 0,
        })),
        photoCount: 0,
      };
    }

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    let photoCount = 0;

    for (const r of reviews) {
      const rating = Number(r.rating) || 0;
      if (rating >= 1 && rating <= 5) {
        counts[rating] += 1;
        sum += rating;
      }
      if (collectReviewImages(r).length > 0) {
        photoCount += 1;
      }
    }

    const total =
      counts[1] + counts[2] + counts[3] + counts[4] + counts[5];
    const average = total ? sum / total : 0;

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = counts[stars];
      const percentage = total ? Math.round((count / total) * 100) : 0;
      return { stars, count, percentage };
    });

    return {
      average,
      total,
      distribution,
      photoCount,
    };
  }, [reviews]);

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];

    if (filterRating !== 'all') {
      const target = parseInt(filterRating, 10);
      result = result.filter((r) => Number(r.rating) === target);
    }

    if (onlyWithPhotos) {
      result = result.filter((r) => collectReviewImages(r).length > 0);
    }

    if (sortBy === 'recent') {
      result.sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
    } else if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === 'helpful') {
      result.sort(
        (a, b) =>
          Number(b.helpful_count || 0) - Number(a.helpful_count || 0),
      );
    } else if (sortBy === 'photos') {
      result.sort(
        (a, b) =>
          collectReviewImages(b).length - collectReviewImages(a).length
      );
    }

    return result;
  }, [reviews, sortBy, filterRating, onlyWithPhotos]);

  // Improved star rendering with proper half-star support (matches SearchResults)
  const renderStars = (rating) => {
    const value = Number(rating) || 0;
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.25 && value % 1 < 0.75;
    const hasFullFromPartial = value % 1 >= 0.75;
    const actualFullStars = fullStars + (hasFullFromPartial ? 1 : 0);

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
            );
          } else if (i === actualFullStars && hasHalfStar) {
            // Half star
            return (
              <div key={i} className="relative w-4 h-4">
                <Star className="absolute inset-0 h-4 w-4 text-border-light" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="h-4 w-4 text-star-gold fill-star-gold" />
                </div>
              </div>
            );
          } else {
            // Empty star
            return (
              <Star
                key={i}
                className="h-4 w-4 text-border-light"
              />
            );
          }
        })}
      </div>
    );
  };

  const hasActiveFilters =
    filterRating !== 'all' || onlyWithPhotos || sortBy !== 'helpful';

  const clearFilters = () => {
    setSortBy('helpful');
    setFilterRating('all');
    setOnlyWithPhotos(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
            <span className="ml-2 text-text-secondary">Loading product details…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-16 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen py-16 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-text-secondary">Product not found.</p>
        </div>
      </div>
    );
  }

  const productName =
    product.name ||
    product.title ||
    product.product_name ||
    product.productTitle ||
    'Product';

  const productBrand =
    product.brand ||
    product.manufacturer ||
    product.maker ||
    '';

  const imageUrl =
    product.image_url ||
    product.image ||
    product.hero_image_url ||
    product.main_image_url ||
    'https://via.placeholder.com/800x400?text=No+image+available';

  let specs = [];
  if (Array.isArray(product.specifications)) {
    specs = product.specifications;
  } else if (typeof product.specifications === 'string') {
    specs = product.specifications.split('\n').filter(Boolean);
  } else if (Array.isArray(product.specs)) {
    specs = product.specs;
  }

  const description =
    product.description ||
    product.summary ||
    product.short_description ||
    'No detailed description has been provided for this product yet.';

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-8">
        {/* Product Header Card */}
        <div className="mb-8 lg:mb-12 p-4 md:p-6 lg:p-8 bg-white-surface rounded-md shadow-card">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <img
                src={imageUrl}
                alt={productName}
                className="w-full object-cover rounded-md h-[clamp(200px,40vh,384px)]"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://via.placeholder.com/800x400?text=Image+unavailable';
                }}
              />
            </div>

            <div>
              <div className="mb-3 lg:mb-4">
                <h1 className="font-bold mb-1 lg:mb-2 text-text-primary text-2xl sm:text-3xl">
                  {productName}
                </h1>
                {productBrand && (
                  <p className="text-base lg:text-lg text-text-secondary">
                    {productBrand}
                  </p>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-2 lg:space-x-4 mb-4 lg:mb-6">
                <div className="flex items-center space-x-1">
                  {renderStars(ratingStats.average || product.average_rating)}
                  <span className="text-lg font-semibold ml-2 text-text-primary">
                    {ratingStats.total
                      ? ratingStats.average.toFixed(1)
                      : product.average_rating?.toFixed?.(1) || 'N/A'}
                  </span>
                </div>
                <span className="text-text-secondary">
                  ({ratingStats.total || product.review_count || 0} reviews)
                </span>
              </div>

              {ratingStats.photoCount > 0 && (
                <div className="mb-4 text-sm text-text-secondary">
                  {ratingStats.photoCount} review
                  {ratingStats.photoCount === 1 ? '' : 's'} include photos.
                </div>
              )}

              {specs && Array.isArray(specs) && specs.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-text-primary">
                    Specifications
                  </h3>
                  <ul className="space-y-2">
                    {specs.map((spec, index) => (
                      <li key={index} className="text-text-secondary">
                        • {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-6">
                <p className="text-text-secondary">{description}</p>
              </div>

              {product.price_min != null || product.price_max != null ? (
                <div className="mb-6">
                  <p className="text-xl font-bold text-accent-blue">
                    {product.price_min != null && product.price_max != null
                      ? `$${product.price_min} - $${product.price_max}`
                      : product.price_min != null
                      ? `$${product.price_min}+`
                      : product.price_max != null
                      ? `Up to $${product.price_max}`
                      : 'N/A'}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] text-white hover:opacity-90 transition-opacity min-h-[44px] rounded-sm"
                  onClick={handleWriteReviewClick}
                >
                  Write Review
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] rounded-sm border-border-light text-gray-700"
                >
                  Compare Prices
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div
          id="reviews-section"
          className="grid lg:grid-cols-3 gap-4 lg:gap-8"
        >
          {/* Rating Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white-surface rounded-md shadow-card">
              <div className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold mb-4 text-text-primary">
                  Customer Reviews
                </h3>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold mb-2 text-text-primary">
                    {ratingStats.total
                      ? ratingStats.average.toFixed(1)
                      : product.average_rating?.toFixed?.(1) || 'N/A'}
                  </div>
                  <div className="flex justify-center mb-2">
                    {renderStars(ratingStats.average || product.average_rating)}
                  </div>
                  <p className="text-text-secondary">
                    {ratingStats.total || product.review_count || 0} total reviews
                  </p>
                  {ratingStats.photoCount > 0 && (
                    <p className="mt-1 text-xs text-text-secondary">
                      {ratingStats.photoCount} review
                      {ratingStats.photoCount === 1 ? '' : 's'} with photos
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  {ratingStats.distribution.map((item) => (
                    <div key={item.stars} className="flex items-center gap-2">
                      {/* Star label: number + icon, fixed width for alignment */}
                      <div className="flex items-center gap-0.5 w-10 flex-shrink-0">
                        <span className="text-sm font-medium text-text-primary tabular-nums leading-none">
                          {item.stars}
                        </span>
                        <Star className="h-3 w-3 text-star-gold fill-star-gold flex-shrink-0" />
                      </div>
                      {/* Progress bar */}
                      <div
                        className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"
                        aria-label={`${item.count} review${item.count !== 1 ? 's' : ''} with ${item.stars} star${item.stars !== 1 ? 's' : ''} (${item.percentage}%)`}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${item.count > 0 ? Math.max(item.percentage, 3) : 0}%` }}
                        />
                      </div>
                      {/* Count */}
                      <span className="text-sm font-medium text-text-secondary w-8 text-right tabular-nums flex-shrink-0">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List + Form */}
          <div className="lg:col-span-2">
            {/* Review Form */}
            {showReviewForm && (
              <div className="mb-8">
                <ReviewForm
                  productId={numericId}
                  onReviewSubmitted={handleReviewSubmitted}
                  onCancel={() => setShowReviewForm(false)}
                  maxImages={MAX_REVIEW_IMAGES}
                />
              </div>
            )}

            {/* Filters Panel */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 items-start sm:items-center p-3 sm:p-4 bg-white-surface rounded-md shadow-input border border-border-light">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                <span className="text-sm font-medium flex-shrink-0 text-gray-700">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 text-sm min-h-[40px] border border-border-light rounded-sm text-gray-700 bg-white-surface focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20 focus:outline-none transition-smooth"
                >
                  <option value="helpful">Most Helpful</option>
                  <option value="recent">Most Recent</option>
                  <option value="rating">Highest Rating</option>
                  <option value="photos">Most Photos</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-medium flex-shrink-0 text-gray-700">
                  Rating:
                </span>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 text-sm min-h-[40px] border border-border-light rounded-sm text-gray-700 bg-white-surface focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20 focus:outline-none transition-smooth"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer min-h-[40px] py-1 sm:py-0">
                <input
                  id="only-with-photos"
                  type="checkbox"
                  checked={onlyWithPhotos}
                  onChange={(e) => setOnlyWithPhotos(e.target.checked)}
                  className="h-5 w-5 rounded border-border-light text-accent-blue focus:ring-accent-blue"
                />
                <span className="text-sm text-text-secondary">
                  With photos only
                </span>
              </label>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              {filteredAndSortedReviews.length === 0 ? (
                <div className="p-6 bg-white-surface rounded-md shadow-card text-text-secondary">
                  {reviews.length === 0 ? (
                    <p>There are no reviews for this product yet.</p>
                  ) : hasActiveFilters ? (
                    <div className="space-y-2">
                      <p>No reviews match these filters.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="rounded-sm border-border-light text-gray-700"
                      >
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <p>No reviews to display.</p>
                  )}
                </div>
              ) : (
                filteredAndSortedReviews.map((review) => {
                  const isVerified =
                    review.verified_purchase || review.is_verified;
                  const helpful = review.helpful_count || 0;
                  const createdAt = review.created_at
                    ? new Date(review.created_at).toLocaleDateString()
                    : '';

                  const images = collectReviewImages(review);
                  const hasImages = images.length > 0;

                  const reviewerName =
                    review.user?.username ||
                    review.user_username ||
                    review.user_name ||
                    'Anonymous';

                  const lightboxImages = images.map((img) => ({
                    ...img,
                    captionTitle: review.title || 'Review',
                    captionMeta: createdAt
                      ? `${reviewerName} • ${createdAt}`
                      : reviewerName,
                  }));

                  return (
                    <div
                      key={review.id}
                      className="p-4 sm:p-6 bg-white-surface rounded-md shadow-card card-hover-lift"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-text-primary">
                              {reviewerName}
                            </span>
                            {isVerified && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-50 text-green-700 rounded-sm"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.rating)}
                            {createdAt && (
                              <span className="text-sm text-text-secondary">
                                {createdAt}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-text-primary">
                          {review.title || 'Review'}
                        </h4>
                        {hasImages && (
                          <Badge
                            variant="outline"
                            className="text-xs border-accent-blue text-accent-blue rounded-sm"
                          >
                            Includes photos
                          </Badge>
                        )}
                      </div>

                      <p className="mb-4 text-text-secondary">
                        {review.content || review.comment}
                      </p>

                      {hasImages && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {images.map((img, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() =>
                                openLightbox(lightboxImages, index)
                              }
                              className="focus:outline-none transition-opacity"
                            >
                              <img
                                src={img.thumb}
                                alt="Review"
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-sm hover:opacity-80 transition"
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

                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-text-secondary rounded-sm"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Helpful ({helpful})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-text-secondary rounded-sm"
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-center mt-8">
              <Button className="bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] text-white hover:opacity-90 transition-opacity px-8 rounded-sm">
                Load More Reviews
              </Button>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {numericId && (
          <div className="mt-16">
            <RecommendationSection
              title="Similar Products"
              type="similar"
              productId={numericId}
              limit={6}
              showReasons={false}
            />
          </div>
        )}

        {/* Lightbox Modal */}
        {lightbox.open && lightbox.images.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={closeLightbox}
          >
            <div
              ref={lightboxContainerRef}
              className="relative w-full max-w-5xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative overflow-hidden flex flex-col"
                style={{
                  background: '#000000',
                  borderRadius: '16px',
                  height: isFullscreen ? '94vh' : '80vh',
                }}
              >
                {/* Close button */}
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label="Close image viewer"
                  className="absolute top-3 right-3 z-20 inline-flex items-center justify-center p-1.5 text-gray-100 hover:bg-black/90 focus:outline-none"
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '50%',
                  }}
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Fullscreen toggle */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
                  className="absolute top-3 right-12 z-20 inline-flex items-center justify-center p-1.5 text-gray-100 hover:bg-black/90 focus:outline-none"
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '50%',
                  }}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>

                {/* Fixed-height image area; arrows stay centered; wheel scrolls images */}
                <div
                  className={`relative flex items-center justify-center ${
                    isFullscreen ? 'h-[78vh]' : 'h-[60vh]'
                  }`}
                  style={{ touchAction: 'none' }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                >
                  {lightbox.images.length > 1 && (
                    <button
                      type="button"
                      onClick={showPrevImage}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center p-2 text-gray-100 hover:bg-black/90 focus:outline-none"
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '50%',
                      }}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center p-2 text-gray-100 hover:bg-black/90 focus:outline-none"
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '50%',
                      }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Fixed bottom info area: index + progress + captions */}
                <div
                  className="px-4 py-3 text-sm text-gray-100 text-center"
                  style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  <div>
                    Image {lightbox.currentIndex + 1} of {lightbox.images.length}
                  </div>
                  <div
                    className="mt-2 mx-auto w-40 h-1.5 overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      className="h-full"
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        width: `${
                          ((lightbox.currentIndex + 1) /
                            lightbox.images.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  {(() => {
                    const current = lightbox.images[lightbox.currentIndex] || {};
                    return (
                      <>
                        {current.captionTitle && (
                          <div className="mt-2 font-medium">
                            {current.captionTitle}
                          </div>
                        )}
                        {current.captionMeta && (
                          <div className="mt-0.5 text-xs text-gray-300">
                            {current.captionMeta}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Thumbnail strip pinned at very bottom */}
                {lightbox.images.length > 1 && (
                  <div
                    className="px-4 pb-3 pt-1"
                    style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
                  >
                    <div className="flex justify-center gap-2 overflow-x-auto">
                      {lightbox.images.map((img, idx) => {
                        const isActive = idx === lightbox.currentIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            ref={(el) => {
                              thumbRefs.current[idx] = el;
                            }}
                            onClick={() =>
                              setLightbox((prev) => ({
                                ...prev,
                                currentIndex: idx,
                                scale: 1,
                              }))
                            }
                            style={{
                              border: isActive
                                ? '2px solid rgba(255, 255, 255, 0.8)'
                                : '2px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '8px',
                            }}
                            aria-label={`Go to image ${idx + 1}`}
                          >
                            <img
                              src={img.thumb}
                              alt={`Thumbnail ${idx + 1}`}
                              className={`h-14 w-14 object-cover ${
                                isActive ? 'opacity-100' : 'opacity-70'
                              }`}
                              style={{ borderRadius: '6px' }}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductPage;
