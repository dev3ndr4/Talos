# Stage 1: Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r talos && useradd -r -m -g talos talos
WORKDIR /app
COPY --from=builder /root/.local /home/talos/.local
COPY . .
RUN chown -R talos:talos /app /home/talos

ENV PATH=/home/talos/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

USER talos
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:$PORT/ || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
