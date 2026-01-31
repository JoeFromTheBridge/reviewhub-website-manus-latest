// reviewhub/src/components/pages/AboutPage.jsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue to-soft-lavender">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sleek p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary mb-6">
            About ReviewHub
          </h1>

          <div className="prose prose-lg max-w-none text-text-secondary">
            <p className="mb-6">
              ReviewHub is a product review platform dedicated to helping consumers make smarter
              purchasing decisions. We believe that authentic, honest reviews from real customers
              are invaluable when shopping for products.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Our Mission</h2>
            <p className="mb-6">
              Our mission is to create a trusted community where shoppers can share their genuine
              experiences and help others avoid costly mistakes. We're committed to maintaining
              the integrity of reviews and providing a platform free from fake or incentivized feedback.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">What We Offer</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Authentic reviews from verified purchasers</li>
              <li>Comprehensive product information and comparisons</li>
              <li>Easy-to-use search and filtering tools</li>
              <li>A community of helpful reviewers</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Join Our Community</h2>
            <p className="mb-6">
              Whether you're looking to read reviews before making a purchase or want to share
              your own experiences to help others, ReviewHub welcomes you. Together, we can
              create a more informed shopping experience for everyone.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link to="/search?tab=products">
              <Button className="bg-accent-blue text-white hover:bg-accent-blue/90 rounded-md px-6">
                Browse Products
              </Button>
            </Link>
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

export default AboutPage
