/**
 * Unit tests for code-shine script utilities.
 *
 * Run:  node scripts/validate-repo.test.mjs
 *
 * Uses Node.js built-in assert — no test framework required.
 * Covers the helpers we actually ship (frontmatter, history, eval-utils, prompt assembly).
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { assembleSystemPrompt, VALID_MODES } from "./assemble-prompt.mjs";
import { readHistory, appendHistory, getTrend, normalizeMode, sparkline, renderHistory } from "./history.mjs";
import {
  countProductionRisks,
  countTestRisks,
  countLanguageFamilies,
  extractGuideStepLabels,
  readPackageVersion,
} from "./frontmatter.mjs";
import { extractRiskCodes, classify } from "./eval-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── countProductionRisks ───────────────────────────────────────────────────

console.log("\ncountProductionRisks");

test("counts '## Risk N:' headers", () => {
  const text = "## Risk 1: Cognitive Overload\n## Risk 2: Change Propagation\n## Risk 3: Knowledge Duplication\n";
  assert.equal(countProductionRisks(text), 3);
});

test("returns 0 when no production risk headers present", () => {
  assert.equal(countProductionRisks("## Risk T1: Test Obscurity\n"), 0);
});

test("does not count test risk headers (Risk T…)", () => {
  const text = "## Risk T1: Test Obscurity\n## Risk 1: Real Risk\n";
  assert.equal(countProductionRisks(text), 1);
});

// ── countTestRisks ─────────────────────────────────────────────────────────

console.log("\ncountTestRisks");

test("counts '## Risk TN:' headers", () => {
  const text = "## Risk T1: Test Obscurity\n## Risk T2: Test Brittleness\n";
  assert.equal(countTestRisks(text), 2);
});

test("returns 0 when no test risk headers present", () => {
  assert.equal(countTestRisks("## Risk 1: Cognitive Overload\n"), 0);
});

// ── countLanguageFamilies ──────────────────────────────────────────────────

console.log("\ncountLanguageFamilies");

test("counts '## ' sections in language-rules.md", () => {
  const text = "## C-family\n## Systems\n## Web\n## Scripting\n## Functional\n## Data / Config\n";
  assert.equal(countLanguageFamilies(text), 6);
});

// ── readPackageVersion ─────────────────────────────────────────────────────

console.log("\nreadPackageVersion");

test("extracts version field from package.json", () => {
  const pkg = JSON.stringify({ name: "code-shine", version: "1.0.0" });
  assert.equal(readPackageVersion(pkg), "1.0.0");
});

test("returns null on invalid JSON", () => {
  assert.equal(readPackageVersion("not json"), null);
});

test("returns null when version is missing", () => {
  assert.equal(readPackageVersion("{}"), null);
});

// ── extractGuideStepLabels ───────────────────────────────────────────────

console.log("\nextractGuideStepLabels");

test("extracts step labels from standard headings", () => {
  const text = "### Step 1: Understand scope\n### Step 2: Scan\n### Step 3: Output\n";
  assert.deepEqual(extractGuideStepLabels(text), ["1", "2", "3"]);
});

test("extracts sub-step labels (a/b suffixes)", () => {
  const text = "### Step 2a: Scan for Brittleness\n### Step 2b: Scan for Mock Abuse\n";
  assert.deepEqual(extractGuideStepLabels(text), ["2a", "2b"]);
});

test("handles 0-indexed steps", () => {
  const text = "### Step 0: Gather Context\n### Step 1: Draw Graph\n### Step 2: Scan\n";
  assert.deepEqual(extractGuideStepLabels(text), ["0", "1", "2"]);
});

// ── assembleSystemPrompt / VALID_MODES ─────────────────────────────────────

console.log("\nassembleSystemPrompt");

test("includes sweep in VALID_MODES", () => {
  assert.ok(VALID_MODES.includes("sweep"));
});

test("assembles sweep prompt with both risk catalogs, language rules, and sweep guide", () => {
  const prompt = assembleSystemPrompt("sweep", path.join(__dirname, "..", "skills"));
  assert.match(prompt, /## Risk 1: Cognitive Overload/);
  assert.match(prompt, /## Risk T1: Test Obscurity/);
  assert.match(prompt, /## C-family/);
  assert.match(prompt, /# Code Shine .* Full Sweep Guide/);
});

test("assembles review prompt without test risks", () => {
  const prompt = assembleSystemPrompt("review", path.join(__dirname, "..", "skills"));
  assert.match(prompt, /## Risk 1: Cognitive Overload/);
  assert.doesNotMatch(prompt, /## Risk T1: Test Obscurity/);
});

test("assembles test prompt with only test risks", () => {
  const prompt = assembleSystemPrompt("test", path.join(__dirname, "..", "skills"));
  assert.match(prompt, /## Risk T1: Test Obscurity/);
  assert.doesNotMatch(prompt, /## Risk 1: Cognitive Overload/);
});

// ── readHistory ────────────────────────────────────────────────────────────

console.log("\nreadHistory");

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "code-shine-test-"));
  try { fn(dir); } finally { rmSync(dir, { recursive: true }); }
}

test("returns empty array when history file does not exist", () => {
  withTempDir(dir => assert.deepEqual(readHistory(dir), []));
});

test("returns parsed array when history file exists", () => {
  withTempDir(dir => {
    const record = {
      date: "2026-04-16T00:00:00Z",
      mode: "PR Review",
      languages: ["python", "typescript"],
      score: 85,
      findings: { critical: 0, warning: 1, suggestion: 2 },
      scope: "staged changes",
    };
    writeFileSync(path.join(dir, ".code-shine-history.json"), JSON.stringify([record]));
    assert.deepEqual(readHistory(dir), [record]);
  });
});

// ── appendHistory ─────────────────────────────────────────────────────────

console.log("\nappendHistory");

test("creates history file with first record", () => {
  withTempDir(dir => {
    const record = {
      date: "2026-04-16T00:00:00Z",
      mode: "PR Review",
      score: 82,
      findings: { critical: 1, warning: 2, suggestion: 3 },
      scope: "staged changes (3 files)",
    };
    appendHistory(dir, record);
    assert.deepEqual(readHistory(dir), [record]);
  });
});

// ── getTrend ───────────────────────────────────────────────────────────────

console.log("\ngetTrend");

test("returns null when history is empty", () => {
  assert.equal(getTrend([], "PR Review"), null);
});

test("returns lastScore for one prior record", () => {
  const history = [{ mode: "PR Review", score: 85 }];
  const trend = getTrend(history, "PR Review");
  assert.equal(trend.lastScore, 85);
  assert.equal(trend.runCount, 1);
});

// ── normalizeMode ────────────────────────────────────────────────────────────

console.log("\nnormalizeMode");

test("maps display names to canonical modes", () => {
  assert.equal(normalizeMode("PR Review"), "review");
  assert.equal(normalizeMode("Architecture Audit"), "audit");
  assert.equal(normalizeMode("Tech Debt Assessment"), "debt");
  assert.equal(normalizeMode("Full Sweep"), "sweep");
});

// ── sparkline ────────────────────────────────────────────────────────────────

console.log("\nsparkline");

test("maps score extremes to the lowest and highest bars", () => {
  assert.equal(sparkline([0]), "▁");
  assert.equal(sparkline([100]), "█");
});

// ── renderHistory ────────────────────────────────────────────────────────────

console.log("\nrenderHistory");

test("reports no history for an empty array", () => {
  assert.equal(renderHistory([]), "No history found.");
});

// ── extractRiskCodes ───────────────────────────────────────────────────────

console.log("\nextractRiskCodes");

test("extracts R-codes from text", () => {
  assert.deepEqual([...extractRiskCodes("R1 and R2 are present")], ["R1", "R2"]);
});

test("extracts T-codes from text", () => {
  assert.deepEqual([...extractRiskCodes("T3 and T6 detected")], ["T3", "T6"]);
});

// ── classify ───────────────────────────────────────────────────────────────

console.log("\nclassify");

test("returns 'pass' when all expected codes found with Iron Law and Health Score", () => {
  const scenario = { expected_output: "R1" };
  const aiText = "R1 Symptom: x Source: y Consequence: z Remedy: w Health Score: 85/100";
  assert.equal(classify(scenario, aiText), "pass");
});

test("returns 'partial' when some codes found with Iron Law but Health Score absent", () => {
  const scenario = { expected_output: "R1 R2" };
  const aiText = "R1 Symptom: x Source: y Consequence: z Remedy: w";
  assert.equal(classify(scenario, aiText), "partial");
});

test("returns 'fail' when no expected codes found in output", () => {
  const scenario = { expected_output: "R1 R2" };
  const aiText = "Symptom: x Source: y Consequence: z Remedy: w Health Score: 85/100";
  assert.equal(classify(scenario, aiText), "fail");
});

// ── Integration: validate-repo.mjs passes against current repo ─────────────

console.log("\nvalidate-repo integration");

test("validate-repo.mjs exits 0 against the current repository", () => {
  execFileSync("node", [path.join(__dirname, "validate-repo.mjs")], { encoding: "utf8" });
  // execFileSync throws on non-zero exit — reaching here means exit 0
});

// ── Summary ────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
