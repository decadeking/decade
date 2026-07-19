import { readFileSync } from "node:fs";
import path from "node:path";

/** Canonical list of valid mode names — import from here to avoid drift. */
export const VALID_MODES = ["review", "audit", "debt", "test", "health", "sweep"];

/**
 * Assemble the system prompt for a given code-shine mode.
 * Shared by: live eval runner and any external automation that needs the
 * system prompt for a single mode.
 *
 * @param {string} mode - one of VALID_MODES
 * @param {string} skillsDir - absolute path to skills/ directory
 * @returns {string} concatenated system prompt with --- separators
 */
export function assembleSystemPrompt(mode, skillsDir) {
  const sharedDir = path.join(skillsDir, "_shared");

  const read = (filePath) => readFileSync(filePath, "utf8");

  const sections = [
    read(path.join(sharedDir, "common.md")),
  ];

  // Add risk definitions based on mode
  if (mode === "test") {
    sections.push(read(path.join(sharedDir, "test-decay-risks.md")));
  } else if (mode === "health" || mode === "sweep") {
    sections.push(read(path.join(sharedDir, "decay-risks.md")));
    sections.push(read(path.join(sharedDir, "test-decay-risks.md")));
    sections.push(read(path.join(sharedDir, "language-rules.md")));
  } else {
    sections.push(read(path.join(sharedDir, "decay-risks.md")));
    sections.push(read(path.join(sharedDir, "language-rules.md")));
  }

  // Add mode-specific guide
  const guideMap = {
    review: ["codex-review", "pr-review-guide.md"],
    audit: ["codex-audit", "architecture-guide.md"],
    debt: ["codex-debt", "debt-guide.md"],
    test: ["codex-test", "test-guide.md"],
    health: ["codex-health", "health-guide.md"],
    sweep: ["codex-sweep", "sweep-guide.md"],
  };

  const [modeDir, guideFile] = guideMap[mode] ?? (() => { throw new Error(`Unknown mode: ${mode}`); })();
  sections.push(read(path.join(skillsDir, modeDir, guideFile)));

  return sections.join("\n\n---\n\n");
}
