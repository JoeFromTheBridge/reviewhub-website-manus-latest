# reviewhub-backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install deps
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Make sure FLASK_APP resolves
ENV FLASK_APP=app_enhanced.py

# Expose (Render will pass $PORT at runtime)
EXPOSE 5000

# Start: run migrations, then start Gunicorn
CMD flask db upgrade && \
    gunicorn -w 2 -k gthread -b 0.0.0.0:${PORT:-5000} app_enhanced:app
