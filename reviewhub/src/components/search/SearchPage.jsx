// reviewhub/src/components/search/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, Camera, Mic } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AdvancedSearch from './AdvancedSearch';
import SearchResultsDisplay from './SearchResultsDisplay';
import VisualSearch from './VisualSearch';
import VoiceSearch from './VoiceSearch';
import apiService from '../../services/api';

const SearchPage = () => {
  const location = useLocation();

  const [activeSearchTab, setActiveSearchTab] = useState('text'); // 'text', 'visual', or 'voice'
  const [activeResultsTab, setActiveResultsTab] = useState('products'); // 'products' or 'reviews'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], reviews: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('text'); // 'text', 'visual', or 'voice'

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    const tab = params.get('tab'); // optional: 'products' or 'reviews'

    const initialFilters = {};
    for (let [key, value] of params.entries()) {
      if (key !== 'q' && key !== 'tab') {
        initialFilters[key] = value;
      }
    }

    const wantsReviewsTab = tab === 'reviews';
    const hasFilters = Object.keys(initialFilters).length > 0;

    if (query || hasFilters || wantsReviewsTab) {
      setSearchQuery(query);
      performSearch(query, initialFilters, wantsReviewsTab ? 'reviews' : 'products');
    } else {
      // Clear results if there is no query, filters, or explicit tab
      setSearchResults({ products: [], reviews: [] });
      setError(null);
      setActiveResultsTab('products');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const performSearch = async (query, filters = {}, initialResultsTab = 'products') => {
    setLoading(true);
    setError(null);
    setSearchType('text');
    setActiveResultsTab(initialResultsTab);

    try {
      const baseParams = { ...filters };
      if (query) {
        // Pass text query to the backend; extra params are safely ignored if unsupported
        baseParams.q = query;
      }

      const [productResults, reviewResults] = await Promise.all([
        apiService.getProducts(baseParams),
        apiService.getReviews({
          ...baseParams,
          limit: 20,
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

  const handleVisualSearchResults = (results, type) => {
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
    window.history.pushState({}, '', `/search?${urlParams.toString()}`);
  };

  const handleSearch = (query, filters) => {
    setSearchQuery(query || '');

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    for (const key in filters) {
      if (filters[key]) {
        params.set(key, filters[key]);
      }
    }

    // Default text search: products tab is primary
    window.history.pushState({}, '', `/search?${params.toString()}`);
    performSearch(query, filters, 'products');
  };

  const handleFiltersChange = () => {
    // AdvancedSearch manages its own internal state;
    // we trigger actual searches only via handleSearch on submit.
  };

  const hasResults =
    (searchResults.products && searchResults.products.length > 0) ||
    (searchResults.reviews && searchResults.reviews.length > 0) ||
    !!error;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Search ReviewHub</h1>

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
          initialQuery={searchQuery}
        />
      ) : activeSearchTab === 'visual' ? (
        <VisualSearch onResults={handleVisualSearchResults} onError={handleVisualSearchError} />
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
          />
        </>
      )}
    </div>
  );
};

export default SearchPage;
