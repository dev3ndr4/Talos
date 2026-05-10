# Spec: Maintenance Infrastructure (Linting, Formatting, and Git Hooks)

## Objective

Establish a unified maintenance workflow to ensure code quality, consistency, and early detection of syntax errors across both Python (backend) and TypeScript (frontend) domains.

## Tech Stack

- **Framework:** `pre-commit`
- **Backend (Python):** `ruff` (Linter & Formatter)
- **Frontend (TS/JS):** `eslint`, `prettier`
- **Automation:** Git pre-commit hooks

## Commands

### Root

- **Install Hooks:** `pre-commit install`
- **Run All Checks:** `pre-commit run --all-files`

### Backend

- **Lint & Format:** `ruff check . --fix && ruff format .`

### Frontend

- **Lint:** `npm run lint`
- **Format:** `npx prettier --write .`

## Project Structure

```
/ (Root)
├── .pre-commit-config.yaml    # Global hook configuration
├── backend/
│   ├── pyproject.toml        # Ruff configuration
│   └── ...
└── frontend/
    ├── .eslintrc.json        # ESLint configuration
    ├── .prettierrc           # Prettier configuration
    └── ...
```

## Code Style

### Python (Ruff)

- Line length: 100
- Target version: Python 3.12
- Rules: Standard `E`, `F`, `I` (isort), `B` (flake8-bugbear).

### TypeScript (ESLint + Prettier)

- Semi: true
- Single Quote: true
- Tab Width: 2
- Trailing Comma: es5

## Testing Strategy

- Pre-commit hooks will run on every `git commit`.
- CI (future) will run these same checks to enforce standards on PRs.

## Boundaries

- **Always do:** Run `pre-commit install` after cloning.
- **Ask first:** Adding new linter rules that cause massive diffs.
- **Never do:** Bypass hooks with `--no-verify` unless in extreme emergencies.

## Success Criteria

- [ ] `pre-commit` is configured and installed.
- [ ] `ruff` correctly identifies and fixes issues in `backend`.
- [ ] `eslint` and `prettier` correctly handle `frontend` files.
- [ ] Attempting to commit code with syntax errors or formatting issues fails and provides clear feedback.
