# ReviewHub Backend Testing Guide

## Overview

This guide explains how to run smoke tests and other tests for the ReviewHub backend.

## Smoke Tests

Smoke tests verify that the basic functionality of the application is working. These tests should pass before any deployment.

### What Smoke Tests Cover

- ✅ Health check endpoints
- ✅ Public API endpoints (products, categories, reviews)
- ✅ Authentication flow (register, login)
- ✅ Protected endpoints (require auth)
- ✅ Error handling (404s, invalid data)
- ✅ Rate limiting
- ✅ Data integrity (required fields present)

### Prerequisites

1. **Install test dependencies:**
   ```bash
   cd reviewhub-backend
   pip install -r requirements-dev.txt
   ```

2. **Start the backend server:**
   ```bash
   # In one terminal
   python run_server.py
   ```

   Or use the production server:
   ```bash
   gunicorn app_enhanced:app
   ```

### Running Smoke Tests

#### Option 1: Run all smoke tests

```bash
# Run all smoke tests
pytest test_smoke.py -v

# Run with detailed output
pytest test_smoke.py -v --tb=short

# Run with code coverage
pytest test_smoke.py --cov=. --cov-report=html
```

#### Option 2: Run specific test classes

```bash
# Test only health checks
pytest test_smoke.py::TestHealthChecks -v

# Test only public endpoints
pytest test_smoke.py::TestPublicEndpoints -v

# Test only auth flow
pytest test_smoke.py::TestAuthFlow -v

# Test only error handling
pytest test_smoke.py::TestErrorHandling -v
```

#### Option 3: Run specific test methods

```bash
# Test specific endpoint
pytest test_smoke.py::TestHealthChecks::test_healthz_endpoint -v

# Test product fetching
pytest test_smoke.py::TestPublicEndpoints::test_get_products -v
```

### Testing Against Different Environments

#### Local Development (default)

```bash
pytest test_smoke.py -v
```

#### Staging/Production

Set the `TEST_BASE_URL` environment variable:

```bash
# Test staging environment
TEST_BASE_URL=https://staging.reviewhub.com pytest test_smoke.py -v

# Test production environment (use with caution!)
TEST_BASE_URL=https://api.reviewhub.com pytest test_smoke.py -v
```

### Expected Output

```
============================= test session starts ==============================
collected 18 items

test_smoke.py::TestHealthChecks::test_healthz_endpoint PASSED           [  5%]
test_smoke.py::TestHealthChecks::test_api_health_endpoint PASSED        [ 11%]
test_smoke.py::TestPublicEndpoints::test_get_categories PASSED          [ 16%]
test_smoke.py::TestPublicEndpoints::test_get_products PASSED            [ 22%]
test_smoke.py::TestPublicEndpoints::test_get_reviews PASSED             [ 27%]
test_smoke.py::TestAuthFlow::test_register_missing_fields PASSED        [ 33%]
test_smoke.py::TestAuthFlow::test_register_user PASSED                  [ 38%]
test_smoke.py::TestAuthFlow::test_login_invalid_credentials PASSED      [ 44%]
test_smoke.py::TestProtectedEndpoints::test_create_review_without_auth PASSED [ 50%]
test_smoke.py::TestProtectedEndpoints::test_get_profile_without_auth PASSED [ 55%]
test_smoke.py::TestErrorHandling::test_404_on_invalid_endpoint PASSED   [ 61%]
test_smoke.py::TestErrorHandling::test_invalid_product_id PASSED        [ 66%]
test_smoke.py::TestErrorHandling::test_invalid_review_id PASSED         [ 72%]
test_smoke.py::TestRateLimiting::test_login_rate_limit PASSED           [ 77%]
test_smoke.py::TestDataIntegrity::test_product_has_required_fields PASSED [ 83%]
test_smoke.py::TestDataIntegrity::test_review_has_required_fields PASSED [ 88%]

======================== 18 passed in 2.34s =================================
```

### Troubleshooting

#### Test fails: Connection refused

**Problem:** Cannot connect to backend server

**Solution:**
```bash
# Verify server is running
curl http://localhost:5000/healthz

# Check if port 5000 is in use
lsof -i :5000

# Start the server if not running
python run_server.py
```

#### Test fails: 500 Internal Server Error

**Problem:** Backend configuration error

**Solution:**
1. Check `.env` file has all required variables
2. Check database connection (DATABASE_URL)
3. Check backend logs for error details

#### Test fails: Rate limit tests

**Problem:** Rate limit not triggered

**Solution:** This is OK - it means rate limiting is configured with high thresholds or using memory storage (resets on restart).

### CI/CD Integration

Add smoke tests to your CI/CD pipeline:

#### GitHub Actions Example

```yaml
name: Smoke Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd reviewhub-backend
          pip install -r requirements-dev.txt

      - name: Start backend
        run: |
          cd reviewhub-backend
          python run_server.py &
          sleep 5  # Wait for server to start

      - name: Run smoke tests
        run: |
          cd reviewhub-backend
          pytest test_smoke.py -v
```

### Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All smoke tests pass locally
- [ ] All smoke tests pass against staging environment
- [ ] Database migrations applied successfully
- [ ] Environment variables configured correctly
- [ ] SMTP/email service configured and tested
- [ ] S3/image storage configured and tested (if applicable)

## Additional Testing

### Unit Tests

(To be added in future phases)

```bash
pytest tests/unit/ -v
```

### Integration Tests

(To be added in future phases)

```bash
pytest tests/integration/ -v
```

### Load Tests

(To be added in future phases)

```bash
locust -f tests/load/locustfile.py
```

## Test Coverage

Generate code coverage report:

```bash
# Generate HTML coverage report
pytest test_smoke.py --cov=. --cov-report=html

# Open coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

## Writing New Tests

### Test Structure

```python
class TestFeatureName:
    """Test description"""

    @pytest.fixture
    def test_data(self):
        """Create test data"""
        return {'key': 'value'}

    def test_specific_behavior(self, test_data):
        """Test a specific behavior"""
        # Arrange
        payload = test_data

        # Act
        response = requests.post(f"{API_BASE}/endpoint", json=payload)

        # Assert
        assert response.status_code == 200
        assert 'expected_field' in response.json()
```

### Best Practices

1. **Descriptive test names** - Use clear, descriptive names that explain what is being tested
2. **One assertion per test** - Focus each test on a single behavior
3. **Use fixtures** - Share setup code using pytest fixtures
4. **Test edge cases** - Include tests for error conditions and edge cases
5. **Independent tests** - Tests should not depend on each other
6. **Clean up** - Remove test data after tests complete

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-flask documentation](https://pytest-flask.readthedocs.io/)
- [Testing Flask Applications](https://flask.palletsprojects.com/en/3.0.x/testing/)

---

**Last Updated**: 2026-01-21
**Next Review**: Phase 1 (when adding integration tests)
