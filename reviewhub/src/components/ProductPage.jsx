Add “reviews with photos” filter + photo count in summary

```jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
    image.thumbnail_url ||
    image.url ||
    image.image_url ||
    image.file_url ||
    image.file_path ||
    image.path ||
    image.location ||
    image.src ||
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
    image.main_url ||
      image.full_url ||
      image.url ||
      image.image_url ||
      image.file_url ||
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
  const numericId = id ? parseInt(id, 10) : null;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState('helpful');
  const [filterRating, setFilterRating] = useState('all');
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

    // Prefer images that came back specifically for this submission.
    // Fall back to any image arrays on the review object if needed.
    const existingImages = [
      ...(Array.isArray(baseReview.images) ? baseReview.images : []),
      ...(Array.isArray(baseReview.review_images)
        ? baseReview.review_images
        : []),
    ];

    // Combine recent upload + any existing, but enforce a hard cap of MAX_REVIEW_IMAGES
    const mergedImagesRaw = [...uploadedImages, ...existingImages];
    let mergedImages = mergedImagesRaw.slice(0, MAX_REVIEW_IMAGES);

    if (
      mergedImagesRaw.length > MAX_REVIEW_IMAGES &&
      typeof window !== 'undefined'
    ) {
      window.alert(
        `You can upload a maximum of ${MAX_REVIEW_IMAGES} photos per review. Only the first ${MAX_REVIEW_IMAGES} were kept.`
      );
    }

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

    for (const r of reviews) {
      const rating = Number(r.rating) || 0;
      if (rating >= 1 && rating <= 5) {
        counts[rating] += 1;
        sum += rating;
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

    const photoCount = reviews.filter(
      (r) => collectReviewImages(r).length > 0
    ).length;

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
      result = result.filter(
        (r) => collectReviewImages(r).length > 0
      );
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
    }

    return result;
  }, [reviews, sortBy, filterRating, onlyWithPhotos]);

  const renderStars = (rating) => {
    const value = Number(rating) || 0;
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(value)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-center text-gray-600">Loading product details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-center text-gray-600">Product not found.</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Product Header */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <div>
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-96 object-cover rounded-lg shadow-lg"
          />
        </div>

        <div>
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {productName}
            </h1>
            {productBrand && (
              <p className="text-lg text-gray-600">{productBrand}</p>
            )}
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              {renderStars(ratingStats.average || product.average_rating)}
              <span className="text-lg font-semibold ml-2">
                {ratingStats.total
                  ? ratingStats.average.toFixed(1)
                  : product.average_rating?.toFixed?.(1) || 'N/A'}
              </span>
            </div>
            <span className="text-gray-600">
              ({ratingStats.total || product.review_count || 0} reviews)
            </span>
          </div>

          {ratingStats.photoCount > 0 && (
            <div className="mb-4 text-sm text-gray-700">
              {ratingStats.photoCount} review
              {ratingStats.photoCount === 1 ? '' : 's'} include photos.
            </div>
          )}

          {specs && Array.isArray(specs) && specs.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Specifications
              </h3>
              <ul className="space-y-2">
                {specs.map((spec, index) => (
                  <li key={index} className="text-gray-700">
                    • {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700">{description}</p>
          </div>

          {product.price_min != null || product.price_max != null ? (
            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-900">
                Price Range{' '}
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

          <div className="flex space-x-4">
            <Button size="lg" className="flex-1">
              Compare Prices
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleWriteReviewClick}
            >
              Write Review
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div
        id="reviews-section"
        className="grid lg:grid-cols-3 gap-8"
      >
        {/* Rating Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {ratingStats.total
                    ? ratingStats.average.toFixed(1)
                    : product.average_rating?.toFixed?.(1) || 'N/A'}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(ratingStats.average || product.average_rating)}
                </div>
                <p className="text-gray-600">
                  {ratingStats.total || product.review_count || 0} total reviews
                </p>
                {ratingStats.photoCount > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    {ratingStats.photoCount} review
                    {ratingStats.photoCount === 1 ? '' : 's'} with photos
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {ratingStats.distribution.map((item) => (
                  <div key={item.stars} className="flex items-center space-x-3">
                    <span className="text-sm w-6">{item.stars}★</span>
                    <Progress value={item.percentage} className="flex-1" />
                    <span className="text-sm text-gray-600 w-12">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="helpful">Most Helpful</option>
                <option value="recent">Most Recent</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Rating:</span>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="only-with-photos"
                type="checkbox"
                checked={onlyWithPhotos}
                onChange={(e) => setOnlyWithPhotos(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="only-with-photos"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Only reviews with photos
              </label>
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="space-y-6">
            {filteredAndSortedReviews.length === 0 ? (
              <p className="text-gray-600">
                There are no reviews for this product yet.
              </p>
            ) : (
              filteredAndSortedReviews.map((review) => {
                const isVerified =
                  review.verified_purchase || review.is_verified;
                const helpful = review.helpful_count || 0;
                const createdAt = review.created_at
                  ? new Date(review.created_at).toLocaleDateString()
                  : '';

                const images = collectReviewImages(review);

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
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold">
                              {reviewerName}
                            </span>
                            {isVerified && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            {createdAt && (
                              <span className="text-sm text-gray-600">
                                {createdAt}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-2">
                        {review.title || 'Review'}
                      </h4>
                      <p className="text-gray-700 mb-4">
                        {review.content || review.comment}
                      </p>

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
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Helpful ({helpful})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600"
                        >
                          Reply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline">Load More Reviews</Button>
          </div>
        </div>
      </div>

      {/* Visual Similar Products Section */}
      {numericId && (
        <div className="mt-16">
          <SimilarProducts productId={numericId} />
        </div>
      )}

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
              className="relative bg-black rounded-lg shadow-lg overflow-hidden flex flex-col"
              style={{ height: isFullscreen ? '94vh' : '80vh' }}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute top-3 right-3 z-20 inline-flex items-center justify-center rounded-full bg-black/70 p-1.5 text-gray-100 hover:bg-black/90 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Fullscreen toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="absolute top-3 right-12 z-20 inline-flex items-center justify-center rounded-full bg-black/70 p-1.5 text-gray-100 hover:bg-black/90 focus:outline-none"
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
                />

                {lightbox.images.length > 1 && (
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center rounded-full bg-black/70 p-2 text-gray-100 hover:bg-black/90 focus:outline-none"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Fixed bottom info area: index + progress + captions */}
              <div className="px-4 py-3 border-t border-white/10 text-sm text-gray-100 text-center">
                <div>
                  Image {lightbox.currentIndex + 1} of {lightbox.images.length}
                </div>
                <div className="mt-2 mx-auto w-40 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white/80"
                    style={{
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
                <div className="px-4 pb-3 pt-1 border-t border-white/10">
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
                          className={`border rounded ${
                            isActive
                              ? 'border-white/80'
                              : 'border-white/20 hover:border-white/50'
                          }`}
                        >
                          <img
                            src={img.thumb}
                            alt={`Thumbnail ${idx + 1}`}
                            className={`h-14 w-14 object-cover rounded ${
                              isActive ? 'opacity-100' : 'opacity-70'
                            }`}
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
  );
}

export default ProductPage;
```
