# Consolidated Multi-Stage Dockerfile for Talos
# Targets: backend, frontend, sandbox

# --- BACKEND STAGE ---
FROM python:3.12-slim AS backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root user
RUN groupadd -r talos && useradd -r -m -g talos talos

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

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


# --- FRONTEND BUILDER STAGE ---
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Install dependencies first
COPY frontend/package.json frontend/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Copy source code
COPY frontend/ .

# Build args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Run build
RUN npm run build


# --- FRONTEND RUNTIME STAGE ---
FROM nginx:alpine AS frontend

RUN apk add --no-cache gettext

RUN rm -rf /usr/share/nginx/html/*
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=80
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:$PORT/ || exit 1

CMD ["nginx", "-g", "daemon off;"]


# --- SANDBOX STAGE ---
FROM python:3.12-slim AS sandbox

RUN groupadd -r sandbox && useradd -r -g sandbox sandbox
WORKDIR /workspace

# Use --no-cache-dir for sandbox dependencies
COPY sandbox/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy workspace content
COPY sandbox/ .

RUN chown -R sandbox:sandbox /workspace
USER sandbox
CMD ["tail", "-f", "/dev/null"]
