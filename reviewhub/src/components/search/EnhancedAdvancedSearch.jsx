import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  History,
  Bookmark,
  Settings,
  Zap,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SearchAutocomplete from './SearchAutocomplete';
import SearchFilters from './SearchFilters';
import SearchHistory from './SearchHistory';
import MobileFiltersModal from './MobileFiltersModal';
import apiService from '../../services/api';

const EnhancedAdvancedSearch = ({
  onSearch,
  onFiltersChange,
  initialFilters = {},
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    selectedRatings: [],
    hasReviews: false,
    verifiedOnly: false,
    hasImages: false,
    dateRange: '',
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    brands: [],
    priceRanges: [],
    features: []
  });

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [quickFilters, setQuickFilters] = useState([]);
  const [searchStats, setSearchStats] = useState({});

  useEffect(() => {
    loadAvailableFilters();
    loadQuickFilters();
    loadSearchStats();
  }, []);

  const loadAvailableFilters = async () => {
    try {
      // Load categories
      const categoriesResponse = await apiService.getCategories();

      // Load brands (this would need to be implemented in the backend)
      const brands = [
        'Apple', 'Samsung', 'Google', 'Microsoft', 'Sony', 'LG', 'Dell',
        'HP', 'Lenovo', 'ASUS', 'Acer', 'Canon', 'Nikon', 'Nike', 'Adidas',
        'Amazon', 'Netflix', 'Spotify', 'Tesla', 'BMW', 'Mercedes', 'Toyota'
      ];

      setAvailableFilters({
        categories: categoriesResponse.categories || [],
        brands: brands,
        priceRanges: [
          { label: 'Under $25', min: 0, max: 25 },
          { label: '$25 - $50', min: 25, max: 50 },
          { label: '$50 - $100', min: 50, max: 100 },
          { label: '$100 - $250', min: 100, max: 250 },
          { label: '$250 - $500', min: 250, max: 500 },
          { label: 'Over $500', min: 500, max: null }
        ],
        features: [
          'Free Shipping',
          'Prime Eligible',
          'Best Seller',
          'Editor\'s Choice',
          'Customer Favorite',
          'New Release'
        ]
      });
    } catch (error) {
      console.error('Error loading available filters:', error);
    }
  };

  const loadQuickFilters = () => {
    // Popular filter combinations
    setQuickFilters([
      {
        name: 'Highly Rated',
        filters: { minRating: 4, hasReviews: true },
        icon: '⭐'
      },
      {
        name: 'Budget Friendly',
        filters: { maxPrice: 50 },
        icon: '💰'
      },
      {
        name: 'Premium',
        filters: { minPrice: 200, minRating: 4 },
        icon: '👑'
      },
      {
        name: 'Verified Reviews',
        filters: { verifiedOnly: true, hasReviews: true },
        icon: '✅'
      },
      {
        name: 'With Images',
        filters: { hasImages: true },
        icon: '📷'
      },
      {
        name: 'Recent',
        filters: { dateRange: '1m' },
        icon: '🆕'
      }
    ]);
  };

  const loadSearchStats = async () => {
    try {
      // This would load search analytics from the backend
      setSearchStats({
        totalSearches: 1250,
        popularCategories: ['Electronics', 'Clothing', 'Books'],
        trendingQueries: ['wireless headphones', 'laptop stand', 'coffee maker'],
        avgResultsPerSearch: 45
      });
    } catch (error) {
      console.error('Error loading search stats:', error);
    }
  };

  const handleSearch = (searchQuery = query, searchFilters = filters) => {
    if (!searchQuery.trim()) return;

    // Save search to history
    saveSearchToHistory(searchQuery, searchFilters);

    // Trigger search
    onSearch(searchQuery, searchFilters);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleQuickFilterClick = (quickFilter) => {
    const newFilters = { ...filters, ...quickFilter.filters };
    setFilters(newFilters);
    handleFiltersChange(newFilters);
    handleSearch(query, newFilters);
  };

  const handleHistorySearch = (historyQuery, historyFilters = {}) => {
    setQuery(historyQuery);
    const newFilters = { ...filters, ...historyFilters };
    setFilters(newFilters);
    handleSearch(historyQuery, newFilters);
  };

  const saveSearchToHistory = (searchQuery, searchFilters) => {
    try {
      const history = JSON.parse(localStorage.getItem('reviewhub_search_history') || '[]');
      const newSearch = {
        id: Date.now(),
        query: searchQuery,
        filters: searchFilters,
        timestamp: new Date().toISOString(),
        results: 0 // This would be updated after getting results
      };

      const updatedHistory = [newSearch, ...history.slice(0, 99)]; // Keep last 100 searches
      localStorage.setItem('reviewhub_search_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search to history:', error);
    }
  };

  const resetFilters = () => {
    const resetFilters = {
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      selectedRatings: [],
      hasReviews: false,
      verifiedOnly: false,
      hasImages: false,
      dateRange: ''
    };
    setFilters(resetFilters);
    handleFiltersChange(resetFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value =>
      value !== undefined && value !== null && value !== '' && value !== false &&
      !(Array.isArray(value) && value.length === 0)
    ).length;
  };

  // Handle filter button click - mobile opens modal, desktop toggles inline
  const handleFilterButtonClick = () => {
    // Check if we're on mobile (< lg breakpoint = 1024px)
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      setShowMobileFilters(true);
    } else {
      setShowAdvanced(!showAdvanced);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Search Bar */}
      <Card className="rounded-md shadow-input bg-white-surface border border-border-light">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Search Input with Autocomplete */}
            <div className="relative">
              <SearchAutocomplete
                value={query}
                onChange={setQuery}
                onSearch={(searchQuery) => handleSearch(searchQuery)}
                placeholder="Search products, reviews, brands..."
                className="w-full"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
              <span className="text-xs sm:text-sm font-medium text-text-primary mr-1 sm:mr-2 w-full sm:w-auto mb-1 sm:mb-0">Quick filters:</span>
              {quickFilters.map((quickFilter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilterClick(quickFilter)}
                  className="text-xs rounded-sm transition-smooth hover:border-accent-blue hover:text-accent-blue min-h-[36px] px-2 sm:px-3"
                >
                  <span className="mr-1">{quickFilter.icon}</span>
                  {quickFilter.name}
                </Button>
              ))}
            </div>

            {/* Search Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleSearch()}
                  disabled={!query.trim()}
                  className="flex-1 sm:flex-none px-4 sm:px-6 rounded-sm bg-accent-blue hover:bg-accent-blue/90 transition-smooth min-h-[44px]"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>

                {/* Filter button - opens modal on mobile, toggles inline on desktop */}
                <Button
                  variant="outline"
                  onClick={handleFilterButtonClick}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-sm transition-smooth hover:border-accent-blue min-h-[44px] px-3 sm:px-4"
                >
                  <Filter className="h-4 w-4" />
                  <span className="sm:inline">Filters</span>
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="ml-1 rounded-sm bg-soft-blue text-accent-blue">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                  {/* Only show chevron on desktop */}
                  <span className="hidden lg:inline">
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </Button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="h-4 w-4" />
                <span>{searchStats.totalSearches || 0} searches today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Advanced Search Panel - only visible on lg+ */}
      {showAdvanced && (
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Filters */}
          <div className="lg:col-span-2 order-1">
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={(newFilters) => handleSearch(query, newFilters)}
              onResetFilters={resetFilters}
              availableFilters={availableFilters}
            />
          </div>

          {/* Search History & Stats */}
          <div className="space-y-6">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <SearchHistory
                  onSearchSelect={handleHistorySearch}
                  className="h-96"
                />
              </TabsContent>

              <TabsContent value="stats">
                <Card className="rounded-md shadow-card bg-white-surface">
                  <CardHeader>
                    <CardTitle className="text-lg text-text-primary">Search Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Popular Categories */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-text-primary">Popular Categories</h4>
                      <div className="flex flex-wrap gap-1">
                        {searchStats.popularCategories?.map((category, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer rounded-sm transition-smooth hover:bg-soft-blue hover:text-accent-blue"
                            onClick={() => {
                              const newFilters = { ...filters, category };
                              setFilters(newFilters);
                              handleSearch(query, newFilters);
                            }}
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Trending Queries */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-text-primary">Trending Searches</h4>
                      <div className="space-y-1">
                        {searchStats.trendingQueries?.map((trendingQuery, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(trendingQuery)}
                            className="block w-full text-left text-sm text-text-secondary hover:text-accent-blue py-1 transition-smooth"
                          >
                            <TrendingUp className="h-3 w-3 inline mr-2" />
                            {trendingQuery}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light">
                      <div className="text-center">
                        <div className="text-lg font-bold text-accent-blue">
                          {searchStats.totalSearches || 0}
                        </div>
                        <div className="text-xs text-text-secondary">Total Searches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {searchStats.avgResultsPerSearch || 0}
                        </div>
                        <div className="text-xs text-text-secondary">Avg Results</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <Card className="rounded-md shadow-card bg-white-surface">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-text-primary">Active filters:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value === false || value === '' || (Array.isArray(value) && value.length === 0)) return null;

                    const displayValue = Array.isArray(value) ? value.join(', ') : value.toString();
                    return (
                      <Badge key={key} variant="secondary" className="text-xs rounded-sm bg-soft-blue text-accent-blue">
                        {key}: {displayValue}
                        <button
                          onClick={() => {
                            const newFilters = { ...filters, [key]: Array.isArray(value) ? [] : '' };
                            setFilters(newFilters);
                            handleFiltersChange(newFilters);
                          }}
                          className="ml-1 hover:text-red-600 transition-smooth"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="transition-smooth hover:text-accent-blue self-start sm:self-auto"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Filters Modal */}
      <MobileFiltersModal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={(newFilters) => {
          handleSearch(query, newFilters);
        }}
        onResetFilters={resetFilters}
        availableFilters={availableFilters}
        activeFiltersCount={getActiveFiltersCount()}
      />
    </div>
  );
};

export default EnhancedAdvancedSearch;
