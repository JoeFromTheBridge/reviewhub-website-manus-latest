// reviewhub/src/components/search/SearchResultsDisplay.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const matchProductForReview = (review, allProducts) => {
  const productId =
    review.product?.id ??
    review.product?.product_id ??
    review.product_id ??
    review.productId ??
    null;

  if (!productId) return null;

  return (
    allProducts.find((p) => p.id === productId || p.product_id === productId) ||
    null
  );
};

const SearchResultsDisplay = ({
  results,
  activeTab,
  loading,
  error,
}) => {
  const products = Array.isArray(results?.products) ? results.products : [];
  const reviews = Array.isArray(results?.reviews) ? results.reviews : [];

  if (loading) {
    return <div className="text-center py-8 text-text-secondary">Searching...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  const list = activeTab === 'products' ? products : reviews;

  if (!list || list.length === 0) {
    return (
      <p className="text-center text-text-secondary">
        No {activeTab === 'products' ? 'products' : 'reviews'} found
        matching your criteria.
      </p>
    );
  }

  const renderProductCard = (product) => {
    const name =
      product.name || product.title || product.product_name || 'Product';

    const brand =
      product.brand || product.manufacturer || product.maker || '';

    const description =
      product.description ||
      product.summary ||
      product.short_description ||
      '';

    const avgRating = Number(product.average_rating || 0);
    const reviewCount = product.review_count || 0;

    // Get price information - check multiple possible field names
    const rawPriceMin = product.price_min ?? product.price ?? product.priceMin ?? null;
    const rawPriceMax = product.price_max ?? product.priceMax ?? null;

    let priceDisplay = null;
    if (rawPriceMin !== null && rawPriceMax !== null && rawPriceMin !== rawPriceMax) {
      priceDisplay = `$${Number(rawPriceMin).toFixed(0)} - $${Number(rawPriceMax).toFixed(0)}`;
    } else if (rawPriceMin !== null) {
      priceDisplay = `$${Number(rawPriceMin).toFixed(0)}`;
    } else if (rawPriceMax !== null) {
      priceDisplay = `$${Number(rawPriceMax).toFixed(0)}`;
    }

    // Helper function to render stars with proper half-star display
    const renderStars = (rating) => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
      const hasFullFromPartial = rating % 1 >= 0.75;
      const actualFullStars = fullStars + (hasFullFromPartial ? 1 : 0);

      return [...Array(5)].map((_, i) => {
        if (i < actualFullStars) {
          // Full star
          return (
            <Star
              key={i}
              className="w-4 h-4 text-star-gold fill-star-gold"
            />
          );
        } else if (i === actualFullStars && hasHalfStar) {
          // Half star using clip-path
          return (
            <div key={i} className="relative w-4 h-4">
              {/* Background empty star */}
              <Star className="absolute inset-0 w-4 h-4 text-border-light" />
              {/* Foreground filled star clipped to half */}
              <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <Star className="w-4 h-4 text-star-gold fill-star-gold" />
              </div>
            </div>
          );
        } else {
          // Empty star
          return (
            <Star
              key={i}
              className="w-4 h-4 text-border-light"
            />
          );
        }
      });
    };

    return (
      <Card
        key={product.id}
        className="rounded-md shadow-card card-hover-lift bg-white-surface"
      >
        <CardHeader>
          <CardTitle className="text-lg">
            <Link to={`/product/${product.id}`} className="hover:text-accent-blue transition-smooth">
              {name}
            </Link>
          </CardTitle>
          {(brand || product.model) && (
            <p className="text-sm text-text-secondary">
              {brand}
              {brand && product.model ? ' — ' : ''}
              {product.model}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {description && (
            <p className="text-text-primary mb-3 line-clamp-2">{description}</p>
          )}
          {product.category && (
            <Badge variant="secondary" className="mb-2 rounded-sm bg-soft-blue text-accent-blue">{product.category}</Badge>
          )}
          {priceDisplay && (
            <p className="text-xl font-bold text-accent-blue mb-2">
              {priceDisplay}
            </p>
          )}
          <div className="flex items-center mb-2">
            <div className="flex items-center mr-2">
              {renderStars(avgRating)}
            </div>
            <span className="text-sm font-semibold text-text-primary">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-sm text-text-secondary ml-1">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          {product.image_url && (
            <img
              src={product.image_url}
              alt={name}
              className="mt-4 w-full h-32 object-cover rounded-sm"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  const renderReviewCard = (review) => {
    const matchedProduct = matchProductForReview(review, products);

    const productId =
      matchedProduct?.id ??
      review.product?.id ??
      review.product?.product_id ??
      review.product_id ??
      null;

    const productName =
      matchedProduct?.name ||
      review.product?.name ||
      review.product_name ||
      'Product';

    const userName =
      review.user?.username ||
      review.user_username ||
      review.user_name ||
      'Anonymous';

    const title =
      review.title && review.title !== 'Review'
        ? review.title
        : `Review of ${productName}`;

    const body = review.comment || review.content || '';
    const rating = Number(review.rating) || 0;
    const createdAt = review.created_at
      ? new Date(review.created_at).toLocaleDateString()
      : '';
    const isVerified = review.is_verified || review.verified_purchase;
    const hasImages = Array.isArray(review.images)
      ? review.images.length > 0
      : !!review.has_images;

    return (
      <Card
        key={review.id}
        className="rounded-md shadow-card card-hover-lift bg-white-surface"
      >
        <CardHeader>
          <CardTitle className="text-lg">
            {productId ? (
              <Link to={`/product/${productId}`} className="hover:text-accent-blue transition-smooth">
                {title}
              </Link>
            ) : (
              <span>{title}</span>
            )}
          </CardTitle>
          <p className="text-sm text-text-secondary">
            By {userName}
            {createdAt && ` on ${createdAt}`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(rating)
                    ? 'text-star-gold fill-star-gold'
                    : 'text-border-light'
                }`}
              />
            ))}
            {isVerified && (
              <Badge variant="outline" className="ml-2 text-xs rounded-sm">
                Verified Purchase
              </Badge>
            )}
          </div>
          {body && (
            <p className="text-text-primary mb-2 line-clamp-3">{body}</p>
          )}
          {hasImages && <Badge variant="outline" className="rounded-sm">Has Images</Badge>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeTab === 'products' &&
        products.map((product) => renderProductCard(product))}
      {activeTab === 'reviews' &&
        reviews.map((review) => renderReviewCard(review))}
    </div>
  );
};

export default SearchResultsDisplay;
