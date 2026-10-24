# Phase Handoff Verification Gate (7-Stage Pipeline)

Before transitioning between pipeline stages, the current stage must verify and check off all prerequisites:

## Gate 1: Architect -> UI/UX Designer or Researcher
- [ ] Requirements fully analyzed and unambiguous
- [ ] Directory structure and bounded contexts defined
- [ ] Zero dumping ground folders/files (`utils`, `helpers`, `common`, `shared`)
- [ ] File size budget verified: All module files budgeted <= 200 lines
- [ ] Clean Architecture separation: Zero business logic in UI; zero DB queries in controllers
- [ ] Data contracts and interfaces documented in `.agents/specs/ARCH_SPEC.md`
- [ ] Path chosen: UI/UX Designer (if Frontend) OR fast-path to Researcher (if Backend/Headless)

## Gate 2: UI/UX Designer -> Researcher (Conditional)
- [ ] Design tokens, typography, and palette finalized
- [ ] Layout hierarchy and responsive breakpoints specified
- [ ] Component states (default, hover, loading, empty, error) defined in `.agents/specs/UIUX_SPEC.md`

## Gate 3: Researcher -> Coder
- [ ] Library-First evaluated: Checked for existing packages/SaaS before custom code (Anti-NIH)
- [ ] All external packages/tools verified for compatibility
- [ ] Deprecated APIs flagged and alternative verified
- [ ] Critical edge cases and concurrency concerns documented in `.agents/specs/RESEARCH_NOTE.md`

## Gate 4: Coder -> Security Auditor or QA Reviewer
- [ ] Implementation completed strictly matching spec
- [ ] Code adheres to Clean Code standards (immutability, functions <50 lines, early returns, named constants)
- [ ] Type safety verified: Zero `any` types and defensive error handling implemented
- [ ] No temporary placeholders, stubbed returns, or dead code
- [ ] Path chosen: Security Auditor (if Auth/API/Data) OR fast-path to QA Reviewer

## Gate 5: Security Auditor -> QA Reviewer (Conditional)
- [ ] Zero hardcoded secrets or environment exposures
- [ ] OWASP Top 10 vulnerabilities checked and cleared
- [ ] Audit report finalized in `.agents/specs/SECURITY_AUDIT.md` with PASS status

## Gate 6: QA Reviewer -> Technical Writer
- [ ] Standards Axis: PASS (Zero Hard Gate violations from `.agents/skills/coding-standards/SKILL.md`)
- [ ] Spec Axis: PASS (Zero missing requirements, zero scope creep)
- [ ] Unit and integration tests written and passing (100%)
- [ ] Static analysis/linter passed with 0 errors
- [ ] QA verification report finalized in `.agents/specs/QA_REPORT.md` with PASS status

## Gate 7: Technical Writer -> Completion
- [ ] `README.md` updated with run/test instructions
- [ ] API signatures and usage guides documented
- [ ] Changelog entry recorded
