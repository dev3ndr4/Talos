# Stage 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first - THIS IS CACHED unless package.json changes
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Move build args here - Changing VITE_API_URL now only invalidates the build step, not npm ci
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Run build - Skip tsc if you want maximum speed, but keeping it for safety. 
# You can change this to "vite build" for extreme speed.
RUN npm run build

# Stage 2: Runtime stage (Nginx)
FROM nginx:alpine

RUN apk add --no-cache gettext

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=80
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:$PORT/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
