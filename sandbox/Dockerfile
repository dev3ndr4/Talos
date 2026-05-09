FROM python:3.12-slim

RUN groupadd -r sandbox && useradd -r -g sandbox sandbox
WORKDIR /workspace

# Use --no-cache-dir for sandbox dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN chown -R sandbox:sandbox /workspace
USER sandbox
CMD ["tail", "-f", "/dev/null"]
