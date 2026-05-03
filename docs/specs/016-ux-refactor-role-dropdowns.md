# Spec 016: UX Refactor - Role-Specific Dropdowns in Contact Cards

## Objective
Improve the UX/UI of the `ContactoCard` component by decoupling navigation from state management. State changes will be managed via role-specific dropdowns attached to the role badges, and navigation to the contact details will be restricted to a dedicated action button, preventing accidental navigations.

## Scope & Impact
- **Target File:** `src/features/contactos/components/contactos-list-sections/ContactoCard.tsx`
- **Impact:** 
  - Prevents accidental navigation when interacting with the card.
  - Allows independent state management for dual-role ('Multipolar') contacts directly from the list view.
  - Cleans up the top-right corner of the card, replacing the global dropdown with a dedicated navigation button.

## Proposed Solution
1. **Remove Global Navigation:** Remove the `onClick` event and `cursor-pointer` class from the root `div` of `ContactoCard`.
2. **Add Dedicated Navigation Button:** Add a clear navigation icon (e.g., `ArrowUpRight` or `ExternalLink`) in the top-right corner where the old dropdown used to be. This button will trigger `onNavigate`.
3. **Refactor Role Badges into Dropdowns:**
   - Transform the current static role/state badges (under the contact's name) into interactive dropdown buttons.
   - We will need a way to distinguish which dropdown is open per card (e.g., setting `openDropdownId` to `${contacto.id}-cliente` or `${contacto.id}-propietario`).
4. **State Management Hook Update:** 
   - Modify the `ContactoCard` to handle local dropdown state or adapt the global `openDropdownId` to support suffixes indicating which specific role dropdown is open for a given card.
5. **Styling:** Ensure the new dropdowns inherit the existing state colors and styling to maintain visual consistency.

## Alternatives Considered
- Keep global card click but increase padding around dropdowns: Rejected because it doesn't solve the core UX issue of wanting to copy text from the card or the frustration of "fat fingering".
- Keep the top right dropdown but add tabs inside it: Rejected as it requires more clicks and hides the current state. The proposed inline badge approach is more direct.

## Implementation Plan
1. **Update `ContactoCard.tsx` structure:**
   - Remove `onClick={...}` from the outer `<div>`.
   - Replace the top-right conditional dropdown logic with a single navigation button.
   - Update the role badges section:
     - If `esContacto`, render a `<div class="relative">` containing the Client badge (acting as a trigger) and the Client stages dropdown.
     - If `esPropietario`, render a `<div class="relative">` containing the Owner badge (acting as a trigger) and the Owner stages dropdown.
2. **Adjust Dropdown State Handling:**
   - Update how `setOpenDropdownId` is called to distinguish between the two possible dropdowns on a single card (e.g., `${contacto.id}-cliente`).

## Verification & Testing
- **Navigation Test:** Clicking anywhere on the card (except the new top-right button and edit button) should NOT navigate to the detail view.
- **Client State Test:** Opening the client badge dropdown and selecting a new state should only update the client state and close the dropdown.
- **Owner State Test:** Opening the owner badge dropdown and selecting a new state should only update the owner state and close the dropdown.
- **Multipolar Test:** Ensure a contact with both roles displays both interactive badges and both work independently.

## Migration & Rollback
- **Rollback:** Revert `ContactoCard.tsx` to the previous commit. No backend or database changes are required.