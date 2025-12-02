// reviewhub/src/components/search/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Camera, Mic } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdvancedSearch from './EnhancedAdvancedSearch';
import SearchResultsDisplay from './SearchResultsDisplay';
import VisualSearch from './VisualSearch';
import VoiceSearch from './VoiceSearch';
import apiService from '../../services/api';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeSearchTab, setActiveSearchTab] = useState('text'); // 'text', 'visual', or 'voice'
  const [activeResultsTab, setActiveResultsTab] = useState('products'); // 'products' or 'reviews'
  const [searchQuery, setSearchQuery] = useState('');
  const [urlFilters, setUrlFilters] = useState({});
  const [searchResults, setSearchResults] = useState({ products: [], reviews: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('text'); // 'text', 'visual', or 'voice'
  const [initialFilters, setInitialFilters] = useState({});

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

    // Run a search if we have a query OR any filters (e.g., category from homepage tiles)
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

      const baseParams = { ...apiFilters };

      if (query) {
        baseParams.q = query;
      }

      const [productResults, reviewResults] = await Promise.all([
        apiService.getProducts(baseParams),
        apiService.getReviews({
          ...baseParams,
          limit: 100,
          sort: 'created_at',
          order: 'desc',
        }),
      ]);

      setSearchResults({
        products: productResults?.products || [],
        reviews: reviewResults?.reviews || [],
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

    // Preserve current results tab in URL (so we can deep-link to reviews)
    if (activeResultsTab === 'reviews') {
      params.set('tab', 'reviews');
    }

    navigate(`/search?${params.toString()}`);
    performSearch(nextQuery, nextFilters);
  };

  const handleFiltersChange = () => {
    // EnhancedAdvancedSearch manages its own internal state;
    // actual searches happen via handleSearch on submit.
  };

  const hasResults =
    (searchResults.products && searchResults.products.length > 0) ||
    (searchResults.reviews && searchResults.reviews.length > 0) ||
    !!error;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Search ReviewHub
      </h1>

      {/* Search Type Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 text-lg font-medium ${
            activeSearchTab === 'text'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSearchTab('text')}
        >
          <Search className="h-5 w-5 inline mr-2" />
          Text Search
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium ${
            activeSearchTab === 'visual'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSearchTab('visual')}
        >
          <Camera className="h-5 w-5 inline mr-2" />
          Visual Search
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium ${
            activeSearchTab === 'voice'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSearchTab('voice')}
        >
          <Mic className="h-5 w-5 inline mr-2" />
          Voice Search
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
          {/* Results Type Tabs */}
          <div className="flex border-b border-gray-200 mb-4 mt-8">
            <button
              className={`py-2 px-4 text-lg font-medium ${
                activeResultsTab === 'products'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveResultsTab('products')}
            >
              Products ({searchResults.products?.length || 0})
              {searchType === 'visual' && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  Visual
                </span>
              )}
              {searchType === 'voice' && (
                <span className="ml-1 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                  Voice
                </span>
              )}
            </button>
            {searchType === 'text' && (
              <button
                className={`py-2 px-4 text-lg font-medium ${
                  activeResultsTab === 'reviews'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
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
            searchQuery={searchQuery}
            filters={urlFilters}
          />
        </>
      )}
    </div>
  );
};

export default SearchPage;
