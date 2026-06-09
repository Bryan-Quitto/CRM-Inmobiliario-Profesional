# Design: Facebook AI States

## Technical Approach
Implement Vertical Slice Architecture (VSA) for the backend features, managing Facebook and WhatsApp AI state per contact. The frontend will follow Feature-Sliced Design (FSD), updating the `ContactoProfileCard` widgets to handle the new toggles independently using Tailwind CSS. 

## Architecture Decisions

### Decision: Database Schema Expansion
**Choice**: Add specific columns (`BotActivoWA`, `BotActivoFB`, `EstadoIA_WA`, `EstadoIA_FB`) to the `Contacto` entity, and a `Channel` property to `ContactDailyTokenUsage`.
**Alternatives considered**: A many-to-many junction table for channels and AI states.
**Rationale**: VSA favors straightforward solutions over complex normalized structures for a fixed set of channels (FB/WA).

### Decision: UI Styling
**Choice**: Exclusive use of Tailwind CSS.
**Alternatives considered**: CSS modules, styled-components.
**Rationale**: Project standards strictly enforce Tailwind CSS.

## Data Flow
     Frontend UI (FSD Widget) ──→ API Endpoint (VSA Feature) ──→ Contacto Entity (EF Core)
             │                                                          │
             └─────────────────── Token Log ────────────────────────────┘

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `src/Domain/Entities/Contacto.cs` | Modify | Add `BotActivoWA`, `BotActivoFB`, `EstadoIA_WA`, `EstadoIA_FB`. |
| `src/Domain/Entities/ContactDailyTokenUsage.cs` | Modify | Add `Channel` property. |
| `src/Infrastructure/Persistence/Migrations/` | Create | EF Core Migration for schema changes. |
| `src/Features/Contacts/UpdateAIState.cs` | Modify/Create | VSA endpoint to update channel-specific AI states. |
| `src/Features/Messaging/WhatsAppWebhook.cs` | Modify | Check `BotActivoWA` before AI processing. |
| `src/Features/Messaging/FacebookWebhook.cs` | Modify | Check `BotActivoFB` before AI processing. |
| `src/Features/Billing/TokenLimitResetJob.cs` | Modify | Reset tokens per channel. |
| `frontend/src/widgets/ContactProfile/ui/ContactoProfileCard.tsx` | Modify | FSD component, add separate toggles using Tailwind CSS. |

## Interfaces / Contracts
```csharp
public class Contacto
{
    // Existing fields...
    public bool BotActivoWA { get; set; } = true;
    public bool BotActivoFB { get; set; } = true;
    public string EstadoIA_WA { get; set; }
    public string EstadoIA_FB { get; set; }
}

public class ContactDailyTokenUsage
{
    // Existing fields...
    public string Channel { get; set; } = "WhatsApp";
}
```

## Testing Strategy
| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Webhooks | Test AI bypass when `BotActivo` is false. |
| Integration | Token Reset | Ensure `TokenLimitResetJob` cleans up both channels. |
| E2E | UI Toggles | Verify toggle UI updates correct channel flags. |

## Migration / Rollout
EF Core migration using `dotnet ef database update`. Existing `ContactDailyTokenUsage` records must default to `Channel = "WhatsApp"`.

## Open Questions
- [ ] Are there specific enum values defined for `EstadoIA_WA` and `EstadoIA_FB`?
