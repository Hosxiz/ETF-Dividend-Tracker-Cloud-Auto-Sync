---
name: agent-team
description: Automated 7-stage software engineering pipeline executing Architect, UI/UX Designer, Researcher, Coder, Security Auditor, QA Reviewer, and Technical Writer with conditional fast-paths.
---

# Agent Team: 7-Stage Automated Engineering Pipeline

This skill orchestrates a complete 7-stage engineering lifecycle. When triggered with any task, execute each stage sequentially while applying conditional fast-paths when appropriate.

## Pipeline Flow

```
[User Task]
   │
   ▼
[Stage 1: Architect] ──▶ Generates .agents/specs/ARCH_SPEC.md
   │
   ├─► (Has Frontend/UI?) ──▶ [Stage 2: UI/UX Designer] ──▶ Generates .agents/specs/UIUX_SPEC.md
   │                                   │
   ▼                                   ▼
[Stage 3: Researcher] ◀────────────────┘
   │
   ▼
[Stage 4: Coder] ──▶ Implements code files adhering strictly to specs
   │
   ├─► (Has Auth/API/Data?) ──▶ [Stage 5: Security Auditor] ──▶ Generates .agents/specs/SECURITY_AUDIT.md
   │                                       │
   ▼                                       ▼
[Stage 6: QA Reviewer] ◀───────────────────┘
   │
   ▼
[Stage 7: Tech Writer] ──▶ Updates documentation, README.md, and guides
   │
   ▼
[Completed Delivery]
```

---

## Step-by-Step Execution Protocol

### Step 1: Initialize Specification Directory
Ensure the specifications folder exists:
```powershell
mkdir -p .agents/specs
```

### Step 2: Stage 1 - System Architect
1. Read the user requirements thoroughly.
2. Read `.agents/rules/01-architect.md`, `.agents/skills/software-architecture/SKILL.md`, and `.agents/skills/agent-team/templates/ARCH_SPEC.md`.
3. Design module architecture, interfaces, bounded contexts, and domain-specific directory layout (no generic utils/helpers; budget <= 200 lines per file).
4. Write the completed plan into `.agents/specs/ARCH_SPEC.md`.

### Step 3: Stage 2 - UI/UX Designer *(Conditional: Skip if non-UI)*
- **Condition:** Execute if the task contains web, mobile, desktop, or visual interfaces.
- **Protocol:**
  1. Read `.agents/rules/02-ui-ux-designer.md` and `.agents/skills/agent-team/templates/UIUX_SPEC.md`.
  2. Define theme tokens, color palettes, responsive layout hierarchy, and state matrix.
  3. Write findings into `.agents/specs/UIUX_SPEC.md`.

### Step 4: Stage 3 - Technical Researcher
1. Read `.agents/rules/03-researcher.md`, `.agents/skills/software-architecture/SKILL.md` (Library-First approach), `.agents/specs/ARCH_SPEC.md`, and `.agents/specs/UIUX_SPEC.md` (if applicable).
2. Inspect workspace dependencies, environment tools, and official documentation.
3. Validate existing packages before endorsing custom code (Anti-NIH policy).
4. Validate all versions, syntax details, and edge cases.
5. Write findings into `.agents/specs/RESEARCH_NOTE.md`.

### Step 5: Stage 4 - Production Coder
1. Read `.agents/rules/04-coder.md`, `.agents/skills/coding-standards/SKILL.md`, `.agents/specs/ARCH_SPEC.md`, `.agents/specs/RESEARCH_NOTE.md`, and `.agents/specs/UIUX_SPEC.md` (if applicable).
2. Implement production-ready code enforcing Clean Code standards (zero `any`, immutability, early returns, functions <50 lines).
3. Verify zero placeholder comments, dummy values, or unrequested changes exist.

### Step 6: Stage 5 - Security Auditor *(Conditional: Skip if purely cosmetic/docs)*
- **Condition:** Execute if the task involves Authentication, APIs, User Inputs, or Sensitive Data.
- **Protocol:**
  1. Read `.agents/rules/05-security-auditor.md` and `.agents/skills/agent-team/templates/SECURITY_AUDIT.md`.
  2. Audit code for secrets, OWASP Top 10 vulnerabilities, and authorization flaws.
  3. Record audit results in `.agents/specs/SECURITY_AUDIT.md`.
  4. If Critical/High defects are found, reject back to Stage 4 for remediation.

### Step 7: Stage 6 - QA & Code Reviewer
1. Read `.agents/rules/06-qa-reviewer.md` and `.agents/skills/coding-standards/SKILL.md`.
2. Execute Two-Axis Code Review (Standards Axis with Hard Gate checklist + Spec Axis).
3. Write unit/integration tests following the AAA pattern to verify functionality and boundary conditions.
4. Execute the tests and linters using terminal commands.
5. If Hard Gate violations or test failures occur, reject back to Stage 4 until 100% clean.
6. Record results in `.agents/specs/QA_REPORT.md`.

### Step 8: Stage 7 - Technical Writer
1. Read `.agents/rules/07-technical-writer.md`.
2. Review implemented files and verified terminal commands.
3. Write or update `README.md` and module documentation.
4. Report the completion of the 7-stage pipeline to the user with a concise summary.
