# Talos Frontend

React (Vite) dashboard for the Talos Unified Autonomous Business Architect.

## Architecture: Feature-Sliced Design (FSD)

The frontend follows the FSD methodology to ensure strict separation of concerns and scalability across multiple agent UIs.

### Layers

- `src/app/`: Global setup (Routing, Providers, Global Styles).
- `src/pages/`: Flat list of application pages (Dashboard, Knowledge, Comms, Coding).
- `src/widgets/`: Composed UI blocks (e.g., Sidebar, TopBar, AgentCard).
- `src/features/`: Interactive user actions (e.g., `TriggerSearch`, `ApproveDraft`).
- `src/entities/`: Domain-specific business logic and models (e.g., `Agent`, `Memory`).
- `src/shared/`: Reusable UI primitives (icons, buttons), API clients, and hooks.

## Design Constraints

- **Theme:** Soft/Brand Focused (approachable).
- **Navigation:** Sidebar-based.
- **Icons:** Lucide icons (No emojis).
- **Tech Stack:** React, TypeScript, Tailwind CSS, Radix UI (shadcn/ui).
