# Dropvia HTTP API v1

Server: React Router resource routes in `src/app/routes/api-*.ts`. The owner-approved integration obtains the file server HTTPS origin and API key from the account dashboard. Set the origin (without /api/v1) in DROPVIA_SERVER_URL and the key in DROPVIA_API_KEY; examples append /api/v1. No fixed API host is published. Public bilingual reference: `/api/`, `/ru/api/`.

| Method | Path               | Current response                                        |
| ------ | ------------------ | ------------------------------------------------------- |
| POST   | `/upload/:uuid?`   | 403 ACCESS_RESTRICTED; body is not consumed or stored   |
| GET    | `/download/:uuid?` | 404 FILE_NOT_FOUND; no bytes or file existence revealed |
| GET    | `/files/:uuid`     | 404 FILE_NOT_FOUND                                      |
| DELETE | `/files/:uuid`     | 403 ACCESS_RESTRICTED                                   |
| POST   | `/shares/:uuid`    | 403 ACCESS_RESTRICTED                                   |
| GET    | `/status`          | 200 StatusSnapshot                                      |
| POST   | `/access-requests` | 201 acknowledgement                                     |

GET resources support HTTP HEAD through Router. Other unsupported methods handled by the route return405 with Allow. API errors have `{ error: { code, message }, requestId }`; messages and codes are stable English integration data, independent of the translated UI. No credential issuance or file operations are implemented.

## Authorized file contract in the reference

The owner's API-documentation task explicitly authorizes a complete file model and successful REST examples. It supersedes the earlier restriction on successful upload examples. This is the integration contract displayed by `/api/`, not a change to the current live-response table above. Bearer authentication, storage, ranges, conditional requests and sharing still require backend implementation; no real token is published or issued. File examples read `DROPVIA_API_KEY` from the server environment. Access requests and health remain public.

`src/entities/file/model.ts` defines FileResource. Fields: `id` (UUID string), `name` (filename with extension), `path` (logical path including the name, never an OS/storage path), `size` (non-negative integer bytes), `mimeType`, `publicUrl` (nullable sharing URL), `downloadUrl` (authorized download endpoint), `createdAt` and `modifiedAt` (ISO8601 UTC, modification not before creation). Timestamps are server assigned; the UUID is supplied on upload or assigned by the server when omitted; no owner identifiers, storage secrets or server paths appear. A private file has publicUrl=null; knowing its downloadUrl does not grant access. The `/s/<share-uuid>` public URL is part of the proposed share contract, not an implemented public page. Example downloadUrl/publicUrl and Location references are root-relative and resolve against the assigned file server origin. Dashboard provisioning of server addresses and keys is an owner-approved requirement, not an implemented dashboard or key-issuance flow.

| Operation           | Authorized response                  | Notes                                                                                                                                                                                                |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST upload         | 201 FileResource                     | Location points to file metadata. UUID may be server-assigned; a supplied existing UUID conflicts409. Multipart fields: file/path; raw upload uses MIME Content-Type and name/path query parameters. |
| GET download        | 200 bytes or206 bytes                | Content-Type, Content-Disposition, Content-Length; Range request produces Content-Range. UUID required; invalid UUID400, unsatisfied range416.                                                       |
| GET metadata        | 200 FileResource or304 empty         | ETag/If-None-Match, private/no-cache.                                                                                                                                                                |
| DELETE file         | 204 empty                            | No JSON, Content-Type or response body.                                                                                                                                                              |
| POST share          | 201 share with embedded FileResource | id,fileId,publicUrl,createdAt,file; Location identifies the new share link.                                                                                                                          |
| GET status          | 200 StatusSnapshot                   | No-store; current runtime snapshot contract retained.                                                                                                                                                |
| POST access request | 201 acknowledgement                  | Current stateless acknowledgement contract retained. No individual GET access-request resource exists.                                                                                               |

The reference lets users select each applicable success/error response. Error catalog covers400/401/403/404/405/409/413/415/416/422/429/500/503 with the existing JSON envelope. Headers include WWW-Authenticate for401, Allow for405, Content-Range for416, Retry-After for429/503. Codes outside the current live table are target-contract examples, not a claim that the runtime enforces them. Stream clients check status before opening a destination;204 is never JSON-parsed. The JavaScript example targets Node22.22+/24+ and uses openAsBlob/streams; Python requires requests (not a frontend dependency).

Protocol reference: [RFC9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html), especially201,204,206,304 and header semantics. [RFC9457](https://www.rfc-editor.org/rfc/rfc9457.html) was reviewed; REST does not require migrating the existing JSON envelope to problem+json, so live errors remain compatible. [Node openAsBlob](https://nodejs.org/api/fs.html#fsopenasblobpath-options) supplies the upload Blob without loading the entire file with readFile.

## Access requests

JSON: `{ "name": "Alex Morgan", "email": "reader@example.com", "organization": "Studio North", "needs": "Keep project files", "consent": true }`. `name`, `email`, `needs` and consent are required; `organization` is optional (personal requests need no company). Maximum text lengths: name100, email254, organization160, needs1000 UTF-16 code units, matching HTML maxlength. Required text must contain a non-whitespace character. Native form fallback uses the same named fields in URL-encoded data and `consent=on`, index action `/?index` or `/ru?index`. Both call the same server handler.

Request limit16384bytes is enforced against streamed bytes, including missing Content-Length. This accommodates Russian/non-ASCII fields in percent-encoded native forms. Bad JSON400, wrong media type415, oversized413, invalid text/email/consent422, foreign Origin/Sec-Fetch-Site403. Successful response201: `{ "id": "<UUID>", "status": "received" }`. No personal fields reflected, request body logged, cookies, persistence or outgoing mail. The user's explicit stub contract is implemented; success is acknowledgement only. Query mutation has no retry,15second timeout and disabled pending button. Native no-JS submission renders acknowledgement in the landing page. Consent links open local translated policies. Privacy copy describes the additional fields; do not collect sensitive data in the description.

## Status

`{ checkedAt: ISO8601, services: [{ id, state, latencyMs }] }`. IDs: `api`, `authentication`, `download-01`, `download-02`. States: operational/degraded. The last two IDs display as File server D01 / D02 (Файловый сервер D01 / D02); stable JSON identifiers are unchanged.

Synthetic server snapshots per the brief: probability0.89 gives **all four** operational; otherwise one random component is degraded. Latency values are generated too. This is not monitoring or measured uptime and no uptime percentage/history/SLA is displayed. Replace `createStatusSnapshot` with authenticated upstream monitoring before describing production availability.

A process-local public snapshot is reused for60seconds and regenerated lazily on the next read after expiry. API/status/technical-node pages use the same cached snapshot; restarts reset it and separate workers remain independent. SSR loader provides the first snapshot. Query initialDataUpdatedAt uses the loader receivedAt separately from checkedAt, preventing immediate hydration refetch; polling30seconds only while visible/online, cancellation on unmount,10second timeout, manual refresh. A failed refresh keeps previous data and prominently marks the result stale. External JSON is validated before use.

## Web sign-in form

POST `/sign-in` or `/ru/sign-in` is a same-server web route, separate from the seven API v1 operations. It accepts JSON or application/x-www-form-urlencoded email/password with a16384byte body limit. Email is required, at most254 UTF-16 units; password is required, from8 to1024 UTF-16 units. The minimum is an explicit owner requirement, enforced by a shared client/server validator. The form disables native validation popups with noValidate and renders translated field errors. A422 action result includes safe fieldErrors codes (for example passwordTooShort), without submitted values; both enhanced and no-JS forms show these messages under the associated input. Bad JSON400, foreign Origin/Sec-Fetch-Site403, unsupported method405 (Allow: GET, HEAD, POST), oversized413, unsupported media type415, invalid fields422. The owner's explicit stub contract returns400 for valid credentials: `{ "error": "clientNotFound", "message": "No client was found with these credentials." }`; `/ru/sign-in` localizes the message to «Клиент с такими данными не найден.». Router data responses serialize this action result; native forms render the same message in HTML. No credentials are reflected, logged or persisted by the application. Responses are no-store/noindex and do not issue cookies or tokens. Real identity verification, sessions and operational abuse controls remain future integration work.

## Production integration gates

- Implement durable access-request storage, deduplication/idempotency, retention and email delivery before processing real applicant queues. Add distributed abuse controls at ingress and origin configuration for the chosen reverse proxy; the current stateless acknowledgement is not a durable queue.
- Implement authentication/authorization, per-file ownership, signed/scoped download access, object storage, quotas, malware/abuse workflows, streaming/multipart byte limits and deletion before opening file operations. Current403/404 contracts prevent file transfer.
- Confirm legal operator, applicable jurisdictions, processing locations/providers, retention and billing/legal terms with the owner before launch (tariff amounts and entitlements are approved in docs/PRICING.md; their backend remains to be implemented); current legal text is scoped to the public invitation site and does not certify compliance.
- Configure TLS, proxy trust, deployment security headers/CSP nonces and infrastructure timeouts/rate limits for the actual hosting platform. No deployment or external integration has been performed.

## Reference text conventions

The EN/RU reference uses protocol terms and field names directly. Authentication describes the Bearer API key and file server origin obtained from the account dashboard. DROPVIA_API_KEY and DROPVIA_SERVER_URL are server-side example configuration; no real key or server address is included. The introduction states the current public403/404 restrictions once; the per-method descriptions explain the documented success contract. Sizes use bytes, timestamps use UTC, and access-request text limits use UTF-16 code units to match validation. The201 access acknowledgement does not grant file access. HTTP reason phrases, JSON property names and error codes remain English integration data. Sample error messages describe the selected status; ORIGIN_NOT_ALLOWED specifically describes an origin rejection.
