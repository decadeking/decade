# Remedy Mode Guide

Apply this when the user passes `--fix` or asks to "fix the findings".
Read the regular `decay-risks.md` first; this file adds the *remedy enhancement*
rules that turn each finding from a diagnosis into a concrete edit plan.

## Iron Law (re-stated for fix mode)

```
Fix only what the Iron Law justified.
Every change must be verifiable: a test, a build, or a static check.
```

A fix without an Iron Law finding is speculative. A fix without a verification step
is wishful thinking.

---

## Pre-Flight Consent

**Required in interactive sessions.** Before making any file changes, output:

```
About to apply N fixes (M Critical, K Warning, J Suggestion).
- A changes will be auto-applied (safe, single-file, behavior-preserving).
- B changes will require confirmation per-file.
- C changes will be flagged for manual review (architectural decisions).

Proceed? [yes / no / dry-run]
```

In CI / headless mode, skip the prompt and apply only the `A` (safe) bucket.

---

## Fix Classification

Every finding maps to one of three fix buckets. The bucket determines whether the fix
is auto-applied, confirmed per-file, or left to the human.

### Bucket A — Safe Auto-Fix

Edits that:
- Touch a single file
- Preserve observable behavior (compile-time equivalent or covered by tests)
- Have a clear "before" and "after" with no semantic ambiguity
- Examples:
  - Rename a misleading variable / function / class name (R1)
  - Extract a magic number into a named constant (R1)
  - Replace a boolean flag argument with two separate methods (R1)
  - Collapse a flag-argument method into two clearer methods (R1)
  - Remove an unused private method (R4)
  - Replace a lazy-class delegation with direct use (R4)
  - Convert a `String` field to an enum / newtype (R6)

### Bucket B — Per-File Confirm

Edits that:
- Touch multiple files but in clearly coordinated ways
- May change a public API surface (callers need awareness)
- Require a unit test to remain green
- Examples:
  - Extract a duplicated block into a shared helper (R3)
  - Split a long method by responsibility (R1)
  - Replace a constructor parameter object with a typed wrapper (R6)
  - Reorganize imports across a package boundary (R5)

### Bucket C — Manual Review

Decisions that:
- Change architecture, not just code (R2, R5)
- Require product / domain input (R6)
- May break a public contract and need a deprecation path (R2)
- Examples:
  - Break a dependency cycle (R5)
  - Decide which of two parallel hierarchies to keep (R3)
  - Replace an anemic service with a domain entity (R6)
  - Decompose a divergent-change class (R2)

---

## Verification Step

Every applied fix MUST end with a verification step:

| Change Type | Verification |
|-------------|--------------|
| Bucket A behavior-preserving | `project test` (or `cargo test`, `go test`, `pytest`, etc.) |
| Bucket B API-touching | `project test` + grep for callers of the changed surface |
| Bucket C architectural | `project test` + manual reviewer sign-off |

If verification fails: revert the change, leave the finding as-is, note the failure
in the report's **Unresolved** section.

---

## Output Format (Fix Mode)

After applying fixes, the report gains a `Fix Log` section before `Summary`:

````
## Fix Log

| # | Risk | Title | Bucket | File | Result |
|---|------|-------|--------|------|--------|
| 1 | R1 | Rename `tmp2` → `retryCount` | A | src/api/retry.ts | Applied ✅ |
| 2 | R3 | Extract duplicated validator | B | src/validation/*.ts | Confirmed ✅ |
| 3 | R5 | Break `core → infra` cycle | C | src/core/order.ts | Manual review ⚠️ |

### Verification
- Test command: `pytest`
- Tests: 312 passed / 0 failed
- Type check: `tsc --noEmit` clean
- Lint: clean

### Unresolved
- 1 finding left for manual architectural decision (see Fix #3).
- 0 verification failures.
````

---

## What Not to Auto-Fix

- Anything that touches a public API without a deprecation note.
- Anything where the test suite is missing for the affected module (legacy code).
- Anything that requires a runtime decision (which value to pick from a config set).
- Anything that would generate > 100 lines of churn in a single file — flag it for manual review instead.

When in doubt, classify as Bucket C and let a human decide.
