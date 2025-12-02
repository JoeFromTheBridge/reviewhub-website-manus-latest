// reviewhub/src/components/search/SearchResultsDisplay.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const normalize = (value) =>
  (value || '').toString().toLowerCase();

const matchProductForReview = (review, products) => {
  const productId =
    review.product?.id ??
    review.product?.product_id ??
    review.product_id ??
    review.productId ??
    null;

  if (!productId) return null;

  return (
    products.find(
      (p) => p.id === productId || p.product_id === productId
    ) || null
  );
};

const SearchResultsDisplay = ({
  results,
  activeTab,
  loading,
  error,
  searchType, // currently not used for filtering, reserved for future
  searchQuery = '',
  filters = {},
}) => {
  const products = Array.isArray(results?.products)
    ? results.products
    : [];
  const reviews = Array.isArray(results?.reviews)
    ? results.reviews
    : [];

  const q = normalize(searchQuery);

  const categoryFilter = normalize(
    filters.category_name ||
      filters.category ||
      filters.category_slug ||
      ''
  );
  const categoryIdFilter =
    filters.category_id || filters.categoryId || null;

  const productMatchesCategory = (product) => {
    if (!categoryFilter && !categoryIdFilter) return true;

    let passes = false;

    const pCat = normalize(
      product.category ||
        product.category_name ||
        product.category_slug ||
        ''
    );
    if (categoryFilter && pCat && pCat.includes(categoryFilter)) {
      passes = true;
    }

    const pCatId = product.category_id || product.categoryId;
    if (
      categoryIdFilter &&
      pCatId &&
      String(pCatId) === String(categoryIdFilter)
    ) {
      passes = true;
    }

    return passes;
  };

  const productMatchesQuery = (product) => {
    if (!q) return true;

    const text = normalize(
      (product.name ||
        product.title ||
        product.product_name ||
        '') +
        ' ' +
        (product.brand ||
          product.manufacturer ||
          '') +
        ' ' +
        (product.description ||
          product.summary ||
          product.short_description ||
          '')
    );

    return text.includes(q);
  };

  const filteredProducts = products.filter(
    (p) => productMatchesCategory(p) && productMatchesQuery(p)
  );

  const reviewMatchesFilters = (review) => {
    const matchedProduct = matchProductForReview(
      review,
      products
    );

    // Category filtering
    if (categoryFilter || categoryIdFilter) {
      let passesCategory = false;

      if (matchedProduct) {
        if (productMatchesCategory(matchedProduct)) {
          passesCategory = true;
        }
      }

      const rCat = normalize(
        review.category ||
          review.category_name ||
          review.category_slug ||
          ''
      );
      if (!passesCategory && categoryFilter && rCat) {
        if (rCat.includes(categoryFilter)) passesCategory = true;
      }

      const rCatId = review.category_id || review.categoryId;
      if (
        !passesCategory &&
        categoryIdFilter &&
        rCatId &&
        String(rCatId) === String(categoryIdFilter)
      ) {
        passesCategory = true;
      }

      if (!passesCategory) return false;
    }

    // Text query filtering
    if (q) {
      const productName =
        matchedProduct?.name ||
        matchedProduct?.title ||
        matchedProduct?.product_name ||
        review.product?.name ||
        review.product?.product_name ||
        review.product_name ||
        '';

      const productBrand =
        matchedProduct?.brand ||
        matchedProduct?.manufacturer ||
        review.product?.brand ||
        review.product?.manufacturer ||
        '';

      const textToSearch = normalize(
        productName +
          ' ' +
          productBrand +
          ' ' +
          (review.title || '') +
          ' ' +
          (review.comment || review.content || '')
      );

      if (!textToSearch.includes(q)) return false;
    }

    return true;
  };

  const filteredReviews = reviews.filter(reviewMatchesFilters);

  const list =
    activeTab === 'products' ? filteredProducts : filteredReviews;

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">
        Searching...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  if (!list || list.length === 0) {
    return (
      <p className="text-center text-gray-500">
        No {activeTab === 'products' ? 'products' : 'reviews'} found
        matching your criteria.
      </p>
    );
  }

  const renderProductCard = (product) => {
    const name =
      product.name ||
      product.title ||
      product.product_name ||
      'Product';

    const brand =
      product.brand ||
      product.manufacturer ||
      product.maker ||
      '';

    const description =
      product.description ||
      product.summary ||
      product.short_description ||
      '';

    const avgRating = Number(product.average_rating || 0);
    const reviewCount = product.review_count || 0;

    return (
      <Card
        key={product.id}
        className="hover:shadow-lg transition-shadow duration-200"
      >
        <CardHeader>
          <CardTitle className="text-lg">
            <Link
              to={`/product/${product.id}`}
              className="hover:text-primary"
            >
              {name}
            </Link>
          </CardTitle>
          {(brand || product.model) && (
            <p className="text-sm text-gray-500">
              {brand}
              {brand && product.model ? ' — ' : ''}
              {product.model}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {description && (
            <p className="text-gray-700 mb-2 line-clamp-2">
              {description}
            </p>
          )}
          {avgRating > 0 && (
            <div className="flex items-center mb-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
              <span className="text-sm font-semibold">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                ({reviewCount} reviews)
              </span>
            </div>
          )}
          {product.category && (
            <Badge variant="secondary">{product.category}</Badge>
          )}
          {product.image_url && (
            <img
              src={product.image_url}
              alt={name}
              className="mt-4 w-full h-32 object-cover rounded-md"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  const renderReviewCard = (review) => {
    const productFromList = matchProductForReview(review, products);

    const productId =
      review.product?.id ??
      review.product?.product_id ??
      review.product_id ??
      review.productId ??
      productFromList?.id ??
      null;

    const productName =
      productFromList?.name ||
      productFromList?.title ||
      productFromList?.product_name ||
      review.product?.name ||
      review.product?.product_name ||
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

    const isVerified =
      review.is_verified || review.verified_purchase;

    const hasImages = Array.isArray(review.images)
      ? review.images.length > 0
      : !!review.has_images;

    return (
      <Card
        key={review.id}
        className="hover:shadow-lg transition-shadow duration-200"
      >
        <CardHeader>
          <CardTitle className="text-lg">
            {productId ? (
              <Link
                to={`/product/${productId}`}
                className="hover:text-primary"
              >
                {title}
              </Link>
            ) : (
              <span>{title}</span>
            )}
          </CardTitle>
          <p className="text-sm text-gray-500">
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
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            {isVerified && (
              <Badge variant="outline" className="ml-2 text-xs">
                Verified Purchase
              </Badge>
            )}
          </div>
          {body && (
            <p className="text-gray-700 mb-2 line-clamp-3">
              {body}
            </p>
          )}
          {hasImages && (
            <Badge variant="outline">Has Images</Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeTab === 'products' &&
        filteredProducts.map(renderProductCard)}
      {activeTab === 'reviews' &&
        filteredReviews.map(renderReviewCard)}
    </div>
  );
};

export default SearchResultsDisplay;
