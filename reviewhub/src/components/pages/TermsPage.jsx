// reviewhub/src/components/pages/TermsPage.jsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue to-soft-lavender">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sleek p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-text-secondary mb-8">
            Last updated: January 2026
          </p>

          <div className="prose prose-lg max-w-none text-text-secondary">
            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing or using ReviewHub, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">2. User Accounts</h2>
            <p className="mb-6">
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must provide accurate
              information when creating an account.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">3. User Content</h2>
            <p className="mb-6">
              When you submit reviews, comments, or other content to ReviewHub, you grant us
              a non-exclusive, worldwide, royalty-free license to use, display, and distribute
              that content on our platform. You represent that you own or have the right to
              submit any content you post.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">4. Prohibited Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Post false, misleading, or fraudulent reviews</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to circumvent our security measures</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">5. Disclaimer</h2>
            <p className="mb-6">
              ReviewHub is provided "as is" without warranties of any kind. We do not guarantee
              the accuracy of user-submitted reviews or product information. Users should
              exercise their own judgment when making purchasing decisions.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">6. Contact</h2>
            <p className="mb-6">
              For questions about these Terms of Service, please contact us at{' '}
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

export default TermsPage
