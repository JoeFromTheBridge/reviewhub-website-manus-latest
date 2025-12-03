// reviewhub/src/components/ProductPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Star, ThumbsUp, Shield, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import RecommendationSection from './recommendations/RecommendationSection';
import SimilarProducts from './search/SimilarProducts';
import { ReviewForm } from './reviews/ReviewForm';
import apiService from '../services/api';

export function ProductPage() {
  const { id } = useParams();
  const numericId = id ? parseInt(id, 10) : null;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState('helpful');
  const [filterRating, setFilterRating] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Track product view interaction
  useEffect(() => {
    if (numericId) {
      apiService.trackInteraction?.(numericId, 'view').catch?.(console.error);
    }
  }, [numericId]);

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

        // Some backends wrap the product in { product: {...} }
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

    const uploadedImages = result.uploadedImages || [];
    const finalReview = {
      ...baseReview,
      images: uploadedImages?.length
        ? [...(baseReview.images || []), ...uploadedImages]
        : baseReview.images,
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

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];

    if (filterRating !== 'all') {
      const target = parseInt(filterRating, 10);
      result = result.filter((r) => Number(r.rating) === target);
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
  }, [reviews, sortBy, filterRating]);

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

    const total = counts[1] + counts[2] + counts[3] + counts[4] + counts[5];
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
    };
  }, [reviews]);

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

  // Helper to normalize review image URLs
  const getReviewImageUrl = (image) => {
    if (!image) return '';

    // If backend gives a plain string
    if (typeof image === 'string') {
      const trimmed = image.trim();
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
        return trimmed;
      }
      // relative path like "uploads/xyz.jpg"
      return `/${trimmed.replace(/^\/+/, '')}`;
    }

    // If backend gives an object
    const candidate =
      image.url ||
      image.image_url ||
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
                Price Range:{' '}
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
          {/* Review Form (for logged-in users) */}
          {showReviewForm && (
            <div className="mb-8">
              <ReviewForm
                productId={numericId}
                onReviewSubmitted={handleReviewSubmitted}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
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

                const images =
                  Array.isArray(review.images) && review.images.length > 0
                    ? review.images
                    : [];

                return (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold">
                              {review.user?.username ||
                                review.user_username ||
                                review.user_name ||
                                'Anonymous'}
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
                        <div className="flex space-x-2 mb-4">
                          {images.map((image, index) => {
                            const url = getReviewImageUrl(image);
                            if (!url) return null;
                            return (
                              <img
                                key={index}
                                src={url}
                                alt="Review"
                                className="w-20 h-20 object-cover rounded"
                              />
                            );
                          })}
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
            {/* Placeholder for pagination in future */}
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
    </div>
  );
}

export default ProductPage;
