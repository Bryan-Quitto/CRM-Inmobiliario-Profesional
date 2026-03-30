# Skill Registry - CRM Inmobiliario Profesional

## User Skills
| Skill | Trigger |
|-------|---------|
| sdd-* | sdd init, /sdd-new, /sdd-apply, etc. |
| go-testing | *.go, tests in Go |
| branch-pr | Creating PRs, branching |
| issue-creation | Creating GitHub issues |

## Project Standards

### Inquebrantables (Core Rules)
- **Architecture (Backend)**: Vertical Slice Architecture ONLY. Strictly no MVC, Clean Architecture, or Onion. Features go in `/Features`. Each feature must contain route, validation, and data access.
- **Architecture (Frontend)**: Feature-Sliced Design (FSD). Features go in `/src/features/`.
- **Database & Migrations**: **STRICT PROHIBITION** of `dotnet ef database update`. Generate SQL scripts with `dotnet ef migrations script` and apply manually in **Supabase SQL Editor**.
- **Styles**: **STRICT PROHIBITION** of inline styles. Use exclusively Tailwind CSS utility classes. No separate `.css` files for components.
- **Data**: No base64 images in DB. Use Object Storage URLs.

### World-Class Performance & UX (Rules)
- **Backend**: Minimize DB round-trips (use single `Select`). Use `ExecuteUpdateAsync` / `ExecuteDeleteAsync` for direct DB operations.
- **Instant Loading**: Mandatory SWR Cache via `localStorage` for lists and details (cache by ID).
- **Optimistic UI**: Simple updates (status, tags) must be instant (<100ms). NO blocking loaders for simple changes.
- **Undo Pattern**: Deletions MUST be optimistic with a 5-6s "Undo" toast before server execution.
- **Transitions**: Successful saves must show a "Satisfy" transition (e.g. green check button) for ~800ms.
- **Background**: Files and heavy tasks must run in background queues (Fire & Forget).

### Technical Stack
- **Backend**: .NET 10 (C#) + Entity Framework Core.
- **Frontend**: React 19 (Vite) + TypeScript.
- **Database**: Supabase (PostgreSQL + Auth JWT).
- **Icons**: Lucide-react.
- **Forms**: React-hook-form + Zod.

### General Conventions
- **Naming**: Use Spanish for domain/entities (e.g., `Clientes`), English for technical parts (e.g., `api`, `components`).
- **Comments**: Formal/professional only. Explain "why", never "what".
- **Persistence**: SDD artifacts stored in Engram.
