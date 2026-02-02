// reviewhub/src/components/Footer.jsx
import { Link } from 'react-router-dom'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: '#263458',
        borderTopColor: 'rgba(0,0,0,0.05)'
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-6 lg:py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Brand Column - full width on mobile */}
          <div className="col-span-2 md:col-span-1 mb-2 md:mb-0">
            <h3
              className="font-semibold text-sm md:text-base mb-1 md:mb-2"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              ReviewHub
            </h3>
            <p
              className="text-xs md:text-sm"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Community-driven product reviews.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className="font-medium mb-2 md:mb-3 text-xs md:text-sm"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              Quick Links
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link
                  to="/search?tab=products"
                  className="hover:underline transition-colors"
                  style={{ color: '#B9C7F3' }}
                  onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.target.style.color = '#B9C7F3'}
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  to="/search?tab=reviews"
                  className="hover:underline transition-colors"
                  style={{ color: '#B9C7F3' }}
                  onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.target.style.color = '#B9C7F3'}
                >
                  Read Reviews
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:underline transition-colors"
                  style={{ color: '#B9C7F3' }}
                  onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.target.style.color = '#B9C7F3'}
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4
              className="font-medium mb-2 md:mb-3 text-xs md:text-sm"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              Legal
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="hover:underline transition-colors"
                  style={{ color: '#B9C7F3' }}
                  onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.target.style.color = '#B9C7F3'}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:underline transition-colors"
                  style={{ color: '#B9C7F3' }}
                  onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.target.style.color = '#B9C7F3'}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@thereviewhub.ca"
                  className="hover:underline transition-colors"
                  style={{ color: '#B9C7F3' }}
                  onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.target.style.color = '#B9C7F3'}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div
          className="mt-4 md:mt-6 pt-4 md:pt-6 text-center text-[10px] md:text-xs"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.55)'
          }}
        >
          <p>&copy; {currentYear} ReviewHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
