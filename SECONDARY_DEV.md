# Secondary Development Notes

Code Shine is a **secondary development** of the upstream *brooks-lint* architecture.
This file documents what we kept, what we changed, and why — so future contributors
(including future-you) can make informed decisions when extending the project.

---

## Why a Secondary Development?

We needed a code-quality skill that:

1. **Works on Codex CLI**, not Claude Code or Gemini CLI.
2. **Covers 20+ languages** out of the box, not just the languages the upstream chose
   to feature in its examples.
3. **Uses the OpenAI SDK** end-to-end, with no Anthropic dependency.
4. **Drops the book-citation framing** — the upstream grounds every finding in a
   specific published book, which is great for a learning tool but awkward for a
   "run on my code right now" workflow. The principles still apply; we cite them
   by name, not by book.
5. **Is lighter to install** — no marketplace plugin, no session-start hook, no
   slash-command wrappers, no GitHub Action. The Codex CLI skill system is the
   single install path.

The upstream architecture is excellent and we wanted to learn from it directly, not
fork it. This is a learning-driven reimplementation: the *shape* of the system is
borrowed, the *content* is rewritten.

---

## What We Kept (Architecture)

These are the design ideas that survive the rewrite because they are the durable
core of the upstream:

| Concept | Where it lives now |
|---------|--------------------|
| **Iron Law** — Symptom → Source → Consequence → Remedy | `skills/_shared/common.md` |
| **Six production decay risks** (R1–R6) | `skills/_shared/decay-risks.md` |
| **Six test decay risks** (T1–T6) | `skills/_shared/test-decay-risks.md` |
| **Health Score** (base 100, severity-based deductions, three strictness presets) | `skills/_shared/common.md` (Health Score Calculation) |
| **Report Template** with Mermaid dependency graph (Mode 2) | `skills/_shared/common.md` (Report Template) |
| **Auto Scope Detection** (git diff → staged → branch → ask) | `skills/_shared/common.md` |
| **Per-mode SKILL.md + guide.md split** with `description:` frontmatter and `Do NOT trigger for:` clause | `skills/codex-*/SKILL.md`, `skills/codex-*/-guide.md` |
| **Step continuity validation** in the validator (sub-steps like `2a`/`6b` allowed) | `scripts/validate-repo.mjs` |
| **History file** (`.code-shine-history.json`) for trend tracking | `scripts/history.mjs` |
| **Custom risks extension** (`Cx` codes) | `skills/_shared/custom-risks-guide.md` |
| **Suppression** with optional `expires:` for triaged findings | `skills/_shared/common.md` (Post-Report Triage) |
| **Eval suite** with structural validation and a live runner | `scripts/run-evals.mjs`, `scripts/run-evals-live.mjs` |

## What We Changed (And Why)

### 1. Removed all Claude / Anthropic traces

- `package.json` declares `openai` instead of `@anthropic-ai/sdk`.
- `scripts/run-evals-live.mjs` uses `OpenAI` instead of `Anthropic`.
- `.claude/`, `.claude-plugin/`, `commands/`, `hooks/`, `CLAUDE.md`, `GEMINI.md`,
  `gemini-extension.json`, `.github/` are removed.
- The validator now actively scans for any leftover `anthropic` / `claude` / `hyhmrright`
  / `brooks-` references in shared files and fails the build if any are found.

### 2. Replaced book citations with principle / smell names

- `skills/_shared/decay-risks.md` and `skills/_shared/test-decay-risks.md` still list
  "Sources" for each symptom, but the source column now reads `Principle / Smell`
  instead of `Book — Chapter`. The same ideas, presented as working vocabulary rather
  than a reading list.
- `source-coverage.md` is gone. The 12-book frontmatter is gone. There is no longer
  a "twelve books" positioning anywhere in the repo.

### 3. Added 20+ language coverage

- `skills/_shared/language-rules.md` is a new file that gives per-family nudges
  (C-family, Systems, Web, Scripting, Functional, Data/Config, Other) for each
  production-code decay risk. Generic rules still apply in every case; the language
  rules sharpen, they do not replace.
- `skills/_shared/common.md` (Language Detection & Coverage) declares the supported
  languages and tells the model what to do with unknown extensions.
- `.code-shine.yaml` gained a `languages:` key for explicit restriction.

### 4. Repositioned as a Codex CLI skill

- `.codex-plugin/plugin.json` is the only plugin manifest. The
  `interface.displayName` / `shortDescription` / `longDescription` fields are tuned
  for the Codex skill directory.
- All six skills are named `codex-*` to match Codex CLI's `$skill-name` invocation
  convention.
- The trigger descriptions in every `SKILL.md` were updated to drop Claude-specific
  references and use Codex-appropriate language.

### 5. Lightened the install footprint

- No `install.sh` (Codex CLI discovers skills from `~/.codex/skills/` directly).
- No `bump-version.mjs`, no `gen-banner.mjs`, no `dev-post-tool-use.mjs` (we do not
  generate banners or wire post-tool hooks).
- No `ci-review.mjs`, no `ci-gate.mjs`, no `sarif.mjs`, no `report-parse.mjs`, no
  `benchmark.mjs` (Codex CLI handles dispatch and the model emits structured Markdown
  reports directly). The validator still ensures every guide file has the right step
  structure and the live eval runner still works when an `evals/evals.json` is present.
- No `gen-banner.mjs` SVG generation; `assets/` keeps only the logo.

### 6. Trimmed to one README, one CHANGELOG, one license

- The upstream carried 5 translated READMEs (en, zh-CN, zh-TW, ja, ko, es) and a
  full docs/ website. Code Shine ships **one** README (English) and
  `SECONDARY_DEV.md` for the design notes. Localization is intentionally out of
  scope — the framework is content-driven Markdown, so a downstream can localize
  without touching the skill structure.

### 7. Restructured the validator to match the new shape

- `scripts/validate-repo.mjs` now enforces:
  - Version consistency between `package.json` and `.codex-plugin/plugin.json`.
  - Shared framework presence (Iron Law, Report Template, Health Score, language rules).
  - Step continuity in every guide (`{mode}/SKILL.md` Process section + sequential guide steps).
  - "Do NOT trigger for:" clause in every `SKILL.md` description.
  - **Negative assertions** — `anthropic`, `claude`, `hyhmrright`, `brooks-` must
    not appear anywhere in the shared or skill files. This is how we keep the
    "secondary development" boundary from drifting.
  - OpenAI SDK presence (`openai` in `dependencies`, no Anthropic in `devDependencies`).

---

## When You're Adding to Code Shine

Use this checklist before opening a PR:

- [ ] Did you add or rename a skill? Update `SKILL_GUIDES` in
      `scripts/validate-repo.mjs` so the new skill is checked.
- [ ] Did you change the version? Update `package.json` AND `.codex-plugin/plugin.json`.
- [ ] Did you add a new language family? Add a `## Family` section in
      `skills/_shared/language-rules.md` and bump the `countLanguageFamilies` floor
      (currently 6) in the validator.
- [ ] Did you add a new risk code (`C1`, `C2`, …)? Update `skills/_shared/common.md`'s
      valid-codes list and the validator's `RISK_CODES` (or use a custom-risks
      extension instead).
- [ ] Did you touch any shared file? Re-run `node scripts/validate-repo.mjs` and
      `node scripts/validate-repo.test.mjs` to make sure the negative-assertion
      scans still pass.
- [ ] Did you add an Anthropic / Claude / `brooks-` / `hyhmrright` reference by
      accident? The validator will flag it — but if you suppressed the error,
      fix it instead.

---

## License & Attribution

This project is released under the MIT License (see [LICENSE](LICENSE)). The original
architecture is from the upstream *brooks-lint* project (MIT). No proprietary assets,
brand names, or contributor identities are inherited — only the *idea* of the
decay-risk framework, which is itself a synthesis of widely-known software-engineering
principles and is not copyrightable.

If you redistribute Code Shine, retain the LICENSE file. If you redistribute a modified
version, please keep the secondary-development boundary honest: do not re-attribute the
upstream as a contributor, and do not imply endorsement by any of its authors.
