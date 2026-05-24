# Propiedades / Auto-Vectorización Specification

## Purpose
Automate the synchronization of property vector embeddings upon creation/update and provide a safe, asynchronous background mechanism for administrators to perform bulk vectorization (defaulting to backfilling missing vectors only).

## ADDED Requirements

### Requirement: Event-Driven Vectorization
The system MUST enqueue a background job to update a property's vector embedding automatically upon successful property registration (`RegistrarPropiedad`) or modification (`ActualizarPropiedad`).

#### Scenario: Registering a new property
- GIVEN a user successfully registers a new property
- WHEN the transaction commits
- THEN the system MUST enqueue a background job for this specific property ID
- AND the UI MUST NOT be blocked waiting for the embedding to complete

#### Scenario: Updating an existing property
- GIVEN a user modifies the details of an existing property
- WHEN the transaction commits
- THEN the system MUST enqueue a background job for this specific property ID to update its vector

## MODIFIED Requirements

### Requirement: Admin Bulk Re-Vectorization Endpoint
The bulk re-vectorization endpoint `/api/admin/re-vectorize` MUST be asynchronous and process properties via a background job instead of a synchronous blocking request.
*(Previously: The endpoint processed all properties synchronously, leading to timeouts).*

#### Scenario: Admin triggers bulk vectorization
- GIVEN an admin user is authenticated
- WHEN the admin calls `/api/admin/re-vectorize`
- THEN the system MUST enqueue the bulk job in Hangfire
- AND the system MUST return a `202 Accepted` response immediately

### Requirement: Selective Bulk Vectorization (Default Behavior)
The bulk job MUST ONLY process properties that do not currently have a vector embedding (i.e., `VectorEmbedding` is NULL or empty) unless explicitly forced.
*(Previously: The system would re-vectorize all properties indiscriminately).*

#### Scenario: Standard bulk vectorization (Backfill)
- GIVEN there are 100 properties, 90 with vectors and 10 without
- WHEN the bulk job runs without the `force` flag
- THEN the system MUST only generate and save embeddings for the 10 properties missing vectors
- AND no OpenAI tokens MUST be consumed for the 90 properties that already have vectors

### Requirement: Forced Bulk Vectorization (Overwrite)
The bulk endpoint MUST accept a `force=true` query parameter or body payload. When forced, the bulk job MUST re-vectorize ALL properties regardless of their current embedding status.
*(Previously: N/A - implicit default behavior).*

#### Scenario: Forced bulk vectorization
- GIVEN there are 100 properties, 90 with vectors and 10 without
- WHEN the admin calls `/api/admin/re-vectorize` with `force=true`
- THEN the system MUST re-vectorize all 100 properties, overwriting existing embeddings

### Requirement: Admin Panel UI Controls
The `ConfiguracionView` MUST provide UI controls for the bulk vectorization, distinguishing between backfilling missing properties and forcing all properties.
*(Previously: A single synchronous button existed).*

#### Scenario: Admin UI - Vectorize Missing
- GIVEN an admin user is in the "Panel de Control"
- WHEN the admin clicks the "Vectorizar propiedades faltantes" button
- THEN the UI MUST call `/api/admin/re-vectorize` without the force flag
- AND display a non-blocking success toast notification

#### Scenario: Admin UI - Force Vectorize All
- GIVEN an admin user is in the "Panel de Control"
- WHEN the admin selects the "Forzar re-vectorización de TODAS" checkbox/confirmation and proceeds
- THEN the UI MUST call `/api/admin/re-vectorize` with `force=true`
- AND display a warning about token consumption before confirmation
