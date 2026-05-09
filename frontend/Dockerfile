# Stage 1: Build stage
FROM node:20-slim AS builder

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

# Install dependencies first for better caching
# Use cache mount for npm
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Runtime stage (Nginx)
FROM nginx:alpine

# Install envsubst for template processing
RUN apk add --no-cache gettext

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the nginx template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default port
ENV PORT=80

EXPOSE $PORT

# Health check using the PORT environment variable
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:$PORT/ || exit 1

# Start nginx with template processing (built-in in official nginx alpine image)
CMD ["nginx", "-g", "daemon off;"]
