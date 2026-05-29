# Specs: Arquitectura-Multi-Tenant-Cache

**What:** Technical Specifications for Arquitectura Multi-Tenant Cache.
**Why:** To ensure low latency and cost-efficiency using dual-provider caching for static system prompts in the BYOK model, while safeguarding system stability with fallback and exception interception mechanisms.
**Where:** Backend (Vertical Slice Architecture, Supabase integrations, LLM request pipeline).

### Technical Specifications (Specs)

#### 1. Scope & Intent
Implement a robust, dual-provider caching architecture (OpenAI and Gemini) for the CRM's Bring Your Own Key (BYOK) model. The primary intent is to eliminate latency and dramatically reduce costs associated with long, static System Prompts while maintaining strict adherence to architectural standards.

#### 2. Architecture Constraints & Conventions
- **Backend Architecture**: Vertical Slice Architecture ONLY (.NET 10).
- **Frontend Architecture**: Feature-Sliced Design (FSD).
- **Database Operations**: Manual SQL executed in Supabase Editor MUST be used for state and migrations (PROHIBITED: `dotnet ef database update`).
- **Styling**: Exclusive use of Tailwind CSS.
- **Media Management**: Data/Media must be stored in Object Storage.
- **Code Comments**: Strictly professional comments focusing on the "why", not the "what".

#### 3. Core Technical Approach

**3.1. Caching Mechanisms:**
- **OpenAI Cache**: Implement passive caching utilizing `ImmutableArray` to guarantee zero-friction prefix matching.
- **Gemini Cache**: Implement explicit caching utilizing the `CachedContents` API.

**3.2. Distributed State Management (Supabase):**
- **Schema Additions**: Integrate tracking fields in the `Agents` table:
  - `gemini_cache_id` (String / VARCHAR(255))
  - `gemini_cache_expires_at` (mapped to `DateTimeOffset` in Entity Framework / `timestamptz` in DB)
- **Time/Date Standard**: All timestamps must be strictly mapped and managed as `DateTimeOffset` to handle `timestamptz`.

**3.3. Lifecycle & TTL Management:**
- **Safety Buffer**: Implement a strict 10-minute safety buffer.
- **TTL Renewal**: Implement asynchronous patch requests to renew the cache TTL, preventing premature cache invalidation (Time Trap).

#### 4. Critical Logic Additions (Mandated by Architecture Council)

**4.1. Fallback Mechanism (Degraded Route) for Gemini:**
- **Token Count Validation**: Prior to initiating the `CachedContents` API call for Gemini, a strict token count validation MUST be executed.
- **Threshold Check**: If the token count of the System Message does NOT reach the minimum threshold of `32,768` tokens, the explicit cache creation process MUST be skipped.
- **Degraded Execution**: In the event the threshold is not met, the system must silently fallback to executing a standard `GenerateContentRequest` (incurring standard token costs) to prevent the application from crashing.

**4.2. Global BYOK Exception Handling (Circuit Breaker):**
- **Global Interceptor**: Implement a global interceptor/middleware across the AI provider API execution pipeline.
- **Target Status Codes**: Intercept HTTP status codes `401` (Unauthorized) and `429` (Billing/Quota limits).
- **State Invalidation**: Upon intercepting these codes, the system must immediately mark the offending Agent's API Key as `Invalid` directly in the `Agents` table in Supabase.
- **TTL Patch Halt**: All background tasks, specifically the TTL patching/renewals and retry mechanisms associated with that specific agent, MUST be instantaneously halted and destroyed. This prevents infinite renewal loops, log saturation, and prevents the poisoning of internal server resources.
