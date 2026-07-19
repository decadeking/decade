# AGENTS.md

This repository is **Code Shine**, a Codex CLI skill for multi-language code quality analysis.
It learns the architecture (six decay-risk dimensions + Iron Law + Health Score) from
an open-source upstream design but is re-positioned for Codex CLI + OpenAI SDK and
supports 20+ programming languages out of the box.

> **Note:** This file is for Codex CLI / AI agents working on the **Code Shine codebase
> itself**. End users of Code Shine should read `README.md` and the per-skill guides in
> `skills/codex-*/SKILL.md`.

## Core Purpose

**Code Shine** is a portable Codex CLI skill for code quality diagnosis across six "decay risk"
dimensions: Cognitive Overload, Change Propagation, Knowledge Duplication, Accidental
Complexity, Dependency Disorder, and Domain Model Distortion. It supports 20+ programming
languages via `skills/_shared/language-rules.md` and produces structured findings in
**Symptom → Source → Consequence → Remedy** form with severity labels and a 0–100 Health
Score.

## Skill Activation (in Codex)

- **Auto-trigger:** Codex CLI matches each skill's `description:` field against the user's
  request and activates the appropriate skill automatically.
- **Explicit invocation:** Use `$codex-review`, `$codex-audit`, `$codex-debt`,
  `$codex-test`, `$codex-health`, or `$codex-sweep` inside a Codex session.

## Engineering Standards

- **Iron Law:** NEVER suggest fixes before completing risk diagnosis. Every finding MUST
  follow: **Symptom → Source → Consequence → Remedy**.
- **Scoring:** Base 100. Deductions: 🔴 Critical (−15), 🟡 Warning (−5), 🟢 Suggestion
  (−1). Preset `strict` (−20/−8/−2) and `legacy-friendly` (−8/−3/−1) are available. Floor 0.
- **Project Config:** If a `.code-shine.yaml` exists in the project root, read and apply
  it before running any review mode.
- **SKILL.md Process vs guide steps:** `SKILL.md` Process is a high-level skeleton
  (3–6 items) that cites guide Step ranges inline (e.g. `Scan decay risks (Steps 1–7 of
  the guide)`); the guide owns the detailed numbered steps. Counts do NOT need to match
  1:1. `node scripts/validate-repo.mjs` checks guide step continuity (sub-steps like
  `2a`/`6b` allowed) and SKILL.md Process-section presence.
- **Trigger descriptions:** Every `SKILL.md` `description:` field must include a
  "Do NOT trigger for:" clause defining the negative boundary to prevent false triggering.

## Project Structure

- `skills/codex-review/`: PR Review skill and guide.
- `skills/codex-audit/`: Architecture Audit skill and guide (+ onboarding mode).
- `skills/codex-debt/`: Tech Debt Assessment skill and guide.
- `skills/codex-test/`: Test Quality Review skill and guide.
- `skills/codex-health/`: Health Dashboard skill and guide.
- `skills/codex-sweep/`: Full Sweep & Auto-Fix skill and guide.
- `skills/_shared/`: Shared framework (common.md, decay-risks.md, test-decay-risks.md,
  language-rules.md, remedy-guide.md, custom-risks-guide.md).
- `.codex-plugin/`: Plugin metadata for Codex CLI installation.
- `scripts/`: Validation, history, eval runner, and SDK prompt-assembly helpers. Uses
  the `openai` Node SDK (no Anthropic dependency).
- `assets/`: Logo and other static assets used by `.codex-plugin/plugin.json`.

## Why "Code Shine"?

The name signals the goal: **make code shine** by surfacing decay risks consistently
across many languages, with every finding traceable to a named principle and accompanied
by a concrete remedy. The architecture (six decay risks, Iron Law, Health Score, Mermaid
dependency graph) is the durable core; the language coverage, the SDK choice, and the
host platform are all replaceable.

For background on the architecture's provenance and how this project adapts it, see
[`SECONDARY_DEV.md`](SECONDARY_DEV.md).
