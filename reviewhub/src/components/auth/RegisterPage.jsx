// reviewhub/src/components/auth/RegisterPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '../../contexts/AuthContext'
import logoImage from '../../assets/reviewhub_logo.png'

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
              <p style={{ color: '#6B7280' }}>Join ReviewHub to share your experiences</p>
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
