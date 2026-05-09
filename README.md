# Talos: Unified Autonomous Business Architect

Talos is an autonomous AI agent system designed to manage core business operations across three primary tracks: Knowledge Brain, Comms Agent, and Coding Agent.

## Quick Start (Docker)

To launch the entire platform (Frontend, Backend, Database, and Sandbox):

```bash
docker-compose up --build
```

## Architecture

Talos uses a modular, scalable architecture to ensure security and maintainability:

*   **Frontend:** React (Vite) using **Feature-Sliced Design (FSD)**.
*   **Backend:** FastAPI using **Domain-Driven Design (Feature-Based)**.
*   **Database:** MongoDB for unstructured data and agent memory.
*   **Sandbox:** Isolated Docker sidecar for safe code execution.
*   **LLM Gateway:** LiteLLM for easy switching between models (Gemini, GPT-4, etc.).

## Repository Structure

```text
talos/
├── docker-compose.yml       # Orchestrates all services
├── GEMINI.md                # Repository-wide architectural mandates
├── README.md                # This file
├── frontend/                # React application (FSD)
├── backend/                 # FastAPI application (DDD)
└── sandbox/                 # Isolated Python execution environment
```

## Documentation

*   [Frontend README](./frontend/README.md)
*   [Backend README](./backend/README.md)
*   [Sandbox README](./sandbox/README.md)
