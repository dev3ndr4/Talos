FROM python:3.12-slim

WORKDIR /workspace

# Install common data science/processing libraries for the coding agent
RUN pip install --no-cache-dir \
    pandas \
    numpy \
    requests \
    matplotlib \
    openpyxl

# Set an entrypoint that keeps the container alive (e.g., a simple API or a sleep loop)
# For this prototype, we will use a simple sleep loop, 
# though a small execution server (like a micro-FastAPI) is recommended for production.
CMD ["tail", "-f", "/dev/null"]
