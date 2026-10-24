---
name: coding-standards
description: Universal clean code principles, architectural guidelines, and TypeScript/React production standards with strict QA gate checklists.
---

# Universal Coding Standards & Best Practices

This skill defines the non-negotiable coding and quality standards across all projects. It serves dual roles:
1. **For Production Coder (Stage 4):** Direct implementation blueprint to write clean, maintainable code on the first pass.
2. **For QA Reviewer (Stage 6):** Objective audit and rejection criteria for the Standards Axis.

---

## Part 1: Universal Clean Code Principles (Language-Agnostic)

These principles apply to all languages, frameworks, and environments (TypeScript, Python, Go, Rust, shell scripts, etc.).

### 1. Core Philosophies
* **Readability First:** Code is read 10x more than written. Clear variable and function names over clever brevity. Self-documenting code over excessive comments.
* **KISS (Keep It Simple, Stupid):** Choose the simplest solution that satisfies the spec. Never write premature abstractions or clever one-liners that obscure intent.
* **DRY (Don't Repeat Yourself):** Extract duplicated logic into reusable functions/helpers. Never copy-paste blocks with minor adjustments.
* **YAGNI (You Aren't Gonna Need It):** Never build speculative features, generic layers, or configurability before an explicit requirement exists.

### 2. Universal Structural Standards
* **Function Length Limit:** Keep functions under **50 lines**. If a function exceeds 50 lines, split it into smaller, single-purpose sub-functions.
* **Early Returns (No Deep Nesting):** Limit nesting to **max 2 levels**. Use guard clauses and early returns instead of deeply nested `if/else` blocks:
  ```typescript
  // ❌ BAD: Deep nesting (>2 levels)
  if (user) {
    if (user.isActive) {
      if (hasPermission) {
        processOrder();
      }
    }
  }

  // ✅ GOOD: Early returns
  if (!user || !user.isActive || !hasPermission) return;
  processOrder();
  ```
* **No Magic Numbers or Strings:** Replace unexplained literals with descriptive named constants:
  ```typescript
  // ❌ BAD: Magic numbers
  if (retries > 3) setTimeout(fn, 500);

  // ✅ GOOD: Named constants
  const MAX_RETRIES = 3;
  const DEBOUNCE_DELAY_MS = 500;
  if (retries > MAX_RETRIES) setTimeout(fn, DEBOUNCE_DELAY_MS);
  ```
* **Immutability First:** Avoid direct in-place mutation of objects or collections. Always create updated copies:
  ```typescript
  // ❌ BAD: Direct mutation
  state.items.push(newItem);
  user.name = 'New Name';

  // ✅ GOOD: Immutability via spread / pure transformation
  const updatedItems = [...state.items, newItem];
  const updatedUser = { ...user, name: 'New Name' };
  ```
* **Defensive Error Handling:** Never swallow exceptions or leave catch blocks empty. Wrap async/network operations and log actionable error contexts:
  ```typescript
  // ❌ BAD: Silent swallow
  try { await fetch(url); } catch (e) {}

  // ✅ GOOD: Actionable error propagation
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch from ${url}:`, error);
    throw error;
  }
  ```

---

## Part 2: TypeScript & Modern JavaScript Standards

When working on TypeScript, Node.js, and web codebases, enforce these strict typing standards:

### 1. Strict Type Safety (Zero `any`)
* **Strictly Banned:** Never use `any`. Use `unknown` with type narrowing, generic parameters, or explicit interfaces/types.
* **Explicit Function Return Types:** Document public interface boundaries with clear return types:
  ```typescript
  // ❌ BAD: Implicit any, untyped response
  function getAccount(id: any): Promise<any> { ... }

  // ✅ GOOD: Explicit interfaces & return types
  interface Account {
    id: string;
    email: string;
    status: 'active' | 'suspended';
  }
  function getAccount(id: string): Promise<Account> { ... }
  ```

### 2. Async/Await & Parallel Execution
* **Parallel Execution:** When operations are independent, run them concurrently using `Promise.all` or `Promise.allSettled`:
  ```typescript
  // ❌ BAD: Sequential waterfall
  const users = await fetchUsers();
  const settings = await fetchSettings();

  // ✅ GOOD: Parallel execution
  const [users, settings] = await Promise.all([fetchUsers(), fetchSettings()]);
  ```

---

## Part 3: React & Web Best Practices

When building frontend components and hooks:

### 1. Component Structure & Props Typing
* Every component must have a dedicated TypeScript `interface Props`:
  ```tsx
  interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }

  export function Button({ children, onClick, variant = 'primary', disabled = false }: ButtonProps) {
    return (
      <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`}>
        {children}
      </button>
    );
  }
  ```

### 2. Functional State Updates
* When new state depends on prior state, always use functional state updates to prevent stale closures:
  ```tsx
  // ❌ BAD: Stale closure hazard
  setCount(count + 1);

  // ✅ GOOD: Functional updater
  setCount(prev => prev + 1);
  ```

### 3. Clean Conditional Rendering (No Ternary Hell)
* Keep rendering logic readable with short-circuit evaluation or early returns:
  ```tsx
  // ❌ BAD: Nested ternary hell
  {isLoading ? <Spinner /> : error ? <ErrorDisplay /> : data ? <Content data={data} /> : null}

  // ✅ GOOD: Clean conditionals
  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} />;
  return data ? <Content data={data} /> : null;
  ```

### 4. Custom Hooks & Memoization
* Extract stateful, repetitive logic into standalone custom hooks prefixed with `use` (e.g., `useDebounce`, `useLocalStorage`).
* Use `useMemo` and `useCallback` deliberately for expensive computations and stable references—not indiscriminately for trivial operations.

---

## Part 4: API Design & Schema Validation

### 1. RESTful Conventions
* Follow standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
* Return unified JSON response structures:
  ```typescript
  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
      total: number;
      page: number;
      limit: number;
    };
  }
  ```

### 2. Schema Validation via Zod
* Validate all incoming request payloads, user forms, and external API responses using schemas:
  ```typescript
  import { z } from 'zod';

  export const UserInputSchema = z.object({
    email: z.string().email(),
    age: z.number().int().min(18),
  });
  ```

---

## Part 5: Testing Standards (AAA Pattern)

Every test must follow the **Arrange-Act-Assert (AAA)** structure with descriptive test names:
```typescript
test('calculates discount correctly for premium members', () => {
  // Arrange
  const user = { tier: 'premium' };
  const basePrice = 100;

  // Act
  const finalPrice = calculatePrice(user, basePrice);

  // Assert
  expect(finalPrice).toBe(80);
});
```

---

## Part 6: QA Reviewer Hard-Gate Audit Checklist

When auditing code under **Axis A (Standards Axis)**, evaluate against this matrix:

| Severity | Defect Type | Action |
| :--- | :--- | :--- |
| **CRITICAL (Hard Gate)** | Use of `any` type in TypeScript | **REJECT back to Coder** |
| **CRITICAL (Hard Gate)** | Direct state/object mutation (e.g. `arr.push`, `obj.x = y`) | **REJECT back to Coder** |
| **CRITICAL (Hard Gate)** | Unhandled errors / swallowed exceptions | **REJECT back to Coder** |
| **CRITICAL (Hard Gate)** | Deep nesting (> 2 levels) without early return | **REJECT back to Coder** |
| **CRITICAL (Hard Gate)** | Monolithic function (> 50 lines) | **REJECT back to Coder** |
| **CRITICAL (Hard Gate)** | Magic numbers/strings without named constants | **REJECT back to Coder** |
| **WARNING (Soft)** | Missing JSDoc on internal non-exported function | Record in QA Report, allow pass |
| **WARNING (Soft)** | Minor formatting preference | Record in QA Report, allow pass |
