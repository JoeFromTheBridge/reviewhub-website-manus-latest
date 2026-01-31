// reviewhub/src/components/Footer.jsx
import { Link } from 'react-router-dom'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">ReviewHub</h3>
            <p className="text-sm text-gray-400">
              Helping you make smarter purchase decisions with authentic reviews from real customers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/search?tab=products" className="hover:text-white transition-colors">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link to="/search?tab=reviews" className="hover:text-white transition-colors">
                  Read Reviews
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About ReviewHub
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="mailto:support@thereviewhub.ca" className="hover:text-white transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} ReviewHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
