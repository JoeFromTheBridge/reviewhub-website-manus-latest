import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Badge } from '../ui/badge';

const RecommendationCard = ({ product, type = 'recommendation', showReasons = true }) => {
  const renderStars = (rating) => {
    const value = Number(rating) || 0;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4"
            style={{
              color: i < Math.floor(value)
                ? '#FFC107'
                : i < Math.ceil(value) && value % 1 >= 0.5
                ? '#FFC107'
                : '#E5E7EB',
              fill: i < Math.floor(value)
                ? '#FFC107'
                : i < Math.ceil(value) && value % 1 >= 0.5
                ? '#FFC107'
                : 'none',
              opacity: i < Math.ceil(value) && value % 1 >= 0.5 && i >= Math.floor(value) ? 0.5 : 1,
            }}
          />
        ))}
      </div>
    );
  };

  const getScoreDisplay = () => {
    if (type === 'similar' && product.similarity_score) {
      return `${(product.similarity_score * 100).toFixed(0)}% Similar`;
    }
    if (product.recommendation_score) {
      return `${(product.recommendation_score * 100).toFixed(0)}% Match`;
    }
    return null;
  };

  const scoreDisplay = getScoreDisplay();

  return (
    <div
      className="h-full overflow-hidden transition-all duration-300"
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Product Image at Top */}
      {product.image_url && (
        <Link to={`/product/${product.id}`}>
          <div
            className="w-full h-40"
            style={{ background: '#E3F2FD' }}
          >
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      )}

      <div className="p-6">
        {/* Category Badge */}
        {product.category && (
          <Badge
            variant="secondary"
            className="mb-2"
            style={{
              background: '#E3F2FD',
              color: '#2196F3',
              borderRadius: '4px',
            }}
          >
            {product.category}
          </Badge>
        )}

        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <Link
              to={`/product/${product.id}`}
              className="font-semibold hover:opacity-80 transition-colors line-clamp-1"
              style={{ color: '#1A1A1A' }}
            >
              {product.name}
            </Link>
            {product.brand && (
              <p className="text-sm" style={{ color: '#6B7280' }}>{product.brand}</p>
            )}
          </div>
          {renderStars(product.average_rating || 0)}
        </div>

        {/* Price */}
        {product.price_min && product.price_max && (
          <p
            className="text-lg font-bold mb-2"
            style={{ color: '#2196F3' }}
          >
            ${product.price_min} - ${product.price_max}
          </p>
        )}

        {/* Description */}
        {product.description && (
          <p
            className="text-sm mb-3 line-clamp-2"
            style={{ color: '#6B7280' }}
          >
            {product.description}
          </p>
        )}

        {/* Footer info */}
        <div
          className="flex items-center justify-between text-xs mb-3"
          style={{ color: '#6B7280' }}
        >
          <span>{product.review_count || 0} reviews</span>
          {scoreDisplay && (
            <span
              className="px-2 py-1 rounded-full"
              style={{
                background: '#E8F5E9',
                color: '#2E7D32',
              }}
            >
              {scoreDisplay}
            </span>
          )}
        </div>

        {/* View Product Button */}
        <Link
          to={`/product/${product.id}`}
          className="block w-full text-center py-2 text-sm font-medium transition-colors"
          style={{
            border: '1px solid #2196F3',
            color: '#2196F3',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2196F3';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#2196F3';
          }}
        >
          View Product
        </Link>
      </div>
    </div>
  );
};

export default RecommendationCard;
