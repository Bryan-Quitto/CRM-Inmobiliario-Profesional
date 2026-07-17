# Ziel Luxora CRM | CRM Inmobiliario Profesional - Project Skills & Standards (TL)

This file defines the strict technical standards and architectural rules for the project. All agents (including sub-agents) must adhere to these "Inquebrantables" rules.

## Core Stack
- **Backend:** .NET 10 (C#)
- **Frontend:** React 19 (Vite)
- **Styles:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth JWT with JWKS)
- **ORM:** Entity Framework Core (EF Core)

## Development Workflow & Spec-Driven Development (SDD) Protocol
- **CRITICAL RULE:** SDD is NOT a silver bullet. Agents must evaluate the scope of the task before generating any formal specification.
- **WHEN TO USE SDD (High Complexity):** IF the requirement involves creating a new database entity, bootstrapping a module from scratch, or defining interactions between multiple architectural components -> THEN the agent MUST generate and agree upon a specification document (`spec.md`) before writing any code.
- **WHEN NOT TO USE SDD (Low Complexity / Maintenance):** IF the requirement is fixing a bug, optimizing a query, refactoring an isolated block of code, adjusting UI components, or updating an existing trigger/procedure -> THEN the use of SDD is STRICTLY PROHIBITED. Execute the code changes directly, surgically, and concisely.
### Memory & Context Management (Engram Protocol)
- **CRITICAL RULE - PROJECT KEY:** Whenever interacting with Engram MCP tools (e.g., `mem_save`, `mem_update`, `mem_search`, `mem_session_start`, `mem_capture_passive`), the AI MUST STRICTLY use the exact string `"CRM Inmobiliario Profesional"` as the project identifier.
- **PROHIBITION:** NEVER use directory paths, hyphenated versions (`CRM-Inmobiliario-Profesional`), snake_case, or sub-folder names. Any deviation pollutes the global memory database and will be considered a critical failure in following instructions.

### Architectural Standards

### Ubiquitous Language (Lenguaje Ubicuo) & Domain Integrity
- **CRITICAL RULE (SSoT Terminológico):** Strict adherence to Domain-Driven Design (DDD) Ubiquitous Language. There MUST ONLY BE ONE term for each business entity across the entire system (Frontend, Backend, DB, AI Prompts, UI). Never use aliases or interchangeable terms (e.g., if we use "Visita", never use "Cita" in code or prompts; if "Estado", never "Etapa").
- **AI Behavior Protocol:** IF there is ANY ambiguity regarding domain terminology, OR if the user introduces a new alias for an existing entity, the AI MUST STRICTLY PAUSE, ask the user for clarification, and agree on the official terminology BEFORE writing any code. Never generate code with mismatched or ambiguous terminology, as this causes severe technical debt.

### Backend (Vertical Slice Architecture)
- **Rule:** Strict prohibition of MVC, Clean Architecture, or Onion.
- **Organization:** Code must be organized by features in `/Features`.
- **Logic:** Each feature (e.g., `CreateProperty`) must contain its own route, validation, command/query, and data access in the same logical space.
- **CRITICAL THRESHOLD:** Feature files MUST NOT exceed **200 lines**. If a feature exceeds this limit, its logic must be extracted to specialized helper classes (e.g., `Validator`, `Processor`, `Mapper`) within the same feature folder.

### Frontend (Feature-Sliced Design)
- **Rule (Idioma Estricto):** ALL visual elements, UI copy, placeholders, alerts, tooltips, and user-facing text (Frontend UI/UX) MUST be exclusively in Spanish. This is an UNBREAKABLE rule.
- **Rule:** Organize React code by features in `/src/features/`.
- **Organization:** Avoid global centralization of components, hooks, or services.
- **Rule (Universal Logic SSoT):** STRICT prohibition of duplicating business logic, complex validations, or lifecycle mutations across multiple components or hooks. Any action affecting the state of an entity (Property, Contact, Task, etc.) MUST reside in a centralized, view-agnostic logic hook (e.g., `usePropertyCommercialLogic.ts`). UI-specific hooks must delegate execution and revalidation strategies to these central providers to ensure consistency and prevent race conditions.
- **CRITICAL THRESHOLD:** Components and Hooks MUST NOT exceed **250 lines**. If a file exceeds this limit, it MUST be modularized:

    - **Components:** Extract sub-components to a `components/` sub-folder or split logical sections.
    - **Hooks:** Split into specialized sub-hooks (e.g., `useData`, `useActions`, `useUI`) and coordinate them via a primary orchestrator hook.

### Styling & UI (Tailwind CSS)
- **Rule:** STRICT prohibition of inline styles (`style={{...}}`).
- **Standard:** Use exclusively Tailwind utility classes (`className="..."`).
- **Files:** No separate `.css` files for components. Only use global CSS for Tailwind directives and base variables.
- **Interactive Elements (Cursors):** ALL interactive elements (buttons, custom dropdowns, clickable pills, etc.) MUST explicitly include the `cursor-pointer` utility class to prevent UX ambiguity.
- **Routing & Navigation (Anti-Pattern Prevention):** STRICT prohibition of using programmatic navigation (`onClick={() => navigate(...)}` or `window.open`) for standard routing. ANY navigation action MUST be implemented using declarative `<Link to="...">` components from `react-router-dom` (or `<a>` with `target="_blank"` for external/new-tab links). This is an UNBREAKABLE accessibility and UX rule to ensure users can always use native browser features like "Right Click -> Open in New Tab" or "Ctrl+Click".
- **Rule (Textos Truncados & Zero-Wait UX):** STRICT prohibition of using raw HTML elements (e.g. `<span className="truncate">`) or the native `title` attribute for long texts that might overflow. The AI MUST ALWAYS use the centralized `<TruncatedText>` component from `@/components/ui/TruncatedText` for any potentially truncated text. This ensures texts are properly measured and only show a dark `bg-slate-900` tooltip when they actually overflow, complying with our premium UX standard.
- **Rule (Responsive Layout Protection - Golden Rules):** To prevent horizontal screen overflow and UI deformation on mobile devices, the AI MUST STRICTLY adhere to these two rules:
  1. ALWAYS add `shrink-0` (or `flex-shrink-0`) to profile pictures, avatars, or icons whose size must be immutable when inside flex containers.
  2. When grouping a long text (or an input) with a button that has a lot of text, use `flex-col sm:flex-row` instead of just `flex` to ensure they stack vertically on mobile. Additionally, ensure inputs in flex containers have `min-w-0` to allow them to shrink properly below their default size.

### UI Feedback & Toasts Semantics
- **Rule (Consistencia Semántica):** STRICT adherence to the semantic meaning of toast colors. 
  - `toast.error` (Rojo): ONLY for system errors, network failures, database errors, or "Acceso denegado". NEVER use for business validations.
  - `toast.warning` (Amarillo): For business restrictions, prerequisites not met (e.g., "Debes activar la IA", "Contacto archivado"), and soft validations.
  - `toast.info` (Azul): For passive system state notifications (e.g., "Generando PDF").
  - `toast.success` (Verde): For successful actions, INCLUDING DELETIONS (e.g., "Imagen eliminada"). NEVER use warning for successful actions.

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
- **Mathematical Bounded Concurrency (Max 21 Agents):** The absolute maximum concurrency this system will EVER have is exactly 21 concurrent users (20 agents + 1 admin). Any backend architecture, lock mechanism (Semaphores, Memory Caches), or DB concurrency loop MUST be optimized for this exact number. Over-engineering for "millions of users" is strictly prohibited. Avoid memory leak-prone structures (e.g., locking by dynamic conversation IDs) and use statically bounded objects (e.g., locking by Agent ID).
- **The One Trip Pattern:** Debido a la latencia de red (~1.3s por round-trip con bases de datos remotas), queda ESTRICTAMENTE PROHIBIDO realizar múltiples consultas `await` secuenciales en endpoints de lectura pesados (Dashboard, Analítica, Reportes). Se debe consolidar toda la información en una única proyección LINQ (`.Select(...)`) para que el servidor SQL procese todo en un solo viaje. El procesamiento de datos crudos (agrupaciones por fecha, formateo) debe hacerse en memoria en el servidor C# tras el "único viaje".
- **Stable Cache Keys:** Los parámetros de fecha enviados desde el cliente (`clientDate`, `inicio`, `fin`) deben redondearse al minuto en el frontend para asegurar que la `OutputCache` sea efectiva y no varíe por milisegundos irrelevantes.
- **OutputCaching (.NET 10):** Heavy read endpoints (Analytics, Large Lists) MUST implement `OutputCache` (10-30s).
- **Security Isolation:** Cache MUST vary by authorization token (`VaryByValue` using the `Authorization` header) to ensure data isolation.
- **Query Precision:** Cache MUST vary by all query parameters (`SetVaryByQuery`) para prevenir colisiones de datos.
- **Rule:** Minimize database round-trips. Group multiple checks into a single `Select` using EF Core.
- **Rule:** Use `ExecuteUpdateAsync` or `ExecuteDeleteAsync` for direct updates/deletes to bypass object loading whenever possible.
- **Pessimistic Locking for Parallel Operations:** Cuando se suben archivos a un Object Storage (R2/S3) o se realizan operaciones concurrentes pesadas, NUNCA cargues las colecciones de Entity Framework (`Include`) antes de la operación lenta. Para prevenir condiciones de carrera (Lost Updates) y Deadlocks en Postgres, siempre implementa el patrón: 1) Ejecutar operación lenta (R2), 2) Abrir `BeginTransactionAsync`, 3) Bloquear la fila padre pesimistamente con `SELECT 1 FROM "Table" WHERE "Id" = {0} FOR UPDATE`, 4) Calcular orden/estado en vivo con CountAsync/AnyAsync, 5) Insertar y comitear.
- **Database Connections (.NET + Supabase):** The CRM is a .NET Core WebAPI (a stateful daemon), NOT a serverless architecture. Therefore, it MUST bypass the Supabase transaction pooler (port `6543`) and connect DIRECTLY to the PostgreSQL instance on native port `5432`. DO NOT set `Pooling=false`. You MUST use Npgsql's internal pooling (`Pooling=true;Keepalive=1;`) to keep TCP/TLS channels warm and slash latency drops by over 80%.

## Agent Behavior & Proactive World-Class Standards
- **Role:** Elite Senior Software Architect and Tech Lead.
- **Guidance:** Prioritize surgical updates, ensure full type safety, and maintain strict consistency with these standards.
- **Zero Indulgence Policy:** The AI MUST NOT be "indulgent" or lazy. Treat this project as a top-tier, enterprise-grade, World-Class product. If the user requests a feature implementation that is basic, suboptimal, or not aligned with modern World-Class UX/Architecture (like Salesforce, HubSpot, Linear), the AI MUST PROACTIVELY object, explain why it's suboptimal, and propose the World-Class alternative before writing any code.
- **Continuous Elevation:** Always look for opportunities to elevate the UI, UX, and backend performance. Do not settle for "it works"; it must be visually stunning, perfectly animated (Zero-Wait), and hyper-optimized.

### Dual Views (Desktop/Mobile) Architecture Rule
- **Regla Inquebrantable de Arquitectura:** A partir de la gran refactorización responsiva, este proyecto opera bajo un paradigma estricto de bifurcación de UI.
1. **Orquestación Dual:** Toda vista principal (`.tsx`, `.ts`) está obligatoriamente separada en dos componentes físicos: `[Nombre]Desktop.tsx` y `[Nombre]Mobile.tsx`.
2. **Orquestador Maestro:** El archivo original (ej. `[Nombre].tsx`) actúa EXCLUSIVAMENTE como un orquestador que renderiza ambas versiones utilizando las clases utilitarias de Tailwind para mostrar/ocultar según la resolución (`hidden lg:block` vs `block lg:hidden`).
3. **SSoT (Single Source of Truth) Lógico:** Toda la lógica de negocio y manejo de estados DEBE residir en un único Hook centralizado (ej. `use[Nombre]Logic.ts`).
4. **Actualización Obligatoria Paralela:** **¡CUALQUIER refactorización, nueva funcionalidad, o cambio visual que se solicite en una vista DEBE aplicarse siempre en AMBOS archivos (Desktop y Mobile)!** Existen 2 UI Sources of Truth. Si agregas un botón, debes agregarlo en la vista de escritorio y adaptar su diseño para agregarlo también en la vista móvil. Dejar una vista desactualizada corrompe la experiencia del usuario. JAMÁS asumas que modificar un solo componente actualizará el diseño en ambas plataformas.