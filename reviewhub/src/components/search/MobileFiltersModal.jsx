// reviewhub/src/components/search/MobileFiltersModal.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import SearchFilters from './SearchFilters';

const MobileFiltersModal = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  availableFilters,
  activeFiltersCount = 0,
}) => {
  const modalRef = useRef(null);

  // Use iOS-safe scroll lock
  useBodyScrollLock(isOpen);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Focus trapping
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  // Set initial focus when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const closeButton = modalRef.current.querySelector('button[aria-label="Close filters"]');
      if (closeButton) {
        setTimeout(() => closeButton.focus(), 100);
      }
    }
  }, [isOpen]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filters-title"
    >
      <div
        ref={modalRef}
        onKeyDown={handleKeyDown}
        className="bg-white w-full sm:max-w-md sm:mx-4 sm:rounded-lg flex flex-col"
        style={{
          maxHeight: '90vh',
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light flex-shrink-0 pt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-text-primary" />
            <h2 id="mobile-filters-title" className="text-lg font-semibold text-text-primary">
              Filters
            </h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="rounded-sm bg-soft-blue text-accent-blue">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable filter content */}
        <div
          data-scroll-lock-scrollable
          className="flex-1 overflow-y-auto"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <SearchFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            onApplyFilters={onApplyFilters}
            onResetFilters={onResetFilters}
            availableFilters={availableFilters}
            className="border-0 shadow-none rounded-none"
            hideActionButtons={true}
          />
        </div>

        {/* Sticky action bar */}
        <div
          className="flex-shrink-0 p-4 border-t border-border-light bg-white flex gap-3"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 min-h-[48px] rounded-md transition-smooth"
            disabled={activeFiltersCount === 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 min-h-[48px] rounded-md bg-accent-blue hover:bg-accent-blue/90 transition-smooth"
          >
            Apply Filters
            {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileFiltersModal;
