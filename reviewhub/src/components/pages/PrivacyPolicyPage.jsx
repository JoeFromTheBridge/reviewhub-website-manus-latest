// reviewhub/src/components/pages/PrivacyPolicyPage.jsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue to-soft-lavender">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sleek p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-text-secondary mb-8">
            Last updated: January 2026
          </p>

          <div className="prose prose-lg max-w-none text-text-secondary">
            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect information you provide directly, including:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Account information (email, username, password)</li>
              <li>Profile information you choose to add</li>
              <li>Reviews and comments you submit</li>
              <li>Communications with our support team</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Provide and improve our services</li>
              <li>Display your reviews and profile to other users</li>
              <li>Send important service notifications</li>
              <li>Respond to your support requests</li>
              <li>Detect and prevent fraudulent activity</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">3. Information Sharing</h2>
            <p className="mb-6">
              We do not sell your personal information. We may share information with service
              providers who help us operate our platform, or when required by law. Your public
              reviews and profile information are visible to other users.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">4. Data Security</h2>
            <p className="mb-6">
              We implement appropriate security measures to protect your information. However,
              no method of transmission over the internet is completely secure, and we cannot
              guarantee absolute security.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">5. Your Rights</h2>
            <p className="mb-6">
              You may access, update, or delete your account information at any time through
              your profile settings. If you wish to delete your account entirely, please
              contact our support team.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">6. Cookies</h2>
            <p className="mb-6">
              We use cookies and similar technologies to maintain your session and improve
              your experience. You can control cookie settings through your browser.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">7. Contact Us</h2>
            <p className="mb-6">
              For questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@thereviewhub.ca" className="text-accent-blue hover:underline">
                support@thereviewhub.ca
              </a>
            </p>
          </div>

          <div className="mt-8">
            <Link to="/">
              <Button variant="outline" className="border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white rounded-md px-6">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
