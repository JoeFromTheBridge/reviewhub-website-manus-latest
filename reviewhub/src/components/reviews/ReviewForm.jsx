import { useState } from 'react';
import { Star, Loader2, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export function ReviewForm({
  productId,
  onReviewSubmitted,
  onCancel,
  maxImages = 5, // allow parent to configure, defaults to 5
}) {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Login modal state
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const { isAuthenticated, refreshAuth } = useAuth();

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
    if (error) setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  // Enforce maxImages limit immediately when user selects files
  const handleImagesChange = (images) => {
    const limit = maxImages || 5;
    let next = images || [];

    if (next.length > limit) {
      if (typeof window !== 'undefined') {
        window.alert(
          `You can upload a maximum of ${limit} photos per review. Only the first ${limit} will be used.`
        );
      }
      next = next.slice(0, limit);
    }

    setSelectedImages(next);
    if (error) setError('');
  };

  const uploadImages = async (reviewId) => {
    if (!reviewId || selectedImages.length === 0) return [];

    setUploadingImages(true);
    const uploadedImages = [];

    try {
      // Hard safety cap in case something bypasses selection limit
      const limit = maxImages || 5;
      const toUpload = selectedImages.slice(0, limit);

      if (toUpload.length === 1) {
        // Upload single image
        const result = await apiService.uploadReviewImage(toUpload[0], reviewId);
        if (result && result.image) {
          uploadedImages.push(result.image);
        }
      } else if (toUpload.length > 1) {
        // Upload multiple images
        const result = await apiService.uploadMultipleReviewImages(toUpload, reviewId);
        if (result && Array.isArray(result.images)) {
          uploadedImages.push(...result.images);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images: ' + (error.message || 'Unknown error'));
    } finally {
      setUploadingImages(false);
    }

    return uploadedImages;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      // Instead of redirecting, open the login modal
      setShowLoginDialog(true);
      return;
    }

    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    const comment = formData.comment.trim();
    if (!comment) {
      setError('Please enter a review comment');
      return;
    }

    const title = formData.title.trim();

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData = {
        product_id: productId,
        rating: formData.rating,
        content: comment,
      };

      if (title) {
        reviewData.title = title;
      }

      // Create the review first
      const reviewResponse = await apiService.createReview(reviewData);
      const review = reviewResponse.review || reviewResponse;
      const reviewId = review?.id;

      let uploadedImages = [];
      if (selectedImages.length > 0 && reviewId) {
        try {
          uploadedImages = await uploadImages(reviewId);
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          setError(
            'Review submitted successfully, but some images failed to upload. You can edit your review to add images later.'
          );
        }
      }

      // Ensure the review object has images attached for the parent
      if (review) {
        review.images = [
          ...(Array.isArray(review.images) ? review.images : []),
          ...(Array.isArray(review.review_images) ? review.review_images : []),
          ...uploadedImages,
        ];
      }

      // Reset form
      setFormData({
        rating: 0,
        title: '',
        comment: '',
      });
      setSelectedImages([]);

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted({
          review,
          uploadedImages,
        });
      }
    } catch (error) {
      setError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      setLoginLoading(true);

      const data = await apiService.login({ email, password });

      // Store token in any of the keys the API client looks at
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Let AuthContext refresh if it supports it, otherwise reload
      if (typeof refreshAuth === 'function') {
        await refreshAuth();
      } else {
        window.location.reload();
      }

      setShowLoginDialog(false);
    } catch (err) {
      console.error('Login failed:', err);
      setLoginError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ---------- RENDER ----------

  // Not authenticated: show CTA + login modal
  if (!isAuthenticated) {
    return (
      <>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                You must be logged in to write a review.
              </p>
              <Button onClick={() => setShowLoginDialog(true)}>
                Sign In to Write Review
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign In to Write a Review</DialogTitle>
              <DialogDescription>
                Enter your credentials to continue and then submit your review.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleLoginSubmit} className="space-y-4 mt-2">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={loginLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                />
              </div>

              {loginError && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-600">{loginError}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLoginDialog(false)}
                  disabled={loginLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loginLoading}>
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Authenticated: full review form
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Write a Review</CardTitle>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoveredRating || formData.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {formData.rating > 0 &&
                  `${formData.rating} star${
                    formData.rating !== 1 ? 's' : ''
                  }`}
              </span>
            </div>
          </div>

          {/* Title (optional) */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Review Title (optional)
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summarize your experience"
              disabled={isSubmitting}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Comment / Body */}
          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Review *
            </label>
            <textarea
              id="comment"
              name="comment"
              required
              value={formData.comment}
              onChange={handleChange}
              placeholder="Share your detailed experience with this product..."
              disabled={isSubmitting}
              rows={4}
              maxLength={1000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.comment.length}/1000 characters
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera className="inline h-4 w-4 mr-1" />
              Add Photos (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Help others by sharing photos of the product. You can upload up to{' '}
              {maxImages} image{maxImages === 1 ? '' : 's'}.
            </p>
            <ImageUpload
              onImagesChange={handleImagesChange}
              maxImages={maxImages}
              disabled={isSubmitting || uploadingImages}
              className="border-2 border-dashed border-gray-200 rounded-lg"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || uploadingImages}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || uploadingImages || formData.rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingImages ? 'Uploading Images...' : 'Submitting...'}
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
