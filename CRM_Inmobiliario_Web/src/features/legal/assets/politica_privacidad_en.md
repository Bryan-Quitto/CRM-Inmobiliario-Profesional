# Lúmina Privacy Policy

**Date of last update:** July 3, 2026

Lúmina ("we", "our", "the Platform") is committed to protecting personal data. This Privacy Policy describes how we collect, use, store, and protect personal information, in compliance with the Organic Law on Personal Data Protection (LOPDP) of Ecuador, the General Data Protection Regulation (GDPR), and other applicable international standards.

This policy applies to all users of our professional Real Estate CRM platform (Software as a Service), meaning the Independent Real Estate Agents (hereinafter, "User" or "Agent"). The "Agencies" functionality within the platform operates solely as a grouping and collaboration mechanism (workspace or team) for sharing properties, and does not generate a direct contractual link between Lúmina and such franchises or companies.

## 1. Roles in Data Processing

In the context of our services, there are two clearly differentiated roles:

*   **Lúmina as Data Controller:** We act as Data Controllers regarding the personal data of our Users (agents and legal representatives of agencies) necessary for the provision of the service, account management, and billing.
*   **Lúmina as Data Processor:** We act as Data Processors regarding the personal data of end clients (contacts, prospects, and property owners) entered or linked to the platform by the User. The Agent acts as the **Data Controller** for the data of their own client portfolio and is solely responsible for obtaining lawful consent for its processing, including its processing via Artificial Intelligence (AI) tools and communication channels such as WhatsApp.

## 2. Data We Collect

### 2.1. User Data (Agents and Agencies)
As Data Controllers, we collect:
*   **Identification and Contact Information:** First name, last name, email (ID linked to Supabase Auth), phone number, and physical address.
*   **Customization Data:** Agent profile picture and agency logo.
*   **Integrations and Credentials:** Identifiers for communication channels (WhatsApp Phone Number ID, Facebook Page ID, Facebook Page Access Tokens).
*   **Artificial Intelligence Configuration:** Language model preferences, custom prompts, and own integration keys when applicable.
*   **Technical and Usage Data:** WebPush notification subscriptions, security and AI interaction audit logs, token usage, and agent performance metrics within the CRM.

### 2.2. End Client Data (Contacts and Owners)
As Data Processors, we process on behalf of the Agent:
*   **Contact Information:** First name, last name, email, and phone number.
*   **Digital Identity:** Unique identifiers on messaging platforms (e.g., Facebook Sender ID, WhatsApp number).
*   **Communications:** Complete history of conversations (via WhatsApp and Facebook Messenger), manually logged interactions, and agent notes.
*   **Commercial Profile:** Contact source, status in the sales funnel, properties of interest or owned, transaction history, and closings.

## 3. Data Usage

We use the collected information for the following purposes:
*   Provide, maintain, and improve Lúmina CRM services.
*   Manage secure authentication and platform access.
*   Facilitate omnichannel communication between Agents and their clients through official Meta integrations (WhatsApp, Facebook Messenger).
*   Process queries, messages, and commercial information using Artificial Intelligence services to assist agents (classification, summaries, and automated responses).
*   Send push notifications related to system operability.
*   Comply with legal obligations and prevent fraud or misuse of the platform.

## 4. Sub-processors (Third Parties)

To provide our service, we securely share information with strictly necessary external providers (Sub-processors). All of them comply with high security and data protection standards:

*   **Supabase:** Primary provider for authentication (Auth) and database hosting (PostgreSQL). It hosts the agent registration data and the complete database.
*   **Meta Platforms, Inc.:** Provides the WhatsApp Business API and Facebook Messenger infrastructure for receiving and sending automated or manual messages (via Webhooks and Graph API).
*   **Artificial Intelligence Services (OpenAI, Google Gemini):** Used for natural language processing (text generation, transcriptions with Whisper, embeddings). Certain contact information travels to these APIs to be processed exclusively for the CRM's functionalities.
*   **WebPush Services:** For routing notifications to the agent's browser.

## 5. Local Storage

Lúmina uses storage technologies in the end user's (Agent's) browser for the proper functioning of the web application. The platform is a Single-Page Application (SPA) that uses JWT tokens in `Authorization: Bearer` headers and **does not use session cookies**:

*   **LocalStorage:** We use `localStorage` to securely persist the Supabase Auth session (JWT tokens) in the browser, avoiding constant reconnections.
*   **Application Cache (Zustand / SWR):** Certain user preferences and interface data are temporarily stored in memory or local/session storage to ensure a fast and smooth experience.
*   **Native Push Notifications (WebPush/VAPID):** The Agent may enable operating system-level push notifications (Windows, Android, macOS, iOS) via the standard Web Push technology using proprietary VAPID keys. These notifications alert about pending, overdue, and AI assistance tasks. Activation is entirely voluntary and configurable from the settings panel.

*Note: Lúmina does not use session cookies or third-party advertising tracking cookies on its software platform.*

## 6. Legal Basis for Processing

*   **For Users (Agents):** Processing is based on the execution of the service provision contract (Terms of Service), explicit consent upon creating an account, and the legitimate interest in improving our platform.
*   **For End Clients:** Agents act as Data Controllers and base their processing on the consent of their clients or on the pre-contractual/contractual relationship they maintain with them.

## 7. Data Subject Rights

In accordance with the LOPDP and the GDPR, data subjects have the right to:
*   **Access:** Know what personal data we process.
*   **Rectification and Update:** Correct inaccurate or incomplete data.
*   **Erasure (Right to be Forgotten):** Request the deletion of their data when no longer necessary or when consent is withdrawn.
*   **Objection and Restriction:** Object to certain processing or request its restriction.
*   **Portability:** Receive their data in a structured and machine-readable format.

Users can exercise these rights directly from their settings dashboard or by contacting us through our support channels. In the case of end clients, they must exercise these rights directly with the corresponding Real Estate Agent; Lúmina will provide technical assistance to the Agent to fulfill such requests.

## 8. Data Security

We implement robust technical and organizational measures to protect data against unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit (HTTPS/TLS), secure authentication (JWT), role-based access control (RLS) at the database level in Supabase, and transparent **encryption at rest** (using the **ASP.NET Core Data Protection API**) to safeguard critical information such as third-party integration keys (Artificial Intelligence API Keys).

## 9. Meta Platform Data (WhatsApp and Facebook Messenger)

When the User links their WhatsApp Business or Facebook Messenger channels to the platform, Lúmina accesses messages, conversation metadata, and page configuration exclusively to provide the CRM functionalities described in this policy. Lúmina expressly declares that:

*   Data from Meta platforms **is not used for advertising** of any kind, nor to create Lúmina's own commercial profiles unrelated to the CRM's functionalities.
*   WhatsApp and Messenger conversation data is processed solely to display the history in the CRM, automate responses on behalf of the Agent, and generate assistance alerts for the Agent.
*   The Agent (User) is solely responsible for obtaining the lawful and legitimate consent of their contacts for the use of automated or AI-assisted messaging, in accordance with Meta's Business Policies.
*   Lúmina operates under the Technology Provider (Tech Provider / ISV) model on WhatsApp Business API accounts managed by the Agents themselves.

## 10. Minors

Lúmina is a service exclusively intended for professionals and businesses (B2B). It is not directed at persons under 18 years of age. We do not intentionally collect personal data from minors. If we became aware of having collected data from a minor without valid parental consent, we will proceed with its immediate deletion.

## 11. Data Retention

We retain personal data only for the time strictly necessary for the purposes for which it was collected:

| Data Type | Retention Period |
|---|---|
| Agent account data (profile, credentials) | While the account is active + 30 days after deletion |
| Contacts and properties (end client data) | While the Agent maintains an active account |
| Conversation history (WhatsApp / Messenger) | 12 months from the last interaction |
| AI logs and token usage | 6 months |
| Security audit logs | 12 months |
| WebPush subscriptions | Until the Agent revokes them or deletes their account |

Once the retention period expires, data is securely deleted or anonymized.

## 12. International Transfers

Given that we use cloud infrastructure (such as Supabase, OpenAI, Google, and Meta), data may be transferred and processed on servers located outside of Ecuador (e.g., United States or the European Union). We ensure that these providers offer adequate protection guarantees, such as standard contractual clauses and privacy compliance certifications.

## 13. Changes to the Privacy Policy

We reserve the right to update this policy periodically. Users will be notified of material changes via **mandatory in-app notifications** upon logging in, requiring their explicit acceptance to continue using the service.

## 14. Contact

For questions about this Privacy Policy or legal inquiries regarding data protection, please contact: `soporte@luminacrminmobiliario.com`.
