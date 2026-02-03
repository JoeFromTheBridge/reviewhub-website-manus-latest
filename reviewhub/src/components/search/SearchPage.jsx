// reviewhub/src/components/search/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Camera, Mic } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdvancedSearch from './EnhancedAdvancedSearch';
import SearchResultsDisplay from './SearchResultsDisplay';
import VisualSearch from './VisualSearch';
import VoiceSearch from './VoiceSearch';
import apiService from '../../services/api';

// --------- helper utilities ---------
const normalize = (value) => (value || '').toString().toLowerCase();

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

const buildCategoryMatchers = (filters) => {
  const categoryFilter = normalize(
    filters.category_name || filters.category || filters.category_slug || ''
  );
  const categoryIdFilter = filters.category_id || filters.categoryId || null;

  const productMatchesCategory = (product) => {
    if (!categoryFilter && !categoryIdFilter) return true;

    let ok = false;

    const pCat = normalize(
      product.category || product.category_name || product.category_slug || ''
    );
    if (categoryFilter && pCat && pCat.includes(categoryFilter)) {
      ok = true;
    }

    const pCatId = product.category_id || product.categoryId;
    if (
      categoryIdFilter &&
      pCatId &&
      String(pCatId) === String(categoryIdFilter)
    ) {
      ok = true;
    }

    return ok;
  };

  const reviewMatchesCategory = (review, allProducts) => {
    if (!categoryFilter && !categoryIdFilter) return true;

    let ok = false;

    const matchedProduct = matchProductForReview(review, allProducts);
    if (matchedProduct && productMatchesCategory(matchedProduct)) {
      ok = true;
    }

    const rCat = normalize(
      review.category || review.category_name || review.category_slug || ''
    );
    if (!ok && categoryFilter && rCat && rCat.includes(categoryFilter)) {
      ok = true;
    }

    const rCatId = review.category_id || review.categoryId;
    if (
      !ok &&
      categoryIdFilter &&
      rCatId &&
      String(rCatId) === String(categoryIdFilter)
    ) {
      ok = true;
    }

    return ok;
  };

  return { productMatchesCategory, reviewMatchesCategory };
};

const productMatchesQuery = (product, q) => {
  if (!q) return true;
  const text = normalize(
    (product.name || product.title || product.product_name || '') +
      ' ' +
      (product.brand || product.manufacturer || '') +
      ' ' +
      (product.description || product.summary || product.short_description || '')
  );
  return text.includes(q);
};

const productMatchesPrice = (product, filters) => {
  // Get product price - check multiple possible field names
  const rawPriceMin = product.price_min ?? product.price ?? product.priceMin ?? null;
  const rawPriceMax = product.price_max ?? product.priceMax ?? rawPriceMin ?? null;

  // If product has no price data at all, don't filter it out (show it)
  const hasProductPrice = rawPriceMin !== null || rawPriceMax !== null;

  const priceMin = Number(rawPriceMin || 0);
  const priceMax = Number(rawPriceMax || rawPriceMin || 0);

  // Check if filter values are actually set and not at default positions
  // minPrice of 0 means "no minimum", maxPrice of 1000 is the default max
  const hasMinPrice = filters.minPrice !== undefined &&
                      filters.minPrice !== null &&
                      filters.minPrice !== '' &&
                      Number(filters.minPrice) > 0;
  const hasMaxPrice = filters.maxPrice !== undefined &&
                      filters.maxPrice !== null &&
                      filters.maxPrice !== '' &&
                      Number(filters.maxPrice) < 1000;

  // If no price filters are active, show all products
  if (!hasMinPrice && !hasMaxPrice) return true;

  // If product has no price data but filters are active, hide it
  if (!hasProductPrice && (hasMinPrice || hasMaxPrice)) return false;

  if (hasMinPrice) {
    const minPriceFilter = Number(filters.minPrice);
    // Product's max price should be at least the minimum filter
    if (priceMax < minPriceFilter) return false;
  }

  if (hasMaxPrice) {
    const maxPriceFilter = Number(filters.maxPrice);
    // Product's min price should be at most the maximum filter
    if (priceMin > maxPriceFilter) return false;
  }

  return true;
};

const productMatchesRating = (product, filters) => {
  const selectedRatings = filters.selectedRatings || [];

  if (selectedRatings.length === 0) return true;

  const avgRating = Number(product.average_rating || 0);

  // "& up" semantics: if user selects "4+ stars", show products with rating >= 4
  // Find the minimum selected rating - products must have at least that rating
  const minSelectedRating = Math.min(...selectedRatings);

  return avgRating >= minSelectedRating;
};

const reviewMatchesQuery = (review, q, allProducts) => {
  if (!q) return true;

  const matchedProduct = matchProductForReview(review, allProducts);

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

  const text = normalize(
    productName +
      ' ' +
      productBrand +
      ' ' +
      (review.title || '') +
      ' ' +
      (review.comment || review.content || '')
  );

  return text.includes(q);
};

// --------- main component ---------
const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeSearchTab, setActiveSearchTab] = useState('text'); // 'text', 'visual', or 'voice'
  const [activeResultsTab, setActiveResultsTab] = useState('products'); // 'products' or 'reviews'
  const [searchQuery, setSearchQuery] = useState('');
  const [urlFilters, setUrlFilters] = useState({});
  const [initialFilters, setInitialFilters] = useState({});

  const [searchResults, setSearchResults] = useState({
    products: [],
    reviews: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('text'); // 'text', 'visual', or 'voice'

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    const tabParam = params.get('tab');

    if (tabParam === 'reviews') {
      setActiveResultsTab('reviews');
    } else if (tabParam === 'products') {
      setActiveResultsTab('products');
    }

    const filtersFromUrl = {};
    for (let [key, value] of params.entries()) {
      if (key === 'q' || key === 'tab') continue;
      filtersFromUrl[key] = value;
    }

    setInitialFilters(filtersFromUrl);
    setUrlFilters(filtersFromUrl);
    setSearchQuery(query);

    if (query || Object.keys(filtersFromUrl).length > 0) {
      performSearch(query, filtersFromUrl);
    } else {
      setSearchResults({ products: [], reviews: [] });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const performSearch = async (query, filters = {}) => {
    setLoading(true);
    setError(null);
    setSearchType('text');

    try {
      const apiFilters = { ...filters };

      if (apiFilters.category) {
        if (!apiFilters.category_slug) {
          apiFilters.category_slug = apiFilters.category;
        }
        if (!apiFilters.category_name) {
          apiFilters.category_name = apiFilters.category;
        }
      }

      if (apiFilters.category_id && !apiFilters.categoryId) {
        apiFilters.categoryId = apiFilters.category_id;
      }

      const productParams = { ...apiFilters };
      if (query) {
        productParams.q = query; // backend may ignore this; we still filter client-side
      }

      const [productResults, reviewResults] = await Promise.all([
        apiService.getProducts(productParams),
        apiService.getReviews({
          limit: 100,
          sort: 'created_at',
          order: 'desc',
        }),
      ]);

      const allProducts = productResults?.products || [];
      const allReviews = reviewResults?.reviews || [];

      const q = normalize(query);
      const { productMatchesCategory, reviewMatchesCategory } =
        buildCategoryMatchers(apiFilters);

      const filteredProducts = allProducts.filter(
        (p) =>
          productMatchesCategory(p) &&
          productMatchesQuery(p, q) &&
          productMatchesPrice(p, apiFilters) &&
          productMatchesRating(p, apiFilters)
      );

      const filteredReviews = allReviews.filter(
        (r) =>
          reviewMatchesCategory(r, allProducts) &&
          reviewMatchesQuery(r, q, allProducts)
      );

      setSearchResults({
        products: filteredProducts,
        reviews: filteredReviews,
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch search results.');
      setSearchResults({ products: [], reviews: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleVisualSearchResults = (results) => {
    setSearchResults({
      products: results || [],
      reviews: [],
    });
    setSearchType('visual');
    setActiveResultsTab('products');
    setError(null);
  };

  const handleVisualSearchError = (errorMessage) => {
    setError(errorMessage);
    setSearchResults({ products: [], reviews: [] });
  };

  const handleVoiceSearchResults = (results) => {
    setSearchResults({
      products: results?.products || [],
      reviews: results?.reviews || [],
    });
    setSearchType('voice');
    setActiveResultsTab('products');
    setError(null);
  };

  const handleVoiceSearchParams = (params) => {
    const urlParams = new URLSearchParams();
    for (const key in params) {
      if (params[key]) {
        urlParams.set(key, params[key]);
      }
    }
    navigate(`/search?${urlParams.toString()}`);
  };

  const handleSearch = (query, filters) => {
    const nextQuery = query || '';
    const nextFilters = filters || {};

    setSearchQuery(nextQuery);
    setUrlFilters(nextFilters);

    const params = new URLSearchParams();
    if (nextQuery) params.set('q', nextQuery);
    for (const key in nextFilters) {
      if (nextFilters[key]) {
        params.set(key, nextFilters[key]);
      }
    }

    if (activeResultsTab === 'reviews') {
      params.set('tab', 'reviews');
    }

    navigate(`/search?${params.toString()}`);
    performSearch(nextQuery, nextFilters);
  };

  const handleFiltersChange = () => {
    // EnhancedAdvancedSearch manages its own internal state; searches happen via handleSearch.
  };

  const hasResults =
    (searchResults.products && searchResults.products.length > 0) ||
    (searchResults.reviews && searchResults.reviews.length > 0) ||
    !!error;

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4 sm:mb-6">
          Search ReviewHub
        </h1>

      {/* Search Type Tabs */}
      <div className="flex overflow-x-auto border-b border-border-light mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
        <button
          className={`py-2.5 sm:py-3 px-3 sm:px-6 text-sm sm:text-lg font-medium transition-smooth whitespace-nowrap min-h-[44px] ${
            activeSearchTab === 'text'
              ? 'border-b-2 border-accent-blue text-accent-blue'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveSearchTab('text')}
        >
          <Search className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1.5 sm:mr-2" />
          Text
        </button>
        <button
          className={`py-2.5 sm:py-3 px-3 sm:px-6 text-sm sm:text-lg font-medium transition-smooth whitespace-nowrap min-h-[44px] ${
            activeSearchTab === 'visual'
              ? 'border-b-2 border-accent-blue text-accent-blue'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveSearchTab('visual')}
        >
          <Camera className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1.5 sm:mr-2" />
          Visual
        </button>
        <button
          className={`py-2.5 sm:py-3 px-3 sm:px-6 text-sm sm:text-lg font-medium transition-smooth whitespace-nowrap min-h-[44px] ${
            activeSearchTab === 'voice'
              ? 'border-b-2 border-accent-blue text-accent-blue'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveSearchTab('voice')}
        >
          <Mic className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1.5 sm:mr-2" />
          Voice
        </button>
      </div>

      {/* Search Interface */}
      {activeSearchTab === 'text' ? (
        <AdvancedSearch
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          initialFilters={initialFilters}
          className=""
        />
      ) : activeSearchTab === 'visual' ? (
        <VisualSearch
          onResults={handleVisualSearchResults}
          onError={handleVisualSearchError}
        />
      ) : (
        <VoiceSearch
          onSearchResults={handleVoiceSearchResults}
          onSearchParams={handleVoiceSearchParams}
        />
      )}

      {/* Results Section */}
      {hasResults && (
        <>
          <div className="flex border-b border-border-light mb-4 mt-6 sm:mt-8">
            <button
              className={`py-2 px-3 sm:px-4 text-base sm:text-lg font-medium transition-smooth min-h-[44px] ${
                activeResultsTab === 'products'
                  ? 'border-b-2 border-accent-blue text-accent-blue'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setActiveResultsTab('products')}
            >
              Products ({searchResults.products?.length || 0})
              {searchType === 'visual' && (
                <span className="ml-1 text-xs bg-soft-blue text-accent-blue px-2 py-0.5 rounded-sm">
                  Visual
                </span>
              )}
              {searchType === 'voice' && (
                <span className="ml-1 text-xs bg-soft-lavender text-purple-600 px-2 py-0.5 rounded-sm">
                  Voice
                </span>
              )}
            </button>
            {searchType === 'text' && (
              <button
                className={`py-2 px-3 sm:px-4 text-base sm:text-lg font-medium transition-smooth min-h-[44px] ${
                  activeResultsTab === 'reviews'
                    ? 'border-b-2 border-accent-blue text-accent-blue'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setActiveResultsTab('reviews')}
              >
                Reviews ({searchResults.reviews?.length || 0})
              </button>
            )}
          </div>

          <SearchResultsDisplay
            results={searchResults}
            activeTab={activeResultsTab}
            loading={loading}
            error={error}
            searchType={searchType}
          />
        </>
      )}
      </div>
    </div>
  );
};

export default SearchPage;
