# Stage 1: Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Use cache mount for pip to speed up repeated builds
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.12-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user with a home directory
RUN groupadd -r talos && useradd -r -m -g talos talos

WORKDIR /app

# Copy only the installed packages from the builder stage
COPY --from=builder /root/.local /home/talos/.local

# Copy application code
COPY . .

# Ensure the app and home directory are owned by the non-root user
RUN chown -R talos:talos /app /home/talos

# Set environment variables
ENV PATH=/home/talos/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

USER talos

EXPOSE $PORT

# Health check using the PORT environment variable
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/ || exit 1

# Start the application on the dynamic PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
