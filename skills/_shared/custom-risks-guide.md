# Custom Risks Guide

Define project-specific decay risks in `.code-shine.yaml` to extend the six built-in
production risks (R1–R6) and six test risks (T1–T6) with codes `C1`, `C2`, …

> Use this when the standard risks don't cover a domain-specific concern your team
> cares about (security, accessibility, performance budget, data privacy, etc.).

---

## Defining a Custom Risk

```yaml
custom_risks:
  C1:
    name: Security Debt
    question: "Are there known security vulnerabilities being deferred?"
    symptoms:
      - "Hardcoded credentials or API keys"
      - "Missing input validation on user-facing endpoints"
      - "Dependencies with known CVEs not updated"
    severity:
      critical: "Exploitable vulnerability in production"
      warning: "Known vulnerability with mitigating controls"
      suggestion: "Best-practice deviation with no current exposure"
```

### Required fields

| Field | Description |
|-------|-------------|
| `name` | Short human-readable name (used in report headings). |
| `question` | The diagnostic question, mirroring the R1–R6 / T1–T6 style. |
| `symptoms` | Bullet list of observable patterns that indicate this risk is present. |
| `severity` | Map of `critical` / `warning` / `suggestion` to triggering conditions. |

### Optional fields

| Field | Description |
|-------|-------------|
| `what_not_to_flag` | Bullet list of false-positive guards. |
| `language` | Restrict this risk to one or more languages; omit to apply to all. |
| `applies_to` | `production` (default) or `test`. |

---

## Example: Performance Budget Debt

```yaml
custom_risks:
  C2:
    name: Performance Budget Debt
    question: "Are there hot paths exceeding the agreed performance budget?"
    symptoms:
      - "Synchronous I/O on request paths"
      - "N+1 query patterns in ORM usage"
      - "Bundle size > agreed limit (e.g. 250KB main chunk)"
    severity:
      critical: "Hot path > 2x budget"
      warning: "Hot path 1.2x–2x budget"
      suggestion: "Approaching budget under new feature work"
    applies_to: production
    language: [typescript, javascript]
```

---

## Referencing Custom Risks in Config

Once defined, `Cx` codes become valid in every other field:

```yaml
custom_risks:
  C1: { ... }
  C2: { ... }

disable:
  - C1   # skip Security Debt
focus:
  - C2   # only evaluate Performance Budget Debt

severity:
  C1: warning   # downgrade Security Debt regardless of guide

suppress:
  - risk: C1
    pattern: "legacy/auth.py"
    reason: "Accepted — migration in progress"
    expires: "2026-12-31"
```

---

## Loading & Reporting

- `code-shine` reads `custom_risks:` from `.code-shine.yaml` at the start of every
  scan, in addition to the built-in R1–R6 / T1–T6 definitions.
- A finding for a custom risk uses the same Iron Law form (Symptom → Source →
  Consequence → Remedy); the `Source:` line uses the custom risk's `name` rather
  than a generic principle.
- Custom risks participate in the Health Score with the same deduction weights
  (Critical / Warning / Suggestion) as the built-in risks.
- If a custom risk references a `language` not in the active scan, it is silently
  skipped (with a note in the report's Scope line).

---

## Versioning

- The `custom_risks` schema follows the same `version:` key as the rest of
  `.code-shine.yaml`. Today: `version: 1`.
- New optional fields may be added in later versions. Unknown fields are warned
  about and ignored — never silently mis-applied.
- Removing or renaming a custom risk does not retroactively change history
  records; old `Cx` codes in `.code-shine-history.json` remain as-is.
