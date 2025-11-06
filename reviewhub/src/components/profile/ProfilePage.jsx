// src/components/profile/ProfilePage.jsx
import { useState } from 'react'
import { UserProfile } from './UserProfile'
import { MyReviews } from './MyReviews'
import UserAnalyticsPage from './UserAnalyticsPage'

const TABS = {
  PROFILE: 'profile',
  REVIEWS: 'reviews',
  ANALYTICS: 'analytics',
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState(TABS.PROFILE)

  const renderContent = () => {
    switch (activeTab) {
      case TABS.REVIEWS:
        return <MyReviews />
      case TABS.ANALYTICS:
        return <UserAnalyticsPage />
      case TABS.PROFILE:
      default:
        return <UserProfile />
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account details, track your reviews, and view your activity.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Profile sections">
          <button
            type="button"
            onClick={() => setActiveTab(TABS.PROFILE)}
            className={`whitespace-nowrap pb-2 text-sm font-medium border-b-2 ${
              activeTab === TABS.PROFILE
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(TABS.REVIEWS)}
            className={`whitespace-nowrap pb-2 text-sm font-medium border-b-2 ${
              activeTab === TABS.REVIEWS
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Reviews
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(TABS.ANALYTICS)}
            className={`whitespace-nowrap pb-2 text-sm font-medium border-b-2 ${
              activeTab === TABS.ANALYTICS
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  )
}
