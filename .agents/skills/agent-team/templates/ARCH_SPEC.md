# System Architecture Specification: [Feature / Project Name]

## 1. Overview & Objective
- **Problem Statement:** 
- **Target Outcome:** 

## 2. System Topology & Bounded Contexts
- **Domain Modules:** (Strictly domain-named, e.g. `billing/`, `auth/`; NO `utils/` or `helpers/`)
- **File Size Budget:** Max 200 lines per file; max 50 lines per function.
```text
[project-root]/
└── src/
    ├── [domain-module]/
    └── ...
```

## 3. Data Models & Interface Contracts
```typescript
// Define key data types, schemas, and signatures
// Keep domain logic isolated from UI components and API controllers
```

## 4. Error Handling & Resilience Strategy
- **Failure Modes:**
- **Fallback / Retry Behavior:** (Leverage existing libraries over custom retry loops)

## 5. Non-Negotiable Architectural Constraints
- [ ] Clean Architecture separation: Zero business logic in UI; zero DB queries in controllers
- [ ] Zero dumping ground folders/files (`utils`, `helpers`, `common`, `shared`)
- [ ] All module files budgeted <= 200 lines of code
- [ ] Library-First evaluated for cross-cutting concerns (Auth, Retry, State, Validation)
