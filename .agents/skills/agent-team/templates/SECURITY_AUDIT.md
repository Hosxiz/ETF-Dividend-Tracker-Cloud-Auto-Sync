# Security Audit Report: [Feature / Project Name]

## 1. Audit Summary
- **Overall Status:** [PASS / NEEDS REMEDIATION]
- **Auditor:** Security Auditor
- **Date:** 

## 2. Vulnerability Checklist (OWASP Top 10)
| Check Category | Status | Notes / Scope |
| :--- | :--- | :--- |
| Secrets & API Keys Exposure | [PASS / FAIL / N/A] | Zero hardcoded credentials or keys |
| Injection (SQL / Command / XSS) | [PASS / FAIL / N/A] | Parameterized queries & sanitization |
| Broken Access Control & Auth | [PASS / FAIL / N/A] | RBAC & session verification |
| Insecure Direct Object References (IDOR) | [PASS / FAIL / N/A] | Object-level authorization check |
| SSRF & Unsafe Network Calls | [PASS / FAIL / N/A] | Strict destination whitelist |
| Dependency Vulnerabilities (CVE) | [PASS / FAIL / N/A] | Known vulnerable packages check |

## 3. Discovered Vulnerabilities & Remediations
| # | Severity | File & Location | Vulnerability Description | Required Fix |
| :- | :--- | :--- | :--- | :--- |
| 1 | [Critical/High/Med/Low] | `path/to/file:L10` | | |

## 4. Final Verdict & Gate Decision
- [ ] **PASSED:** No Critical or High severity vulnerabilities. Ready for QA.
- [ ] **REJECTED:** Returned to Coder for immediate remediation.
