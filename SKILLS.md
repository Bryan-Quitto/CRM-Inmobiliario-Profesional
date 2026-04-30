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
- **Interactive Elements (Cursors):** ALL interactive elements (buttons, custom dropdowns, clickable pills, etc.) MUST explicitly include the `cursor-pointer` utility class to prevent UX ambiguity.

### Code Documentation
- **Rule:** Formal and professional technical comments only.
- **Purpose:** Explain the "why" of complex logic, not the "what" (tutorial-style comments are forbidden).

### Data & Media
- **Rule:** No base64 images in the database.
- **Standard:** Use Object Storage and store only URLs.

### Database & Migrations (Supabase)
- **Rule:** Use `dotnet ef database update` to apply migrations.
- **AI Direct Access:** The AI now has direct interaction capabilities with the Supabase project (via MCP).
- **Standard:** Migrations should be managed through EF Core CLI. Ensure `GssEncryptionMode=Disable;` is present in the `DATABASE_URL` within the `.env` file to avoid connection issues.
- **Reason:** Ensuring environmental consistency and allowing automated schema updates.

### CLI Execution Constraints & Scripting
- **Rule:** The underlying CLI execution environment on Windows uses older PowerShell. It strictly BLOCKS command substitution, sub-shells (`$(...)`), complex piping (`|`), and command chaining (`&&`).
- **Constraint:** DO NOT chain commands using `&&`. Execute every command as a separate, sequential step.
- **Standard:** For simple file operations, use basic commands one by one.
- **Standard:** For complex repository analysis, write a temporary Node.js script (e.g., `temp.js`), execute it (`node temp.js`), read the output, and then delete it (`rm temp.js`) IN SEPARATE EXECUTION STEPS.

### World-Class Performance & UX Standards
All new features and refactors MUST implement these zero-latency patterns:

### Temporal & Geographic Standards (Ecuador UTC-5)
- **Rule:** The system MUST operate under Ecuador's timezone (UTC-5) for all business logic, regardless of server or database (Supabase) location.
- **Handling:** When calculating boundaries like "Today", "Current Month", or "Weekly Groupings", always use `.ToOffset(TimeSpan.FromHours(-5))` before applying date logic.
- **Consistency:** Background services (Warming) and API Endpoints MUST use the same offset to ensure cache consistency and prevent data jumping between days due to UTC-0 mismatches.
- **Reason:** Users in Ecuador must see their data reflected according to their local calendar, especially during late-night operations where UTC-0 is already the next day.

### Frontend Velocity (The "Zero Wait" Policy)

- **Ultra-Premium Sync Pattern (UPSP) (Read CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\lib\swr.ts):** 
    - **Disk Persistence:** Implement `localStorageProvider` in SWR to cache metrics and lists permanently across sessions.
    - **Zero Flicker:** Use `keepPreviousData: true` to maintain old data visible while fetching fresh updates.
    - **Axios standard:** NEVER use `import axios from 'axios'` or default imports for API calls. ALWAYS use `import { api } from '@/lib/axios'` to ensure JWT injection and interceptors are active.
    - **Smart Feedback:** Show granular "Syncing" indicators (spinners/overlays) only on affected elements to eliminate user uncertainty.- **Optimistic UI:** Updates to status, stages, or simple fields must reflect in the UI in <100ms. Do not show loaders for simple updates.
- **Undo Pattern:** Destructive actions (like deletions) must be optimistic and reversible. Remove the item immediately and show a "Undo" toast for 5-6 seconds before sending the real request to the server.
- **Satisfy Transitions:** Successful saves must show a clear visual confirmation (e.g., button turning green with a checkmark) for ~800ms before closing modals.
- **Background Operations:** Heavy tasks (file uploads, complex processing) must run in global background queues (e.g., `UploadContext`) to allow continued navigation.

### Backend Optimization & Scalability
- **The One Trip Pattern:** Debido a la latencia de red (~1.3s por round-trip con bases de datos remotas), queda ESTRICTAMENTE PROHIBIDO realizar múltiples consultas `await` secuenciales en endpoints de lectura pesados (Dashboard, Analítica, Reportes). Se debe consolidar toda la información en una única proyección LINQ (`.Select(...)`) para que el servidor SQL procese todo en un solo viaje. El procesamiento de datos crudos (agrupaciones por fecha, formateo) debe hacerse en memoria en el servidor C# tras el "único viaje".
- **Stable Cache Keys:** Los parámetros de fecha enviados desde el cliente (`clientDate`, `inicio`, `fin`) deben redondearse al minuto en el frontend para asegurar que la `OutputCache` sea efectiva y no varíe por milisegundos irrelevantes.
- **OutputCaching (.NET 10):** Heavy read endpoints (Analytics, Large Lists) MUST implement `OutputCache` (10-30s).
- **Security Isolation:** Cache MUST vary by authorization token (`VaryByValue` using the `Authorization` header) to ensure data isolation.
- **Query Precision:** Cache MUST vary by all query parameters (`SetVaryByQuery`) para prevenir colisiones de datos.
- **Rule:** Minimize database round-trips. Group multiple checks into a single `Select` using EF Core.
- **Rule:** Use `ExecuteUpdateAsync` or `ExecuteDeleteAsync` for direct updates/deletes to bypass object loading whenever possible.
- **Database Connections (.NET + Supabase):** The CRM is a .NET Core WebAPI (a stateful daemon), NOT a serverless architecture. Therefore, it MUST bypass the Supabase transaction pooler (port `6543`) and connect DIRECTLY to the PostgreSQL instance on native port `5432`. DO NOT set `Pooling=false`. You MUST use Npgsql's internal pooling (`Pooling=true;Keepalive=1;`) to keep TCP/TLS channels warm and slash latency drops by over 80%.

## Agent Behavior
- **Role:** Senior Software Architect and Tech Lead.
- **Guidance:** Prioritize surgical updates, ensure full type safety, and maintain strict consistency with these standards.