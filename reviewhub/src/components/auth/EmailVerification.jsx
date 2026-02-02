import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/reviewhub_logo.png';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationEmail, loading, error, emailVerificationStatus } = useAuth();

  const [verificationState, setVerificationState] = useState('checking'); // checking, success, failed, resend
  const [resendEmail, setResendEmail] = useState('');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleEmailVerification(token);
    } else {
      setVerificationState('resend');
    }
  }, [token]);

  const handleEmailVerification = async (verificationToken) => {
    try {
      setVerificationState('checking');
      await verifyEmail(verificationToken);
      setVerificationState('success');
      setMessage('Your email has been successfully verified! You can now access all features of ReviewHub.');

      // Redirect to home page after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setVerificationState('failed');
      setMessage(error.message || 'Email verification failed. The link may be expired or invalid.');
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      setMessage('Please enter your email address.');
      return;
    }

    try {
      await resendVerificationEmail(resendEmail);
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch (error) {
      setMessage(error.message || 'Failed to send verification email.');
    }
  };

  const renderVerificationStatus = () => {
    switch (verificationState) {
      case 'checking':
        return (
          <div className="text-center py-8">
            <RefreshCw
              className="h-16 w-16 mx-auto mb-4 animate-spin"
              style={{ color: '#2196F3' }}
            />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: '#1A1A1A' }}
            >
              Verifying Your Email
            </h2>
            <p style={{ color: '#6B7280' }}>
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: '#22C55E' }}
            />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: '#1A1A1A' }}
            >
              Email Verified Successfully!
            </h2>
            <p className="mb-4" style={{ color: '#6B7280' }}>{message}</p>
            <div
              className="p-4 mb-6"
              style={{
                background: '#E8F5E9',
                border: '1px solid #A5D6A7',
                borderRadius: '12px',
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 mr-2" style={{ color: '#2E7D32' }} />
                <span className="font-medium" style={{ color: '#2E7D32' }}>
                  Welcome to ReviewHub!
                </span>
              </div>
              <p style={{ color: '#388E3C' }}>
                You can now write reviews, vote on helpful reviews, and access your profile.
              </p>
            </div>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Redirecting you to the homepage in a few seconds...
            </p>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-8">
            <XCircle
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: '#DC2626' }}
            />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: '#1A1A1A' }}
            >
              Verification Failed
            </h2>
            <p className="mb-6" style={{ color: '#6B7280' }}>{message}</p>
            <div
              className="p-4 mb-6 text-left"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '12px',
              }}
            >
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 mr-2" style={{ color: '#DC2626' }} />
                <span className="font-medium" style={{ color: '#991B1B' }}>
                  Common Issues:
                </span>
              </div>
              <ul
                className="text-sm list-disc list-inside"
                style={{ color: '#B91C1C' }}
              >
                <li>The verification link has expired (links expire after 24 hours)</li>
                <li>The link has already been used</li>
                <li>The link was copied incorrectly</li>
              </ul>
            </div>
            <Button
              onClick={() => setVerificationState('resend')}
              className="mb-4 w-full bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] text-white hover:opacity-90 transition-opacity"
              style={{ borderRadius: '8px' }}
            >
              Request New Verification Email
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
              style={{
                borderRadius: '8px',
                borderColor: '#E5E7EB',
                color: '#374151',
              }}
            >
              Return to Homepage
            </Button>
          </div>
        );

      case 'resend':
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Mail
                className="h-16 w-16 mx-auto mb-4"
                style={{ color: '#2196F3' }}
              />
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: '#1A1A1A' }}
              >
                Verify Your Email
              </h2>
              <p style={{ color: '#6B7280' }}>
                Enter your email address to receive a new verification link.
              </p>
            </div>

            <form onSubmit={handleResendVerification} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#374151' }}
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  style={{
                    borderColor: '#E5E7EB',
                    borderRadius: '8px',
                  }}
                />
              </div>

              {message && (
                <div
                  className="p-4"
                  style={{
                    background: message.includes('sent') ? '#E8F5E9' : '#FEF2F2',
                    border: message.includes('sent')
                      ? '1px solid #A5D6A7'
                      : '1px solid #FECACA',
                    borderRadius: '12px',
                    color: message.includes('sent') ? '#2E7D32' : '#DC2626',
                  }}
                >
                  <div className="flex items-center">
                    {message.includes('sent') ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    <span>{message}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#5B7DD4] to-[#A391E2] text-white hover:opacity-90 transition-opacity"
                style={{ borderRadius: '8px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Email
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
                style={{
                  borderRadius: '8px',
                  borderColor: '#E5E7EB',
                  color: '#374151',
                }}
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)' }}
    >
      <div className="max-w-md w-full">
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: '32px',
          }}
        >
          {/* Header with logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-4">
              <img src={logoImage} alt="ReviewHub" className="h-10 mx-auto" />
            </Link>
            <h1
              className="text-2xl font-bold"
              style={{ color: '#1A1A1A' }}
            >
              Email Verification
            </h1>
          </div>

          {renderVerificationStatus()}
        </div>
      </div>
    </div>
  );
}
