---
name: software-architecture
description: Clean Architecture, Domain-Driven Design (DDD), Library-First approach, and modular decomposition principles for high-quality software development.
---

# Software Architecture & Modular System Design

This skill defines the architectural standards, domain decomposition rules, and package selection policies across the engineering lifecycle.

---

## 1. Core Principles

### Clean Architecture & Domain-Driven Design (DDD)
* **Separation of Concerns:**
  * **Domain Layer:** Pure business entities and use cases. Zero dependencies on frameworks, databases, or UI.
  * **Interface / Presentation Layer:** Pure UI components and API controllers. **STRICTLY FORBIDDEN** to embed business calculations or direct database queries in UI/controllers.
  * **Infrastructure Layer:** Concrete database queries, external API clients, file system access.
* **Bounded Contexts:** Group modules by domain boundary (e.g., `Billing`, `Authentication`, `Catalog`), not by technical layer (do not create horizontal slices that lump all models or controllers together).

---

## 2. Strict Naming Conventions & Anti-Patterns

### Anti-Generic Naming (BANNED: `utils`, `helpers`, `common`, `shared`)
* **Strictly Banned:** Files or directories named `utils.ts`, `helpers.js`, `common/`, or `shared/` that serve as miscellaneous dumping grounds for unrelated logic.
* **Mandatory Domain Naming:** Every utility or calculation module must reflect its exact business or technical domain:
  * ❌ `utils/misc.ts` ➔ ✅ `pricing/TaxCalculator.ts`
  * ❌ `helpers/auth.ts` ➔ ✅ `auth/UserAuthenticator.ts`
  * ❌ `common/format.ts` ➔ ✅ `formatting/CurrencyFormatter.ts`

### File & Function Size Limits
* **File Size Cap (200 Lines):** Keep files under **200 lines of code**. If a file exceeds 200 lines, decompose it into focused sub-modules or separate domain components.
* **Function Size Cap (50 Lines):** Keep functions under **50 lines of code**. Extract discrete stages into smaller named functions.
* **Early Return Pattern:** Always use guard clauses and early returns. Maximum allowed nesting depth is **2 levels** (never exceed 3 levels).

---

## 3. Library-First Approach (Anti-NIH Syndrome)

> **"Every line of custom code is a liability that requires testing, debugging, and lifelong maintenance."**

Before proposing or writing custom code, engineers must search the package registry (npm, PyPI, Crates.io) or existing cloud/SaaS solutions:
* **Authentication:** Prefer Supabase Auth, Auth0, or NextAuth over custom JWT/session implementations.
* **State Management:** Prefer Zustand, Redux Toolkit, or Jotai over custom global stores.
* **Resilience & Retries:** Prefer established libraries (e.g., `cockatiel`, `p-retry`) over custom exponential backoff loops.
* **Validation:** Prefer Zod or Pydantic over hand-rolled regex/type checking.

### When Custom Code IS Justified:
1. Unique, domain-specific core business logic.
2. Extreme performance-critical paths where third-party packages introduce unacceptable overhead.
3. Zero-dependency constraints or security-hardened air-gapped runtimes.
4. When existing libraries have documented vulnerabilities, are abandoned, or do not fulfill the required contract.

---

## 4. Architectural Quality Gate Checklist

When evaluating an architecture spec or auditing code:
* [ ] Zero business logic residing inside React components or API controllers.
* [ ] Zero folders or files named `utils`, `helpers`, or `misc`.
* [ ] All files estimated or written under 200 lines of code.
* [ ] Third-party libraries verified for common cross-cutting concerns (Auth, Retry, Validation).
* [ ] Single responsibility per module adhering to ubiquitous domain language.
