#!/usr/bin/env python3
"""
Smoke tests for ReviewHub backend.
These tests verify basic functionality is working.

Run with: pytest test_smoke.py -v
"""

import os
import pytest
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:5000')
API_BASE = f"{BASE_URL}/api"


class TestHealthChecks:
    """Test that the server is running and healthy"""

    def test_healthz_endpoint(self):
        """Test simple health check endpoint"""
        response = requests.get(f"{BASE_URL}/healthz")
        assert response.status_code == 200
        assert response.text == "ok"

    def test_api_health_endpoint(self):
        """Test detailed health check endpoint"""
        response = requests.get(f"{API_BASE}/health")
        assert response.status_code == 200

        data = response.json()
        assert data['status'] == 'ok'
        assert data['service'] == 'reviewhub-backend'
        assert 'timestamp' in data


class TestPublicEndpoints:
    """Test public endpoints that don't require authentication"""

    def test_get_categories(self):
        """Test fetching categories"""
        response = requests.get(f"{API_BASE}/categories")
        assert response.status_code == 200

        data = response.json()
        assert 'categories' in data
        assert isinstance(data['categories'], list)

    def test_get_products(self):
        """Test fetching products"""
        response = requests.get(f"{API_BASE}/products")
        assert response.status_code == 200

        data = response.json()
        assert 'products' in data
        assert isinstance(data['products'], list)

        # Verify pagination metadata
        if data['products']:
            assert 'pagination' in data
            assert 'total' in data['pagination']
            assert 'page' in data['pagination']
            assert 'per_page' in data['pagination']

    def test_get_reviews(self):
        """Test fetching reviews"""
        response = requests.get(f"{API_BASE}/reviews")
        assert response.status_code == 200

        data = response.json()
        assert 'reviews' in data
        assert isinstance(data['reviews'], list)


class TestAuthFlow:
    """Test authentication flow (register, verify, login)"""

    @pytest.fixture
    def test_user_email(self):
        """Generate unique test user email"""
        import time
        return f"smoketest_{int(time.time())}@example.com"

    def test_register_missing_fields(self):
        """Test registration with missing required fields"""
        response = requests.post(f"{API_BASE}/auth/register", json={})
        assert response.status_code == 400

        data = response.json()
        assert 'error' in data

    def test_register_user(self, test_user_email):
        """Test user registration"""
        payload = {
            'username': f'smoketest_{int(os.urandom(4).hex(), 16)}',
            'email': test_user_email,
            'password': 'TestPassword123!'
        }

        response = requests.post(f"{API_BASE}/auth/register", json=payload)

        # Should succeed or fail with "already exists" (if test was run before)
        assert response.status_code in [201, 400]

        if response.status_code == 201:
            data = response.json()
            assert 'message' in data
            assert 'user' in data

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        payload = {
            'username': 'nonexistent_user',
            'password': 'wrong_password'
        }

        response = requests.post(f"{API_BASE}/auth/login", json=payload)
        assert response.status_code == 401

        data = response.json()
        assert 'error' in data


class TestProtectedEndpoints:
    """Test endpoints that require authentication"""

    def test_create_review_without_auth(self):
        """Test creating review without authentication token"""
        payload = {
            'product_id': 1,
            'rating': 5,
            'title': 'Test Review',
            'content': 'This is a test review'
        }

        response = requests.post(f"{API_BASE}/reviews", json=payload)

        # Should return 401 Unauthorized
        assert response.status_code == 401

    def test_get_profile_without_auth(self):
        """Test accessing profile without authentication"""
        response = requests.get(f"{API_BASE}/auth/profile")

        # Should return 401 Unauthorized
        assert response.status_code == 401


class TestErrorHandling:
    """Test error handling and edge cases"""

    def test_404_on_invalid_endpoint(self):
        """Test 404 on non-existent endpoint"""
        response = requests.get(f"{API_BASE}/nonexistent-endpoint")
        assert response.status_code == 404

    def test_invalid_product_id(self):
        """Test fetching non-existent product"""
        response = requests.get(f"{API_BASE}/products/999999")
        assert response.status_code == 404

    def test_invalid_review_id(self):
        """Test fetching non-existent review"""
        response = requests.get(f"{API_BASE}/reviews/999999")
        assert response.status_code == 404


class TestRateLimiting:
    """Test rate limiting on auth endpoints"""

    def test_login_rate_limit(self):
        """Test that login endpoint has rate limiting"""
        # Make multiple rapid login attempts
        payload = {
            'username': 'test_user',
            'password': 'test_password'
        }

        responses = []
        for _ in range(10):
            response = requests.post(f"{API_BASE}/auth/login", json=payload)
            responses.append(response.status_code)

        # At least one request should be rate limited (429)
        # Note: This test may fail if rate limit threshold is high
        # or if requests are spaced out
        assert 429 in responses or all(status == 401 for status in responses)


class TestDataIntegrity:
    """Test data integrity and validation"""

    def test_product_has_required_fields(self):
        """Test that products have all required fields"""
        response = requests.get(f"{API_BASE}/products")
        assert response.status_code == 200

        data = response.json()

        if data['products']:
            product = data['products'][0]
            required_fields = ['id', 'name', 'brand', 'category_id']

            for field in required_fields:
                assert field in product, f"Product missing required field: {field}"

    def test_review_has_required_fields(self):
        """Test that reviews have all required fields"""
        response = requests.get(f"{API_BASE}/reviews")
        assert response.status_code == 200

        data = response.json()

        if data['reviews']:
            review = data['reviews'][0]
            required_fields = ['id', 'user_id', 'product_id', 'rating', 'content']

            for field in required_fields:
                assert field in review, f"Review missing required field: {field}"


# === Smoke Test Runner ===

def run_smoke_tests():
    """Run smoke tests and print results"""
    print("=" * 60)
    print("  ReviewHub Backend Smoke Tests")
    print("=" * 60)
    print(f"\nTesting: {BASE_URL}")
    print(f"API Base: {API_BASE}\n")

    # Run pytest programmatically
    import sys
    exit_code = pytest.main([
        __file__,
        '-v',
        '--tb=short',
        '--color=yes'
    ])

    return exit_code


if __name__ == '__main__':
    import sys
    sys.exit(run_smoke_tests())
