# Talos Design System

## Vision

Talos is a high-performance, multi-agent platform designed for developers and knowledge workers. The design language emphasizes **clarity**, **transparency**, and **intentionality**. It moves away from the "black box" chat experience toward a "glass box" workflow where agent reasoning and actions are visible and controllable.

---

## Visual Foundations

### 1. Color Palette (Strictly Variable-Driven)

All colors are defined as CSS variables. Use semantic CSS classes and variables. Never use hardcoded hex values in components.

| Token             | Hex       | Usage                                                      |
| :---------------- | :-------- | :--------------------------------------------------------- |
| **Primary**       | `#10A37F` | Core brand color, primary actions.                         |
| **Primary-Hover** | `#0B6E58` | Hover and active states for primary actions.               |
| **Accent**        | `#FFB86B` | Sparingly used for contrast, notifications, or highlights. |
| **BG-Base**       | `#F4F8F7` | Main application background.                               |
| **BG-Soft**       | `#D9F5EE` | Secondary backgrounds, sidebar regions.                    |
| **Surface**       | `#FFFFFF` | Card backgrounds, modals, input areas.                     |
| **Text-Strong**   | `#253238` | Headings, main body text.                                  |
| **Text-Subtle**   | `--`      | Derived from text-strong with lower opacity.               |
| **Error**         | `#EF4444` | Destructive actions, system errors.                        |

### 2. Typography

- **Primary Font:** `Inter` (Sans-serif) - used for all UI elements and body text.
- **Code Font:** `JetBrains Mono` or `Geist Mono` - used for snippets, traces, and file paths.

### 3. Shape & Elevation

- **Border Radius:** `8px` (Standard), `12px` (Large/Containers).
- **Shadows:** Minimal. Use `1px` borders for separation; use depth only for floating elements (modals, popovers).

### 4. Custom CSS Standards

- **Centralized:** All styles reside in `src/index.css` or scoped module CSS files.
- **Semantic Naming:** Use descriptive class names (e.g., `.sidebar-container`, `.chat-message-bubble`) instead of utility-first classes.
- **Maintainable:** Avoid deep nesting and use CSS variables for consistent spacing and styling.

---

## Layout Architecture (FSD Alignment)

### 1. The Global Frame (`app`)

- **Navigation Rail:** Slim sidebar for high-level domain switching (Knowledge, Comms, Coding).
- **Status Bar:** Bottom bar showing system health, active agent counts, and token usage.

### 2. The Workspace (`pages` / `widgets`)

- **Main Stage:** The primary content area (e.g., File Editor, Knowledge Graph, Comms Dashboard).
- **Agent Panel:** A persistent right-hand sidebar for interaction with the domain-specific agent.
- **Collapsible Regions:** All panels should be collapsible to allow for "Deep Work" mode.

---

## AI Interaction Patterns

### 1. The "Glass Box" Trace

Agents must never just "respond." They must show their work:

- **Reasoning Blocks:** Collapsed by default. Shows a simplified version of the agent's "chain of thought."
- **Tool Call Pills:** Inline indicators showing tool name, status (spinning/check/x), and execution time.
- **Memory Context:** A visual indicator of which files or documents are currently "in focus."

### 2. Human-in-the-Loop (HITL)

- **Review Mode:** For any tool marked as `critical` (e.g., `git_commit`, `delete_file`), the agent pauses and presents the proposed change for approval.
- **Plan Preview:** Before executing a multi-step task, the agent presents an ordered checklist of intended actions.

### 3. Feedback & Latency

- **Status Streaming:** Instead of a generic "Agent is typing...", show specific actions (e.g., `Searching documentation...`, `Synthesizing code...`).
- **Progress Bars:** For long-running background tasks (e.g., repo indexing).

---

## Component Standards

### 1. Icons

- **Source:** Lucide React.
- **Style:** `stroke-width={1.5}` for a light, airy feel.
- **Constraint:** No emojis in the UI. Use semantic icons only.

### 2. Buttons

- **Primary:** Solid brand color.
- **Secondary:** Ghost/Outline with brand color text.
- **Danger:** Subtle red background on hover, never solid red unless for destructive actions.

### 3. Empty States

- Every screen must have a "Welcome" or "Empty" state with clear CTA (e.g., "Ask a question to start the Coding Agent").

---

## Accessibility

- **Contrast:** Maintain WCAG AA compliance (4.5:1 ratio).
- **Keyboard:** All actions must be reachable via `Tab` and triggered via `Enter/Space`.
- **Focus States:** High-visibility focus rings (Primary color, 2px offset).

---

## Domain-Specific Accents

- **Coding Agent:** Focus on "Diff" views, syntax highlighting, and terminal output.
- **Comms Agent:** Focus on threading, presence indicators, and notification priority.
- **Knowledge Agent:** Focus on citations, source links, and hierarchical nesting.
