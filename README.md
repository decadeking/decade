# Code Shine

> Multi-language code quality analysis for **Codex CLI** — six decay-risk dimensions,
> Symptom → Source → Consequence → Remedy findings, 0–100 Health Score, and out-of-the-box
> support for **20+ programming languages**.

Code Shine is a Codex CLI skill that diagnoses code quality across six dimensions. It works
on any language, integrates with the Codex CLI skill system, and uses the OpenAI SDK
under the hood. It learns the architecture (decay risks + Iron Law + Health Score) from
an open-source upstream design and adapts it for the Codex ecosystem — see
[`SECONDARY_DEV.md`](SECONDARY_DEV.md) for the rationale and the list of deliberate
differences.

## Quick Start

### In a Codex session

```
Install the code-shine skill from this repository, then $codex-review
```

### Manual install

```bash
git clone <this-repo> /tmp/code-shine
mkdir -p ~/.codex/skills
cp -r /tmp/code-shine/skills/* ~/.codex/skills/    # flat — matches Codex skill layout
```

Then just ask ("review this PR", "audit the architecture") — or run a skill directly:

| Command | What it does |
|---------|--------------|
| `$codex-review` | Review a PR or diff |
| `$codex-audit` | Audit architecture (+ Mermaid dependency graph) |
| `$codex-debt` | Prioritized tech-debt roadmap |
| `$codex-test` | Test-suite quality review |
| `$codex-health` | Health dashboard across all dimensions |
| `$codex-sweep` | Sweep every dimension and auto-fix findings |

Every finding comes back as **Symptom → Source → Consequence → Remedy** with a 0–100
Health Score.

## The Six Decay Risks

| Decay Risk | Diagnostic Question |
|------------|---------------------|
| 🧠 Cognitive Overload | How much mental effort to understand this? |
| 🔗 Change Propagation | How many unrelated things break on one change? |
| 📋 Knowledge Duplication | Is the same decision expressed in multiple places? |
| 🌀 Accidental Complexity | Is the code more complex than the problem? |
| 🏗️ Dependency Disorder | Do dependencies flow in a consistent direction? |
| 🗺️ Domain Model Distortion | Does the code faithfully represent the domain? |

Plus six test-space decay risks (T1–T6): Test Obscurity, Test Brittleness, Test
Duplication, Mock Abuse, Coverage Illusion, Architecture Mismatch. See
[`skills/_shared/test-decay-risks.md`](skills/_shared/test-decay-risks.md).

## Language Coverage (20+)

Out of the box, Code Shine recognizes 20+ programming languages and applies
language-specific nudges on top of the generic rules:

| Family | Languages |
|--------|-----------|
| C-family | C, C++, C#, Objective-C, Java, Kotlin, Scala |
| Systems | Rust, Go, Swift, Zig |
| Web | TypeScript, JavaScript, HTML, CSS / SCSS / SASS / LESS |
| Scripting | Python, Ruby, PHP, Perl, Lua, Bash / Shell |
| Functional | Haskell, Elixir, Erlang, Clojure, F#, OCaml |
| Data / Config | SQL, YAML, TOML, JSON, XML, Markdown |
| Other | Dart, R, Julia, MATLAB |

See [`skills/_shared/language-rules.md`](skills/_shared/language-rules.md) for the
per-language checklists.

## What a Finding Looks Like

Given this code:

```python
class UserService:
    def update_profile(self, user_id, name, email, avatar_url):
        user = self.db.query(f"SELECT * FROM users WHERE id = {user_id}")
        user['email'] = email
        ...
        if user['email'] != email:   # always False — silent bug
            self.smtp.send(...)
        points = user['login_count'] * 10 + 500
        self.db.execute(f"UPDATE loyalty SET points={points} WHERE user_id={user_id}")
```

Code Shine produces:

> **Health Score: 28/100**
>
> *This method concentrates four unrelated business responsibilities into a single
> function, contains a logic bug that silently suppresses email change notifications,
> and is wide open to SQL injection.*
>
> ### 🔴 Change Propagation — Single Method Changes for Four Unrelated Business Reasons
> **Symptom:** `update_profile` performs profile field updates, email change
> notifications, loyalty points recalculation, and cache invalidation all in one
> method body.
> **Source:** Code Smell — Divergent Change; Principle — Orthogonality
> **Consequence:** Any change to the loyalty formula risks breaking email
> notifications and vice versa. Every edit carries regression risk across four
> unrelated domains simultaneously.
> **Remedy:** Extract `NotificationService`, `LoyaltyService`, and
> `UserCacheInvalidator`. `UserService.update_profile` should orchestrate by
> calling each — it should hold no implementation logic itself.
>
> ### 🔴 Domain Model Distortion — Silent Logic Bug: Email Notification Never Fires
> **Symptom:** `user['email'] = email` overwrites the old value before
> `if user['email'] != email` — the condition is always `False`. The notification
> is dead code.
> **Source:** Routine design — Unusual Control Structures
> **Consequence:** Users are never notified when their email address changes.
> Silent data integrity failure.
> **Remedy:** Capture `old_email = user['email']` before any mutation. Compare
> against `old_email`, not `user['email']`.

## Configuration

Place a `.code-shine.yaml` in your project root to customize review behavior:

```yaml
version: 1

strictness: balanced   # strict | balanced (default) | legacy-friendly

languages: [python, typescript, go]   # optional: restrict to a subset

disable:
  - T5   # skip coverage metrics check — we don't enforce coverage

severity:
  R1: suggestion   # downgrade Cognitive Overload findings for this domain

ignore:
  - "**/*.generated.*"
  - "**/vendor/**"
  - "**/migrations/**"

# custom_risks:   # define project-specific Cx codes — see skills/_shared/custom-risks-guide.md
# suppress:       # downgrade specific findings by risk + path
```

All settings are optional — omit the file entirely for default behavior.

| Setting | Description |
|---------|-------------|
| `strictness` | Scoring preset: `strict`, `balanced` (default), or `legacy-friendly` |
| `languages` | Restrict analysis to a subset of supported languages |
| `disable` | Risk codes to skip (`R1`–`R6`, `T1`–`T6`, or `Cx`) |
| `severity` | Override severity tier (`critical` / `warning` / `suggestion`) |
| `ignore` | Glob patterns for files to exclude |
| `focus` | Evaluate only these risk codes (cannot combine with `disable`) |
| `custom_risks` | Define project-specific risk codes (`C1`, `C2`, …) |
| `suppress` | Downgrade specific findings by risk + path (optional `expires:` date) |

## Project Structure

```
code-shine/
├── .codex-plugin/                    # Codex CLI plugin metadata
├── skills/
│   ├── _shared/                      # Shared framework files
│   │   ├── common.md                 # Iron Law, Config, Report Template, Health Score
│   │   ├── decay-risks.md            # R1–R6 production risks
│   │   ├── test-decay-risks.md       # T1–T6 test-space risks
│   │   ├── language-rules.md         # 20+ language-specific nudges
│   │   ├── remedy-guide.md           # --fix mode classification
│   │   └── custom-risks-guide.md     # Template for project-specific Cx codes
│   ├── codex-review/                 # Mode 1: PR Review
│   ├── codex-audit/                  # Mode 2: Architecture Audit (+ onboarding)
│   ├── codex-debt/                   # Mode 3: Tech Debt Assessment
│   ├── codex-test/                   # Mode 4: Test Quality Review
│   ├── codex-health/                 # Mode 5: Health Dashboard
│   └── codex-sweep/                  # Mode 6: Full Sweep & Auto-Fix
├── scripts/                          # Validation, history, eval runner, SDK plumbing
├── assets/                           # Logo and other static assets
├── AGENTS.md                         # Guidance for AI agents working on this repo
├── README.md                         # This file
├── SECONDARY_DEV.md                  # Architecture provenance & adaptation notes
├── LICENSE                           # MIT
└── package.json                      # openai SDK, validation scripts
```

## Development Commands

```bash
node scripts/validate-repo.mjs     # Structural validation of the skill tree
node scripts/validate-repo.test.mjs # Unit tests for the script helpers
node scripts/run-evals.mjs          # Structural validation of evals/evals.json
node scripts/run-evals-live.mjs     # Live evals against the OpenAI API
                                    #   (requires OPENAI_API_KEY and an evals file)
node scripts/history.mjs            # View Health Score trend
```

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

This project is a **secondary development** of an open-source upstream architecture.
The decay-risk framework, Iron Law, Health Score, and Mermaid dependency-graph approach
are upstream design ideas. Code Shine re-positions that architecture for Codex CLI +
OpenAI SDK, drops the book-citation framing, adds 20+ language coverage, and strips
host-specific install paths from the upstream. See [`SECONDARY_DEV.md`](SECONDARY_DEV.md)
and [`LICENSE`](LICENSE) for the design provenance and attribution.
