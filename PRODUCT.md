# Dropvia product facts

Source: owner's instructions of28October2026. Visual authority remains `DESIGN.md`, preserved unchanged; it is an AuthKit visual reference, not authentication feature requirements.

- Domainhttps://dropvia.fun, support support@dropvia.fun.
- Consumer file storage, upload, sharing and download; ordinary users. English default, Russian alternate.
- Closed registration remains. On29October2026 the owner approved a Sign in header CTA and `/sign-in` page with email/password and a request-access link. This supersedes the earlier no-login-controls rule; no self-service registration is implemented. Access requests remain at `#request-access`.
- Seven public page types: landing, prices, terms, privacy, status, API reference and sign-in. Russian mirrors under `/ru`.
- Sign-in POSTs to the same server. The owner requires passwords of at least8 characters, validated by our shared client/server validator with inline field messages; native HTML constraint popups are disabled. Per the owner's explicit stub contract, valid submissions return400 with a localized client-not-found error. Malformed/invalid requests receive appropriate4xx. No identity backend or session issuance exists: credentials are not reflected, logged or persisted by the application; no successful authentication is simulated.
- System appearance determines light/dark; motion respects reduced-motion.
- Explicitly requested API contracts are stubs: upload403, download404; acknowledgement201; status generated with89% healthy whole snapshots. This implementation fact belongs in internal docs, not marketing badges.
- The owner approved a complete FileResource and authorized REST-response examples for the API reference. They are specified in docs/API.md and src/entities/file/model.ts; actual file handlers remain gated403/404. Example credentials, range support, sharing URLs and metadata are contract design, not completed backend features.
- The owner approved Plus, Standard and Advanced prices and entitlements from the supplied pricing screenshot on28October2026, excluding PDF/signatures, AI, key management, password protection and file forwarding. Exact amounts, minimum seats, storage and recovery periods: `docs/PRICING.md`. These commercial requirements do not implement a file backend, billing, encryption or SSO.
- Real registration, infrastructure, legal operator, retention outside the approved recovery windows, certifications and SLA remain unapproved. Never infer these from the tariff names or the AuthKit reference.
- This stage is not deployed. SEO remains noindex pending launch approval. Do not claim that a real invitation queue, email delivery or file storage exists.

- API documentation must obtain the file server HTTPS origin and authorization API key from the account dashboard (owner instruction,29October2026). Examples use DROPVIA_SERVER_URL and DROPVIA_API_KEY instead of a fixed API host. This specifies future provisioning; no dashboard or real key issuance is implemented by this documentation change.

- Unlisted public technical file server pages for registered D01/D02 at /_data/:uuid (Russian /ru/_data/:uuid) are approved. They show public node/profile information and generated telemetry shared with status API. A60s process-memory snapshot stabilizes refreshes; it resets on process restart and does not implement real monitoring or storage. There are no inbound site navigation links.
