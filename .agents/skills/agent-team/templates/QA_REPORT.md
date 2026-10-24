# QA Audit & Verification Report: [Feature / Project Name]

## 1. Audit Summary
- **Overall Status:** [PASS / NEEDS REVISION]
- **Auditor:** QA & Code Reviewer
- **Timestamp:** 

## 2. Two-Axis Code Review Findings
### Axis A: Standards & Code Smells (Repo standards + 12 Smells)
- **Status:** [PASS / NEEDS REVISION]
- **Findings:**
  - *No smells detected / or list violations with line references:*
  - [e.g., `src/utils.ts:L42` - Speculative Generality: Unused configuration hook]

### Axis B: Spec Compliance (Audit against ARCH_SPEC.md)
- **Status:** [PASS / NEEDS REVISION]
- **Findings:**
  - **Missing / Partial:** None
  - **Scope Creep:** None (No unauthorized additions)
  - **Implementation Mismatches:** None

## 3. Test Execution Results
| Test Suite / Command | Total | Passed | Failed | Duration |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |

## 4. Code Quality & Standards Checklist
- [ ] Strict Type Safety: Zero `any` types found
- [ ] Immutability: Zero direct mutations (spread/pure used)
- [ ] Function Size: All functions <= 50 lines
- [ ] Early Returns: Nesting <= 2 levels
- [ ] Named Constants: Zero magic numbers or strings
- [ ] Linting & Typecheck passed with 0 errors
- [ ] Boundary conditions and empty states tested
- [ ] Zero unhandled exceptions or memory leaks
- [ ] Zero placeholder comments or dead code

## 5. Remediation Items (If Rejected)
1. **[Defect Title]:** File and line citation with required fix.
