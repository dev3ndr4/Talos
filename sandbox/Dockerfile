FROM python:3.12-slim

# Create a non-root user for execution
RUN groupadd -r sandbox && useradd -r -g sandbox sandbox

WORKDIR /workspace

# Install common data science/processing libraries
RUN pip install --no-cache-dir \
    pandas \
    numpy \
    requests \
    matplotlib \
    openpyxl

# Change ownership to the non-root user
RUN chown -R sandbox:sandbox /workspace

USER sandbox

# Keep the container alive
CMD ["tail", "-f", "/dev/null"]
