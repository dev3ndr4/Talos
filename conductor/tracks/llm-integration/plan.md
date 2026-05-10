# Implementation Plan: LLM Integration and Configuration

## Tasks

- [x] **Task 1: Update Core Configuration**

  - Acceptance: `backend/app/core/config.py` includes `LLM_MODEL` and `GEMINI_API_KEY`.
  - Verify: Inspect file content.
  - Files: `backend/app/core/config.py`

- [x] **Task 2: Update Environment Variables Template**

  - Acceptance: `.env.example` includes `GEMINI_API_KEY` and `LLM_MODEL` with sensible defaults.
  - Verify: Inspect file content.
  - Files: `.env.example`

- [x] **Task 3: Refactor Chat Service LLM Calls**

  - Acceptance: `backend/app/domains/chat/service.py` uses `settings.LLM_MODEL` and `settings.GEMINI_API_KEY`.
  - Verify: `litellm.completion` calls updated.
  - Files: `backend/app/domains/chat/service.py`

- [x] **Task 4: Initialize LLM settings in agents**

  - Acceptance: Ensure agents are ready to use the centralized config when implemented.
  - Verify: Check agent initializers if applicable.
  - Files: `backend/app/domains/knowledge/agent.py`, `backend/app/domains/coding/agent.py`, `backend/app/domains/comms/agent.py`

- [x] **Task 5: Final Validation**
  - Acceptance: Backend starts and can handle a dummy request (if testable).
  - Verify: Run `uvicorn app.main:app` (dry run).
  - Files: N/A
