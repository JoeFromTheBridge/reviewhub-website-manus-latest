#!/usr/bin/env python3
"""
Simple server runner for ReviewHub backend testing.
Uses app_enhanced.py to match production environment.
"""

import os
import sys
from app_enhanced import app

if __name__ == '__main__':
    # Set environment variables for development
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_DEBUG'] = '1'
    
    print("Starting ReviewHub Backend Server (Enhanced)...")
    print("Server will be available at: http://localhost:5000")
    print("\nKey API endpoints:")
    print("  - Health check: GET /api/health, GET /healthz")
    print("  - Auth: POST /api/auth/register, /api/auth/login, /api/auth/verify-email")
    print("  - Products: GET /api/products")
    print("  - Categories: GET /api/categories")
    print("  - Reviews: GET /api/reviews, POST /api/reviews")
    print("  - Admin: /api/admin/* (requires admin privileges)")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)

