# Talos Backend

FastAPI orchestrator for the Talos Unified Autonomous Business Architect.

## Architecture: Domain-Driven Design (Feature-Based)

The backend is organized into "domains," each representing a core functional track of the business architect. This ensures that the Knowledge, Comms, and Coding logic remain decoupled and maintainable.

### Structure

- `app/core/`: Global infrastructure (DB clients, LLM configuration via LiteLLM).
- `app/shared/`: Cross-cutting concerns, shared Pydantic schemas, and common utilities.
- `app/domains/`:
  - `knowledge/`: RAG logic, MongoDB ingestion, and "Self-Healing" background tasks.
  - `comms/`: Inbox triage, high-context drafting, and tool routing.
  - `coding/`: Autonomous code generation and sandbox execution management.

## Setup & Development

The backend is intended to run within Docker as part of the root `docker-compose.yml`.

### Key Dependencies

- **FastAPI:** High-performance web framework.
- **LiteLLM:** Universal LLM interface for easy provider switching.
- **Motor:** Asynchronous MongoDB driver.
- **Pydantic:** Data validation and settings management.
