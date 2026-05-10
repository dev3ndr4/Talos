# Spec: LLM Integration and Configuration

## Objective

Centralize and standardize LLM integration to support Google AI Studio's Gemini 1.5 models. This ensures the backend is flexible, follows project standards for 'Glass Box' reasoning, and is easily configurable via environment variables.

## Tech Stack

- **Backend Framework:** FastAPI
- **LLM Client:** LiteLLM
- **Configuration:** Pydantic Settings
- **Models:** Google Gemini 1.5 Pro/Flash

## Commands

- **Install Dependencies:** `pip install -r backend/requirements.txt`
- **Run Backend:** `uvicorn app.main:app --reload` (from `backend` directory)
- **Lint:** `flake8 app`

## Project Structure

- `backend/app/core/config.py`: Updated to include LLM settings.
- `backend/app/domains/chat/service.py`: Updated to use centralized LLM settings.
- `backend/app/domains/knowledge/agent.py`: (And other agents) Updated to use centralized LLM settings.

## Code Style

### Centralized Config Example

```python
class Settings(BaseSettings):
    # ... existing settings
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini/gemma-4-31b-it")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
```

### Usage Example

```python
import litellm
from app.core.config import settings

response = litellm.completion(
    model=settings.LLM_MODEL,
    messages=messages,
    api_key=settings.GEMINI_API_KEY
)
```

## Testing Strategy

- **Unit Tests:** Mock `litellm.completion` to verify that the correct model and API key are passed from settings.
- **Integration Tests:** Verify that changing `.env` variables correctly updates the backend behavior (can be tested manually or with a small script).

## Boundaries

- **Always do:** Use `settings.LLM_MODEL` and `settings.GEMINI_API_KEY`.
- **Ask first:** Changing the LLM provider (e.g., switching from Google to OpenAI).
- **Never do:** Hardcode API keys or model names in domain services or agents.

## Success Criteria

- [ ] `backend/app/core/config.py` contains `LLM_MODEL` and `GEMINI_API_KEY`.
- [ ] All `litellm.completion` calls in `backend/app/domains/chat/service.py` use the centralized configuration.
- [ ] The `.env.example` is updated to reflect the new expected environment variables.
- [ ] Backend starts without errors when these environment variables are provided.

## Open Questions

- Should we support multiple model fallbacks? (Start with single model for simplicity).
- Do we need specialized prompts for Gemini 1.5 Pro vs Flash? (Current prompts seem generic enough).
