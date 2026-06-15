# Delta for WhatsApp

## MODIFIED Requirements

### Requirement: Endpoint Authorization
The system MUST secure the ObtenerLogsIa endpoint requiring a valid authorization token.
(Previously: Endpoint was missing the authorization attribute)

#### Scenario: Unauthorized access attempt
- GIVEN a user without a valid authorization token
- WHEN the user attempts to retrieve IA logs
- THEN the system MUST reject the request

### Requirement: Single Optimized Query Execution
The system MUST retrieve logs using a single database query execution to prevent redundant queries.
(Previously: The system used split queries which generated excessive redundancy)

#### Scenario: Log retrieval query
- GIVEN a request to retrieve IA logs
- WHEN the system executes the data retrieval
- THEN it MUST execute a single combined query

### Requirement: Exact Projection Data Retrieval
The system MUST project only the explicitly required fields for the DTO to eliminate over-fetching.
(Previously: The system over-fetched data using entity includes)

#### Scenario: Data projection
- GIVEN a request for IA logs
- WHEN the system retrieves the data
- THEN only the fields defined in the output DTO MUST be fetched from the database

### Requirement: Complete Duplicate Preservation
The system MUST preserve all duplicate log items correctly when grouping records.
(Previously: The system non-deterministically dropped duplicate items during grouping)

#### Scenario: Grouping with duplicates
- GIVEN multiple log items with identical properties
- WHEN the system groups the logs
- THEN all duplicate items MUST be preserved in the grouped result

### Requirement: Strict Channel Isolation
The system MUST isolate log queries strictly by the requested channel, ensuring no cross-channel matching.
(Previously: The query logic had flaws allowing cross-channel data matching)

#### Scenario: Channel-specific retrieval
- GIVEN logs exist for both WhatsApp and Facebook channels
- WHEN a request specifically asks for WhatsApp logs
- THEN the system MUST return exclusively WhatsApp logs

### Requirement: Unassigned Phone Number Inclusion
The system MUST include log records that lack an associated phone number.
(Previously: The system incorrectly filtered out logs missing phone numbers)

#### Scenario: Retrieving logs with missing phones
- GIVEN IA logs exist where the phone number is null or empty
- WHEN the system retrieves the logs
- THEN these unassigned logs MUST be included in the results
