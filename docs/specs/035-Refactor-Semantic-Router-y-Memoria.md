# Spec & Design: 035 - Refactor Semantic Router y Memoria

## Specifications

### Requirements
1. **Deterministic Structured Output**: The AI provider abstraction (`ILLMProvider`) must support requesting structured outputs. The provider must derive the JSON Schema natively from the generic type `<T>` using .NET 10's `System.Text.Json.Schema` at runtime.
2. **Router Optimization & Token Efficiency**: The semantic router must use non-streaming calls with an ephemeral payload (Classifier Rules + Last User Message) instead of the full conversation history to guarantee low latency and prevent hallucinations.
3. **Prompt Integrity**: The sliding window memory compression logic must NEVER remove or truncate the initial System Prompt. The extraction must be strictly based on role evaluation (`Role == "System"`).
4. **Resiliency & BYOK Architecture**: The signature of the AI provider must not leak multi-tenant details (like `apiKey`), which must be handled at the factory or handler level. Hangfire tasks must propagate `CancellationToken`s throughout all deep I/O operations and intercept cancellations to apply Exponential Backoff policies.
5. **Enforcement**: Introduce Roslyn analyzers (`Microsoft.VisualStudio.Threading.Analyzers`) to enforce correct async/await patterns and `CancellationToken` passing at compile-time.

### Scenarios

#### Scenario 1: Semantic Routing
- **Given** a new incoming message from a user in an active conversation.
- **When** the `WhatsAppAiService` invokes the semantic router to determine the user's intent.
- **Then** the service constructs an ephemeral payload containing ONLY the classifier rules and the last user message.
- **And** it calls `ILLMProvider.GetStructuredResponseAsync<IntentEnum>` using a fast model (`gemini-2.5-flash` or `gpt-4o-mini`).
- **And** the provider returns a strictly typed response containing `NUEVA_BUSQUEDA`, `CAMBIO_TEMA`, or `CONTINUACION`.

#### Scenario 2: Memory Compression
- **Given** an ongoing WhatsApp conversation where the message history exceeds the configured token window (e.g., > 6 messages).
- **When** `WhatsAppConversationManager` applies the sliding window compression.
- **Then** the System Prompt is evaluated and extracted via `history.FirstOrDefault(m => m.Role == "System")`.
- **And** if the System Prompt is null, the system throws an exception or reinjects the default system prompt.
- **And** the compression logic (`.TakeLast(6)`) is applied only to the remaining transactional messages.
- **And** the final compressed history strictly combines `[SystemPrompt] + CompressedMessages`.

#### Scenario 3: Task Cancellation and Backoff
- **Given** a Hangfire job processing a WhatsApp webhook.
- **When** the job exceeds its allowed execution time or the LLM times out.
- **Then** the Hangfire `CancellationToken` is triggered.
- **And** all underlying I/O calls throw `TaskCanceledException`.
- **And** `WhatsAppJobProcessor` intercepts this exception, avoiding an immediate retry loop, and enforces an Exponential Backoff policy (or retry limits) to protect the worker thread pool.

---

## Technical Design

### Architecture Decisions

#### 1. Structured AI Output via `ILLMProvider`
- **Decision**: Introduce a generic method `Task<T> GetStructuredResponseAsync<T>(List<AiMessage> messages, CancellationToken cancellationToken)` in `ILLMProvider`.
- **Rationale**: 
  - **Schema Generation**: We avoid brittle manual `jsonSchema` strings. The implementations will use .NET 10 `System.Text.Json.Schema` to dynamically derive the schema from `<T>`.
  - **BYOK Isolation**: The `apiKey` is deliberately excluded from the signature. Tenant API keys will be resolved during provider instantiation via `LLMProviderFactory` or injected via a `DelegatingHandler` in the `HttpClient`.
- **Implementation Details**:
  - `OpenAiProvider` will use the `response_format` with `type: "json_schema"`.
  - `GeminiProvider` will use `responseMimeType: "application/json"`.
  - Serialization uses `JsonStringEnumConverter`.

#### 2. Router Optimizations in `WhatsAppAiService`
- **Decision**: Refactor semantic routing to utilize the structured output method with non-streaming calls and an ephemeral history context.
- **Rationale**: Sending the entire transaction history to the semantic router bloats token usage, increases TTFB latency, and increases hallucination risk.
- **Implementation Details**:
  - Construct an ephemeral `List<AiMessage>`:
    1. System Message (Classifier Rules: "You are a router...").
    2. Optional context summary ("User was looking for land").
    3. User Message ("Show me houses now").
  - Define `ChatIntent { NUEVA_BUSQUEDA, CAMBIO_TEMA, CONTINUACION }` and call `GetStructuredResponseAsync<ChatIntent>`.

#### 3. Identity Protection in Sliding Window
- **Decision**: Refactor history extraction in `WhatsAppConversationManager` to rely on role semantics instead of array indices.
- **Rationale**: `.First()` blindly assumes index 0 is the system prompt. If a race condition or database glitch starts the array with a user message, the core instructions are lost forever.
- **Implementation Details**:
  - `var systemPrompt = history.FirstOrDefault(m => m.Role == "System");`
  - `if (systemPrompt == null) { /* throw or reinject default */ }`
  - `var transactionalMessages = history.Where(m => m.Role != "System");`
  - Reconstruct: `new [] { systemPrompt }.Concat(transactionalMessages.TakeLast(6))` preserving original GUIDs.

#### 4. Cancellation Token Propagation and Retry Policies
- **Decision**: Pass `CancellationToken` thoroughly and intercept `TaskCanceledException` gracefully.
- **Rationale**: Immediate unhandled cancellations trigger Hangfire's aggressive retry loops, starving the Thread Pool.
- **Implementation Details**:
  - Add `<PackageReference Include="Microsoft.VisualStudio.Threading.Analyzers" Version="17.11.20" PrivateAssets="all" />`.
  - In `WhatsAppJobProcessor`, wrap execution in a try-catch block specifically for `TaskCanceledException` and `OperationCanceledException`.
  - Apply exponential backoff parameters in the `[AutomaticRetry]` attribute or handle it explicitly in the processor to avoid immediate requeuing.
