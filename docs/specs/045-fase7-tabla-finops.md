# Specification: Fase 7 - Tabla FinOps (Consumo de Tokens IA)

## 1. Intent
Implement a FinOps token usage table in the CRM Inmobiliario Profesional configuration panel to display daily AI token consumption and associated costs. This phase introduces a backend endpoint to fetch aggregated token usage data and a frontend React component to render the data in a premium, responsive table within the existing `ConfiguracionIntegracionIA` view.

## 2. Architecture & Design Decisions

### Backend (Vertical Slice Architecture)
- **Endpoint**: `GetAgentTokenUsageEndpoint` mapped to `GET /api/finops/token-usage`.
- **Query Logic**: Direct query against the `AgentDailyTokenUsage` table using Entity Framework Core.
- **Pattern Compliance ("The One Trip Pattern")**: Strict adherence to a single `.Select()` projection to map database entities directly to the DTO (`AgentTokenUsageDto`). No sequential awaits or N+1 queries.
- **Timezone**: All date filtering and representations must be strictly converted to Ecuador timezone (UTC-5) using `.ToOffset(TimeSpan.FromHours(-5))`.

### Frontend (Feature-Sliced Design)
- **Component**: `TokenUsageTable.tsx` residing within the `configuracion` feature slice (`src/features/configuracion/components/`).
- **Data Fetching**: Utilization of `SWR` for robust data fetching, caching, and revalidation.
- **Integration**: Injected at the bottom of the existing `ConfiguracionIntegracionIA.tsx` page.
- **UI/UX**: Styled with standard Tailwind CSS to align with the premium aesthetic of the configuration panel.
- **Language**: Strictly Spanish for all UI text.

## 3. File-by-File Changes

### Backend

**1. `src/CRM_Inmobiliario.Api/Features/FinOps/GetAgentTokenUsage/GetAgentTokenUsageEndpoint.cs` (New)**
- Define a Minimal API endpoint `MapGet("/api/finops/token-usage")`.
- Implement `GetAgentTokenUsageQuery` and `GetAgentTokenUsageHandler` (or direct endpoint logic if using pure Minimal APIs without MediatR, depending on project exact vertical slice setup).
- Query `AppDbContext.AgentDailyTokenUsage` ordered by `Date` descending.
- Use a single `.Select(x => new TokenUsageDto { ... })` projection.
- Ensure the `Date` is formatted/handled correctly for UTC-5.

**2. `src/CRM_Inmobiliario.Api/Features/FinOps/GetAgentTokenUsage/TokenUsageDto.cs` (New)**
- Define properties:
  - `Fecha` (string or DateOnly)
  - `Modelo` (string)
  - `TokensInput` (int/long)
  - `TokensOutput` (int/long)
  - `CostoTotalUsd` (decimal)

### Frontend

**1. `src/features/configuracion/api/finops.ts` (New/Update)**
- Define the `fetchTokenUsage` function using the configured axios client.
- Export a custom SWR hook: `useTokenUsage()`.

**2. `src/features/configuracion/types/finops.types.ts` (New/Update)**
- Define the TypeScript interface `TokenUsage`:
  ```typescript
  export interface TokenUsage {
    fecha: string;
    modelo: string;
    tokensInput: number;
    tokensOutput: number;
    costoTotalUsd: number;
  }
  ```

**3. `src/features/configuracion/components/TokenUsageTable.tsx` (New)**
- React functional component.
- Use `useTokenUsage()` to fetch data.
- Handle `isLoading` (skeleton loader) and `error` states.
- Render a `<table>` with columns: Fecha, Modelo, Tokens Input, Tokens Output, Costo Total ($ USD).
- Apply premium Tailwind styling (e.g., modern borders, subtle hover effects on rows, distinct table header styling matching the app's theme).

**4. `src/features/configuracion/components/ConfiguracionIntegracionIA.tsx` (Update)**
- Import `TokenUsageTable`.
- Inject `<TokenUsageTable />` at the bottom of the component's render tree, likely below the existing AI configuration form or sections.
- Add an appropriate section header in Spanish, e.g., `<h3 className="...">Consumo de Tokens IA</h3>`.
