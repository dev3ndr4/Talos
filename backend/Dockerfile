# Stage 1: Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies to a local directory
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.12-slim

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

USER talos

EXPOSE 8000

# Start the application without --reload for production security and speed
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
