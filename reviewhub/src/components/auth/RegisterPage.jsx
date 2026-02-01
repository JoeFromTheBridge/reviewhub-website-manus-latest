// reviewhub/src/components/auth/RegisterPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '../../contexts/AuthContext'
import logoImage from '../../assets/reviewhub_logo.png'

// Simple Google icon component
function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const navigate = useNavigate()
  const { register, resendVerificationEmail } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (error) setError('')
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (!/(?=.*[a-z])/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/(?=.*\d)/.test(formData.password)) {
      setError('Password must contain at least one number')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const { confirmPassword, ...registrationData } = formData
      await register(registrationData)

      setRegistrationSuccess(true)
      setRegisteredEmail(formData.email)

      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
      })
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsLoading(true)
    setError('')

    try {
      await resendVerificationEmail(registeredEmail)
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)' }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          padding: '32px',
        }}
      >
        {registrationSuccess ? (
          // Success message
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#22C55E' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
              Account Created!
            </h2>
            <p className="mb-4" style={{ color: '#6B7280' }}>
              We've sent a verification email to <strong>{registeredEmail}</strong>
            </p>

            <div
              className="rounded-lg p-4 mb-6"
              style={{
                background: '#E3F2FD',
                border: '1px solid #90CAF9',
              }}
            >
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 mr-2" style={{ color: '#2196F3' }} />
                <span className="font-medium" style={{ color: '#1565C0' }}>
                  Next Steps:
                </span>
              </div>
              <ol
                className="text-sm list-decimal list-inside text-left"
                style={{ color: '#1976D2' }}
              >
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Complete your account setup</li>
                <li>Start writing reviews!</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                variant="outline"
                className="w-full"
                disabled={isLoading}
                style={{
                  borderColor: '#E5E7EB',
                  color: '#374151',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate('/')}
                className="w-full text-white"
                style={{ backgroundColor: '#6A5CFF' }}
              >
                Go to Homepage
              </Button>
            </div>

            {error && (
              <div
                className="mt-4 p-3 rounded-md"
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                }}
              >
                <p className="text-sm" style={{ color: '#DC2626' }}>
                  {error}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Registration form
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-block mb-4">
                <img src={logoImage} alt="ReviewHub" className="h-10 mx-auto" />
              </Link>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                Create Account
              </h1>
              <p style={{ color: '#6B7280' }}>Read Reviews · Share Opinions · Help Others</p>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="mb-4 p-3 rounded-md"
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                }}
              >
                <p className="text-sm" style={{ color: '#DC2626' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium mb-1"
                    style={{ color: '#374151' }}
                  >
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    disabled={isLoading}
                    className="w-full"
                    style={{
                      borderColor: '#E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium mb-1"
                    style={{ color: '#374151' }}
                  >
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    disabled={isLoading}
                    className="w-full"
                    style={{
                      borderColor: '#E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1"
                  style={{ color: '#374151' }}
                >
                  Username <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  disabled={isLoading}
                  className="w-full"
                  style={{
                    borderColor: '#E5E7EB',
                    borderRadius: '8px',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                  style={{ color: '#374151' }}
                >
                  Email <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  disabled={isLoading}
                  className="w-full"
                  style={{
                    borderColor: '#E5E7EB',
                    borderRadius: '8px',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                  style={{ color: '#374151' }}
                >
                  Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    disabled={isLoading}
                    className="w-full pr-10"
                    style={{
                      borderColor: '#E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" style={{ color: '#9CA3AF' }} />
                    ) : (
                      <Eye className="h-4 w-4" style={{ color: '#9CA3AF' }} />
                    )}
                  </button>
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Must contain uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-1"
                  style={{ color: '#374151' }}
                >
                  Confirm Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="w-full pr-10"
                    style={{
                      borderColor: '#E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" style={{ color: '#9CA3AF' }} />
                    ) : (
                      <Eye className="h-4 w-4" style={{ color: '#9CA3AF' }} />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-white hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: '#6A5CFF',
                  borderRadius: '8px',
                  padding: '10px 20px',
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Or continue with divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t" style={{ borderColor: '#E5E7EB' }} />
              <span className="px-4 text-sm" style={{ color: '#9CA3AF' }}>
                Or continue with
              </span>
              <div className="flex-1 border-t" style={{ borderColor: '#E5E7EB' }} />
            </div>

            {/* Google sign-in button */}
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 opacity-60 cursor-not-allowed"
                style={{
                  borderColor: '#E5E7EB',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: '#374151',
                }}
                disabled
              >
                <GoogleIcon className="h-5 w-5" />
                Continue with Google
              </Button>
              <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                Coming soon
              </p>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Already have an account?{' '}
                <Link
                  to="/?login=1"
                  className="font-medium hover:underline"
                  style={{ color: '#6A5CFF' }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RegisterPage
