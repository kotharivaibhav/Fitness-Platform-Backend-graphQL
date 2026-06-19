# Security Implementation Guide

## 1. Depth Limiting (`graphql-depth-limit`)

**What:** Rejects queries exceeding max nesting depth (default: 10).

**Why:** Prevents malicious deeply nested queries that cause exponential resolver execution.

**Config:** `GRAPHQL_MAX_DEPTH=10` in `.env`

## 2. Query Complexity Analysis (`graphql-query-complexity`)

**What:** Assigns cost scores to fields; rejects queries exceeding threshold (default: 1000).

**Why:** Prevents expensive queries that fetch too much data in a single request.

**Config:** `GRAPHQL_MAX_COMPLEXITY=1000`

## 3. Rate Limiting (`express-rate-limit`)

**What:** Limits requests per IP (default: 100 per 15 minutes).

**Why:** Protects against brute force, DDoS, and API abuse.

**Config:** `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`

## 4. Input Validation (Zod)

**What:** All mutation inputs validated against Zod schemas before processing.

**Why:** Prevents invalid data, injection patterns, and type confusion attacks.

## 5. Persisted Queries (APQ)

**What:** Clients send query hash instead of full query string; server caches approved queries in Redis.

**Why:** Reduces attack surface — only known queries execute; smaller payloads.

## 6. CSRF Protection

**What:** Mutations require matching `x-csrf-token` and `x-csrf-cookie` headers.

**Why:** Prevents cross-site request forgery from malicious websites.

**Usage:** GET `/csrf-token` before mutations.

## 7. Helmet

**What:** Sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.).

**Why:** Defense-in-depth against common web vulnerabilities.

## 8. CORS

**What:** Restricts cross-origin requests to configured origins.

**Why:** Prevents unauthorized domains from accessing the API.

**Config:** `CORS_ORIGIN=http://localhost:3000`

## 9. JWT Authentication

**What:** Short-lived access tokens (15m) + rotatable refresh tokens (7d) stored in Redis.

**Why:** Stateless auth with ability to revoke sessions server-side.

## 10. RBAC via `@auth` Directive

**What:** Field-level authorization with role hierarchy: USER < TRAINER < ADMIN.

**Why:** Granular access control without middleware-only checks.

## 11. Password Hashing (bcrypt, 12 rounds)

**What:** Passwords never stored in plaintext.

**Why:** Protects credentials if database is compromised.

## 12. Error Sanitization

**What:** Production errors hide stack traces and internal details.

**Why:** Prevents information leakage to attackers.
