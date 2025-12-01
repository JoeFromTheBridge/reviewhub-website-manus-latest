// src/components/DevSeedPage.jsx
import { useState } from 'react'

export default function DevSeedPage() {
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState(null)
  const [products, setProducts] = useState(null)
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState(null)

  const runChecks = async () => {
    setLoading(true)
    setError(null)
    setHealth(null)
    setProducts(null)
    setReviews(null)

    try {
      // 1) Backend health
      const healthRes = await fetch('/api/health')
      const healthJson = await healthRes.json()
      setHealth({
        status: healthRes.status,
        ok: healthRes.ok,
        data: healthJson,
      })

      // 2) Products page 1 (small page size)
      const productsRes = await fetch('/api/products?page=1&per_page=5')
      const productsJson = await productsRes.json()
      setProducts({
        status: productsRes.status,
        ok: productsRes.ok,
        data: productsJson,
      })

      // 3) Latest reviews (small sample)
      const reviewsRes = await fetch(
        '/api/reviews?limit=5&sort=created_at&order=desc'
      )
      const reviewsJson = await reviewsRes.json()
      setReviews({
        status: reviewsRes.status,
        ok: reviewsRes.ok,
        data: reviewsJson,
      })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Dev / Data Check</h1>
      <p className="text-gray-700 mb-6">
        This page pings the live backend to check:
        <br />
        - <strong>/api/health</strong>
        <br />
        - <strong>/api/products</strong> (first page)
        <br />
        - <strong>/api/reviews</strong> (latest few)
      </p>

      <button
        onClick={runChecks}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold disabled:opacity-60"
      >
        {loading ? 'Running checks…' : 'Run checks'}
      </button>

      {error && (
        <div className="mt-6 text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Health */}
      {health && (
        <div className="mt-8 border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Health</h2>
          <p className="mb-1">
            HTTP status:{' '}
            <span className="font-mono">{health.status}</span>{' '}
            {health.ok ? '(OK)' : '(NOT OK)'}
          </p>
          <pre className="mt-2 text-xs bg-white border rounded p-3 overflow-auto">
{JSON.stringify(health.data, null, 2)}
          </pre>
        </div>
      )}

      {/* Products */}
      {products && (
        <div className="mt-8 border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Products sample</h2>
          <p className="mb-1">
            HTTP status:{' '}
            <span className="font-mono">{products.status}</span>{' '}
            {products.ok ? '(OK)' : '(NOT OK)'}
          </p>
          <p className="mb-1">
            Detected products:{' '}
            <span className="font-mono">
              {Array.isArray(products.data?.products)
                ? products.data.products.length
                : 'n/a'}
            </span>
          </p>
          <pre className="mt-2 text-xs bg-white border rounded p-3 overflow-auto">
{JSON.stringify(products.data, null, 2)}
          </pre>
        </div>
      )}

      {/* Reviews */}
      {reviews && (
        <div className="mt-8 border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Reviews sample</h2>
          <p className="mb-1">
            HTTP status:{' '}
            <span className="font-mono">{reviews.status}</span>{' '}
            {reviews.ok ? '(OK)' : '(NOT OK)'}
          </p>
          <p className="mb-1">
            Detected reviews:{' '}
            <span className="font-mono">
              {Array.isArray(reviews.data?.reviews)
                ? reviews.data.reviews.length
                : 'n/a'}
            </span>
          </p>
          <pre className="mt-2 text-xs bg-white border rounded p-3 overflow-auto">
{JSON.stringify(reviews.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
