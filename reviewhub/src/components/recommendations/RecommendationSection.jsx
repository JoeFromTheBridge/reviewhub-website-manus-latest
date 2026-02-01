import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import { api } from '../../services/api';

const RecommendationSection = ({
  title,
  type = 'recommendation',
  userId = null,
  productId = null,
  categoryId = null,
  limit = 6,
  showReasons = true
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, [type, userId, productId, categoryId, limit]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      let data;

      switch (type) {
        case 'user':
          data = await api.getUserRecommendations(limit);
          setRecommendations(data.recommendations || []);
          break;

        case 'similar':
          if (productId) {
            data = await api.getSimilarProducts(productId, limit);
            setRecommendations(data.similar_products || []);
          }
          break;

        case 'trending':
          data = await api.getTrendingProducts(categoryId, limit);
          setRecommendations(data.trending_products || []);
          break;

        default:
          setRecommendations([]);
      }
    } catch (err) {
      setError('Failed to load recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center mb-8">
          <p
            className="text-base uppercase tracking-[0.1em] mb-2"
            style={{ color: '#6B7280' }}
          >
            Discover
          </p>
          <h2
            className="text-2xl font-semibold"
            style={{ color: '#1A1A1A' }}
          >
            {title}
          </h2>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2196F3' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="text-center mb-8">
          <p
            className="text-base uppercase tracking-[0.1em] mb-2"
            style={{ color: '#6B7280' }}
          >
            Discover
          </p>
          <h2
            className="text-2xl font-semibold"
            style={{ color: '#1A1A1A' }}
          >
            {title}
          </h2>
        </div>
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <p
          className="text-base uppercase tracking-[0.1em] mb-2"
          style={{ color: '#6B7280' }}
        >
          Discover
        </p>
        <h2
          className="text-2xl font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          {title}
        </h2>
      </div>

      {/* Responsive grid - same as homepage Recent Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((product, index) => (
          <RecommendationCard
            key={product.id || index}
            product={product}
            type={type}
            showReasons={showReasons}
          />
        ))}
      </div>
    </div>
  );
};

export default RecommendationSection;
