# Use a more robust single-stage build for the runtime to ensure dependencies are correctly placed
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root user
RUN groupadd -r talos && useradd -r -m -g talos talos

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure permissions are correct
RUN chown -R talos:talos /app

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV PATH="/home/talos/.local/bin:${PATH}"

USER talos
EXPOSE $PORT

# Robust healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://127.0.0.1:8000/health || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT --log-level debug"]
