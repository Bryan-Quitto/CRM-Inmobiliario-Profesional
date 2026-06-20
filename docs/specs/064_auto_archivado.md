# Auto-archivado Specification

## Purpose

Automatizar el archivado de contactos y propiedades inactivos en segundo plano utilizando un proceso desatendido (Hangfire daemon). Se debe asegurar la máxima eficiencia a nivel de base de datos sin materialización de entidades en memoria, operando en huso horario UTC-5 y aplicando una ejecución de proyecto en fases estrictamente secuenciales.

## Requirements

### Requirement: Independent Configuration

The system MUST allow enabling or disabling auto-archiving independently for Contacts and for Properties.
The system MUST validate that the inactivity limit is between 100 and 1095 days inclusive.

#### Scenario: Enable auto-archive for Contacts
- GIVEN a tenant with auto-archive for Contacts disabled
- WHEN the user enables the setting and sets the inactivity limit to 150 days
- THEN the system MUST save the configuration
- AND the system MUST schedule the background process for Contacts.

#### Scenario: Invalid limit validation
- GIVEN a user configuring the auto-archive settings
- WHEN the user sets the inactivity limit to 99 days
- THEN the system MUST reject the configuration
- AND the system MUST show a validation error message in Spanish.

### Requirement: Background Processing (Daemon)

The system MUST run a scheduled background job using Hangfire to archive inactive entities.
The job MUST execute during low-traffic hours based on the UTC-5 (Ecuador) timezone.
The system MUST implement this in a strictly sequential phased plan: 1) Configuration/Modeling, 2) Direct EF Core Queries, 3) Hangfire Daemon Setup. Paralell execution of implementation tasks is PROHIBITED.

#### Scenario: Scheduled Execution
- GIVEN the auto-archive configuration is enabled for Contacts at 100 days
- WHEN the scheduled execution time arrives (e.g., 2:00 AM UTC-5)
- THEN the Hangfire job MUST start
- AND the job MUST identify and archive Contacts with inactivity >= 100 days.

### Requirement: Strict Performance Bulk Update

The system MUST NOT load entities into memory to update their archive status.
The system MUST translate the operation into a single SQL `UPDATE` statement using EF Core's `ExecuteUpdateAsync`.

#### Scenario: Bulk Archive Execution
- GIVEN 5,000 Contacts exceeding the inactivity limit
- WHEN the auto-archive job executes
- THEN the system MUST execute a single SQL UPDATE query via `ExecuteUpdateAsync`
- AND the system MUST NOT materialize the 5,000 Contacts in application memory.
