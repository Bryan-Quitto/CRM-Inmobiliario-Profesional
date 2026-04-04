# CRM Inmobiliario Profesional - Project Skills & Standards (TL)

This file defines the strict technical standards and architectural rules for the project. All agents (including sub-agents) must adhere to these "Inquebrantables" rules.

## Core Stack
- **Backend:** .NET 10 (C#)
- **Frontend:** React 19 (Vite)
- **Styles:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth JWT)
- **ORM:** Entity Framework Core (EF Core)

## Development Workflow & Spec-Driven Development (SDD) Protocol
- **CRITICAL RULE:** SDD is NOT a silver bullet. Agents must evaluate the scope of the task before generating any formal specification.
- **WHEN TO USE SDD (High Complexity):** IF the requirement involves creating a new database entity, bootstrapping a module from scratch, or defining interactions between multiple architectural components -> THEN the agent MUST generate and agree upon a specification document (`spec.md`) before writing any code.
- **WHEN NOT TO USE SDD (Low Complexity / Maintenance):** IF the requirement is fixing a bug, optimizing a query, refactoring an isolated block of code, adjusting UI components, or updating an existing trigger/procedure -> THEN the use of SDD is STRICTLY PROHIBITED. Execute the code changes directly, surgically, and concisely.

## Architectural Standards

### Backend (Vertical Slice Architecture)
- **Rule:** Strict prohibition of MVC, Clean Architecture, or Onion.
- **Organization:** Code must be organized by features in `/Features`.
- **Logic:** Each feature (e.g., `CreateProperty`) must contain its own route, validation, command/query, and data access in the same logical space.

### Frontend (Feature-Sliced Design)
- **Rule:** Organize React code by features in `/src/features/`.
- **Organization:** Avoid global centralization of components, hooks, or services.

### Styling & UI (Tailwind CSS)
- **Rule:** STRICT prohibition of inline styles (`style={{...}}`).
- **Standard:** Use exclusively Tailwind utility classes (`className="..."`).
- **Files:** No separate `.css` files for components. Only use global CSS for Tailwind directives and base variables.

### Code Documentation
- **Rule:** Formal and professional technical comments only.
- **Purpose:** Explain the "why" of complex logic, not the "what" (tutorial-style comments are forbidden).

### Data & Media
- **Rule:** No base64 images in the database.
- **Standard:** Use Object Storage and store only URLs.

### Database & Migrations (Supabase)
- **CRITICAL RULE:** Do NOT use `dotnet ef database update`. It is strictly forbidden to apply migrations directly from the CLI.
- **AI Direct Access:** The AI now has direct interaction capabilities with the Supabase project (via MCP). This power must be used with **EXTREME CAUTION**.
- **Standard:** Generate SQL scripts using `dotnet ef migrations script` and apply them manually in the **Supabase SQL Editor** (unless a surgical SQL fix is explicitly requested and reviewed).
- **Reason:** Ensuring environmental consistency and avoiding connection/permission conflicts with Supabase direct access.

## World-Class Performance & UX Standards
All new features and refactors MUST implement these zero-latency patterns:

### Frontend Velocity (The "Zero Wait" Policy)
- **Ultra-Premium Sync Pattern (UPSP) (Read CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\lib\swr.ts):** 
    - **Disk Persistence:** Implement `localStorageProvider` in SWR to cache metrics and lists permanently across sessions.
    - **Zero Flicker:** Use `keepPreviousData: true` to maintain old data visible while fetching fresh updates.
    - **Smart Feedback:** Show granular "Syncing" indicators (spinners/overlays) only on affected elements to eliminate user uncertainty.
- **Optimistic UI:** Updates to status, stages, or simple fields must reflect in the UI in <100ms. Do not show loaders for simple updates.
- **Undo Pattern:** Destructive actions (like deletions) must be optimistic and reversible. Remove the item immediately and show a "Undo" toast for 5-6 seconds before sending the real request to the server.
- **Satisfy Transitions:** Successful saves must show a clear visual confirmation (e.g., button turning green with a checkmark) for ~800ms before closing modals.
- **Background Operations:** Heavy tasks (file uploads, complex processing) must run in global background queues (e.g., `UploadContext`) to allow continued navigation.

### Backend Optimization & Scalability
- **OutputCaching (.NET 10):** Heavy read endpoints (Analytics, Large Lists) MUST implement `OutputCache` (10-30s).
- **Security Isolation:** Cache MUST vary by authorization token (`VaryByValue` using the `Authorization` header) to ensure data isolation.
- **Query Precision:** Cache MUST vary by all query parameters (`SetVaryByQuery`) to prevent data collisions.
- **Rule:** Minimize database round-trips. Group multiple checks into a single `Select` using EF Core.
- **Rule:** Use `ExecuteUpdateAsync` or `ExecuteDeleteAsync` for direct updates/deletes to bypass object loading whenever possible.

## Agent Behavior
- **Role:** Senior Software Architect and Tech Lead.
- **Guidance:** Prioritize surgical updates, ensure full type safety, and maintain strict consistency with these standards.