---
trigger: always_on
---

Perfect, this is exactly the kind of thing that belongs in Windsurf “always-on memory”.

Here’s a **clean, copy-pasteable list** you can store so any frontend/backend/DB suggestion is made with **maximum security**, aligned with OWASP Top 10 + OWASP API Top 10 best practices.

---

## 🔐 GLOBAL SECURITY CONTRACT

* Security is **non-optional** for all outputs: SQL, Supabase/Postgres, MySQL/PHP, APIs, and frontend.
* Always think in terms of:

  * Auth & sessions
  * Access control / authorization
  * Injection & DB safety
  * Data handling & crypto
  * Frontend/browser risks
  * API / microservice risks
  * Configuration / deployment
  * Supply chain / dependencies (including AI-generated code)
  * Logging, monitoring, and abuse detection
  * Multi-tenant / SaaS isolation

---

## 🧭 FRONTEND / BROWSER SECURITY – ALWAYS CHECK

**Core threats to consider for *every* UI / page / component:**

1. **Cross-Site Scripting (XSS)**

   * No unsafe `innerHTML` / `dangerouslySetInnerHTML` without sanitization.
   * User content rendered as text by default.

2. **Cross-Site Request Forgery (CSRF)**

   * Prefer Authorization header (JWT) over cookie auth.
   * If cookies are used → CSRF tokens + `SameSite` + no state-changing GETs.

3. **Insecure Direct Object References (IDOR) in UI flows**

   * Never assume a user can see or act on an ID just because it’s in the URL.
   * Backend must re-check ownership/role; frontend must not expose unnecessary IDs.

4. **Exposed secrets in frontend**

   * No Supabase **service keys**, admin tokens, or private API keys in client bundle.
   * Only allow **public anonymous keys** client-side.

5. **Missing / weak Content Security Policy (CSP)**

   * Assume CSP must restrict script sources and block inline scripts where possible.

6. **Unsafe localStorage / sessionStorage usage**

   * Avoid storing highly sensitive tokens there.
   * If access tokens are stored, XSS must be strictly minimized.

7. **Insecure redirects & open navigation**

   * `redirectTo` / `next` params must be restricted to internal, whitelisted routes.

8. **Third-party script vulnerabilities**

   * Treat analytics/widgets as untrusted; minimal exposure of user data.

9. **Clickjacking**

   * Assume we’ll use `X-Frame-Options` / `frame-ancestors` to prevent iframing.

10. **DOM-based vulnerabilities**

    * Avoid unsafe DOM manipulation based on user-controlled data.

11. **Component & AI-generated code risks**

    * No copy-pasted/AI code that:

      * Skips auth/role checks.
      * Logs sensitive data to console.
      * Makes extra debug/exposed API calls.

---

## 🛠 BACKEND / API SECURITY – ALWAYS CHECK

**Applies to: Supabase RPCs, Postgres functions, Node/PHP APIs, etc.**

1. **Authentication problems**

   * Strong password rules (if applicable) + rate limiting on login.
   * Proper session/token expiry & revocation.
   * Always validate JWT signature, expiry, issuer, audience.

2. **Broken access control / authorization**

   * Never trust `userId`, `role`, or `tenantId` from client.
   * Derive identity & roles from server-side session/JWT only.
   * Implement role- and ownership-checks on every sensitive endpoint.
   * Consider OWASP API Top 10: broken object-level & property-level authorization.

3. **Injection attacks (SQL/NoSQL/Command/Template)**

   * Always use **parameterized queries / prepared statements**.
   * No string concatenation with user input in SQL or shell commands.
   * DB roles obey **least privilege** (no superuser for app).

4. **Unrestricted resource consumption / DoS**

   * Rate limit per IP/user/tenant.
   * Pagination & max limits on all list/search endpoints.
   * Resource caps & timeouts on heavy operations.

5. **Mass assignment / over-posting**

   * Explicitly whitelist fields from `req.body`.
   * Separate DTOs: “what normal users can edit” vs “what admins can edit”.

6. **Insecure file handling**

   * Validate file type + size + path.
   * Sensitive files live in **private buckets** (e.g., Supabase) with signed URLs.
   * No user-controlled raw file paths.

7. **Security misconfiguration**

   * No default credentials or open ports.
   * No debug/error stack traces in production responses.
   * CORS must be restrictive (no `*` with credentials).
   * Secrets in env/secret manager, not in code.

8. **Cryptographic failures**

   * HTTPS/TLS mandatory in production.
   * Passwords hashed with bcrypt/argon2 (never plaintext).
   * Use standard, vetted crypto libs; rotate keys when appropriate.

9. **Advanced backend risks**

   * SSRF (no blind fetch to arbitrary URLs from user input).
   * Insecure deserialization (never trust serialized objects).
   * XXE (protect XML parsers or avoid XML where possible).

---

## 🗄 DATABASE & MULTI-TENANT SECURITY – ALWAYS CHECK

1. **Tenant isolation failures**

   * Every relevant table has `tenant_id` (or equivalent).
   * All queries filter by `tenant_id` (and role).
   * RLS policies enforce tenant + role conditions.
   * Never accept tenant_id from client; derive from auth/tenant context.

2. **Row-Level Security (RLS)**

   * RLS must be enabled on all sensitive tables.
   * Policies are explicit for:

     * read (select)
     * write (insert/update/delete)
   * Supabase anon/service keys used carefully with RLS in mind.

3. **Over-privileged DB roles**

   * Separate roles: anon, authenticated user, admin, background worker.
   * App never connects as DB owner/superuser.

4. **Constraints & integrity**

   * Use `FOREIGN KEY`, `CHECK`, `NOT NULL`, `UNIQUE` constraints.
   * Encode critical business rules at DB level where possible.

---

## 🤖 BOTS, ABUSE & BUSINESS LOGIC – ALWAYS CHECK

1. **Bot attacks**

   * DDoS, scraping, credential stuffing.
   * Require rate limiting + captchas (where appropriate) on critical flows.

2. **Spam attacks**

   * Signups, forms, reviews, profiles – protected via captchas, throttling, approvals.

3. **Denial of Service (DoS)**

   * Heavy queries must be paginated & indexed.
   * Background jobs for expensive tasks.

4. **Business logic abuse**

   * Check limits: trials, capacity, quotas, approvals, role transitions.
   * No infinite free trial / bypassable paywalls by simple parameter change.

---

## 📦 SUPPLY CHAIN & TOOLING – ALWAYS CHECK

1. **Vulnerable dependencies**

   * Keep packages/frameworks updated.
   * Use `npm audit`, `composer audit`, etc. regularly.

2. **Malicious/compromised packages**

   * Avoid typosquatting packages.
   * Favor well-known, reputable libraries for critical paths.

3. **Unsafe AI-generated code**

   * Treat AI output as untrusted draft.
   * Review for:

     * hardcoded secrets
     * disabled TLS/verification
     * missing auth checks
   * Use static analysis / linters.

---

## 📜 LOGGING, MONITORING & AUDIT – ALWAYS CHECK

1. **Sensitive data in logs**

   * Never log passwords, full tokens, card numbers, or full PII.
   * Redact or hash sensitive values.

2. **Insufficient monitoring**

   * At minimum: track auth events, key admin actions, and security-relevant errors.
   * Have a basic incident plan: what to do if token/DB/key is compromised.

---

## 📌 DEFAULT BEHAVIOR I EXPECT FROM WINDSURF / CHATGPT

For **every** SQL / DB / Supabase / API / frontend suggestion:

1. **Design with the entire list above in mind by default.**
2. **Identify where specific risks apply** (XSS, IDOR, CSRF, RLS gaps, tenant leaks, etc.).
3. **Propose concrete mitigations** (RLS policies, validation, CSP hints, rate limiting, field whitelists).
4. **Highlight anything risky** or that needs extra hardening (especially admin/super_admin flows and multi-tenant boundaries).

---

You can now drop this whole thing into Windsurf’s memory / project instructions as:

> “Always follow this Security Contract for any frontend, backend, SQL, Supabase, or API code you suggest.”
