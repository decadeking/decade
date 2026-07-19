import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  countProductionRisks,
  countTestRisks,
  countLanguageFamilies,
  extractGuideStepLabels,
  readPackageVersion,
  PRODUCTION_RISK_COUNT,
  TEST_RISK_COUNT,
} from "./frontmatter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function readText(relPath) {
  return readFileSync(path.join(root, relPath), "utf8").replace(/\r\n/g, "\n");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

// ── Canonical data ─────────────────────────────────────────────────────────

const packageJson = readJson("package.json");
const version = packageJson.version;

const SKILL_GUIDES = [
  ["codex-review", "pr-review-guide.md"],
  ["codex-audit", "architecture-guide.md"],
  ["codex-debt", "debt-guide.md"],
  ["codex-test", "test-guide.md"],
  ["codex-health", "health-guide.md"],
  ["codex-sweep", "sweep-guide.md"],
];

const SHARED_FILES = [
  "skills/_shared/common.md",
  "skills/_shared/decay-risks.md",
  "skills/_shared/test-decay-risks.md",
  "skills/_shared/language-rules.md",
  "skills/_shared/remedy-guide.md",
  "skills/_shared/custom-risks-guide.md",
];

// ── Validation sections ────────────────────────────────────────────────────

function checkVersionConsistency() {
  const manifestVersions = [
    ["package.json", version],
    [".codex-plugin/plugin.json", readJson(".codex-plugin/plugin.json").version],
  ];
  for (const [file, foundVersion] of manifestVersions) {
    check(
      foundVersion === version,
      `${file} version ${foundVersion} does not match package.json version ${version}`,
    );
  }
}

function checkSharedFramework() {
  const commonMd = readText("skills/_shared/common.md");
  check(commonMd.includes("## The Iron Law"), "skills/_shared/common.md should define the Iron Law");
  check(commonMd.includes("## Report Template"), "skills/_shared/common.md should define the Report Template");
  check(commonMd.includes("## Health Score Calculation"), "skills/_shared/common.md should define Health Score");
  check(commonMd.includes("languages"), "skills/_shared/common.md should mention language detection");

  const testDecayRisks = readText("skills/_shared/test-decay-risks.md");
  check(testDecayRisks.includes("## Risk T3: Test Duplication"), "T3 definition missing from test-decay-risks.md");
  check(testDecayRisks.includes("## Risk T5: Coverage Illusion"), "T5 definition missing from test-decay-risks.md");
  check(testDecayRisks.includes("### What Not to Flag"), "skills/_shared/test-decay-risks.md should include false-positive guidance");

  const decayRisks = readText("skills/_shared/decay-risks.md");
  check(decayRisks.includes("### What Not to Flag"), "skills/_shared/decay-risks.md should include false-positive guidance");

  const languageRules = readText("skills/_shared/language-rules.md");
  check(languageRules.includes("C-family"), "skills/_shared/language-rules.md should define C-family");
  check(languageRules.includes("Systems"), "skills/_shared/language-rules.md should define Systems family");
  check(languageRules.includes("Web"), "skills/_shared/language-rules.md should define Web family");
  check(languageRules.includes("Scripting"), "skills/_shared/language-rules.md should define Scripting family");
  check(languageRules.includes("Functional"), "skills/_shared/language-rules.md should define Functional family");
  check(languageRules.includes("Data / Config"), "skills/_shared/language-rules.md should define Data / Config family");

  // Verify risk section counts are stable
  const productionRisks = countProductionRisks(decayRisks);
  check(productionRisks === PRODUCTION_RISK_COUNT, `skills/_shared/decay-risks.md should define exactly ${PRODUCTION_RISK_COUNT} risks (found ${productionRisks})`);

  const testRisks = countTestRisks(testDecayRisks);
  check(testRisks === TEST_RISK_COUNT, `skills/_shared/test-decay-risks.md should define exactly ${TEST_RISK_COUNT} test risks (found ${testRisks})`);

  const languageFamilies = countLanguageFamilies(languageRules);
  check(languageFamilies >= 6, `skills/_shared/language-rules.md should define at least 6 language families (found ${languageFamilies})`);
}

// ── Step alignment ────────────────────────────────────────────────────────

function checkStepAlignment() {
  for (const [mode, guide] of SKILL_GUIDES) {
    const guideText = readText(`skills/${mode}/${guide}`);
    const guideLabels = extractGuideStepLabels(guideText);

    check(
      guideLabels.length > 0,
      `skills/${mode}/${guide} has no ### Step headings — expected at least one`,
    );

    const uniqueLabels = new Set(guideLabels);
    check(
      uniqueLabels.size === guideLabels.length,
      `skills/${mode}/${guide} has duplicate step labels: ${guideLabels.filter((l, i) => guideLabels.indexOf(l) !== i).join(", ")}`,
    );

    const mainSteps = [...new Set(guideLabels.map(l => parseInt(l, 10)))].sort((a, b) => a - b);
    const expectedStart = mainSteps[0];
    for (let i = 0; i < mainSteps.length; i++) {
      check(
        mainSteps[i] === expectedStart + i,
        `skills/${mode}/${guide} main step sequence has a gap: expected ${expectedStart + i}, found ${mainSteps[i]}`,
      );
    }

    const skillText = readText(`skills/${mode}/SKILL.md`);
    const processMatch = skillText.match(/## Process\n([\s\S]*?)(?=\n##|$)/);
    check(
      processMatch !== null,
      `skills/${mode}/SKILL.md has no ## Process section`,
    );
    if (processMatch) {
      check(
        /^\d+\./m.test(processMatch[1]),
        `skills/${mode}/SKILL.md Process section has no numbered items`,
      );
    }
  }
}

function checkSkillsContent() {
  const modes = SKILL_GUIDES.map(([mode]) => mode);

  // Guard: _shared/ must never contain a SKILL.md — it is a shared library directory.
  let sharedHasSkillMd = false;
  try {
    readText("skills/_shared/SKILL.md");
    sharedHasSkillMd = true;
  } catch (_) { /* expected — file should not exist */ }
  check(!sharedHasSkillMd, "skills/_shared/SKILL.md must not exist — _shared/ is a library, not a skill");

  for (const mode of modes) {
    const skillMd = readText(`skills/${mode}/SKILL.md`);
    check(skillMd.includes("## Setup"), `skills/${mode}/SKILL.md should have a ## Setup section`);
    check(skillMd.includes("## Process"), `skills/${mode}/SKILL.md should have a ## Process section`);

    // Trigger description must include a "Do NOT trigger for:" clause.
    check(
      skillMd.includes("Do NOT trigger for:"),
      `skills/${mode}/SKILL.md description must include a "Do NOT trigger for:" clause`,
    );
  }

  for (const [mode, guide] of SKILL_GUIDES) {
    const content = readText(`skills/${mode}/${guide}`);
    check(
      content.includes("Iron Law"),
      `skills/${mode}/${guide} should reference the Iron Law`,
    );
  }
}

function checkNoAnthropicTraces() {
  // Repo-wide scan: any leftover reference to anthropic/claude in product
  // files must be cleaned. Meta-documentation (README/AGENTS) and the
  // LICENSE / SECONDARY_DEV attribution note may legitimately compare to
  // the upstream's Claude-based origins, so they are excluded.
  const searchFiles = [
    ...SHARED_FILES,
    ...SKILL_GUIDES.map(([mode, guide]) => `skills/${mode}/${guide}`),
    "package.json",
    ".codex-plugin/plugin.json",
  ];
  for (const rel of searchFiles) {
    let text;
    try {
      text = readText(rel);
    } catch (_) {
      continue;
    }
    check(
      !/anthropic|claude/i.test(text),
      `${rel} should not reference anthropic or claude (Code Shine uses OpenAI SDK and Codex CLI)`,
    );
  }
}

function checkNoOriginalAuthorTraces() {
  // The original project name and author must not appear in product files.
  // LICENSE and SECONDARY_DEV.md legitimately mention them for attribution
  // (MIT requires retaining the copyright notice) and design provenance.
  const searchFiles = [
    "package.json",
    ".codex-plugin/plugin.json",
    "README.md",
    "AGENTS.md",
    ...SHARED_FILES,
    ...SKILL_GUIDES.map(([mode, guide]) => `skills/${mode}/${guide}`),
  ];
  for (const rel of searchFiles) {
    let text;
    try {
      text = readText(rel);
    } catch (_) {
      continue;
    }
    check(
      !/hyhmrright|brooks-lint|brooks-/i.test(text),
      `${rel} should not reference the original author (hyhmrright) or the original name (brooks-lint)`,
    );
  }
}

function checkSdkReplacement() {
  const pkg = readJson("package.json");
  check(
    pkg.dependencies?.openai !== undefined,
    "package.json must declare openai as a runtime dependency",
  );
  check(
    pkg.devDependencies?.["@anthropic-ai/sdk"] === undefined,
    "package.json must not declare @anthropic-ai/sdk — Codex mode uses OpenAI",
  );
}

// ── Run all checks ─────────────────────────────────────────────────────────

checkVersionConsistency();
checkSharedFramework();
checkStepAlignment();
checkSkillsContent();
checkNoAnthropicTraces();
checkNoOriginalAuthorTraces();
checkSdkReplacement();

// ── Report ─────────────────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error("Repository validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`Code Shine repository validation passed for version ${version}.`);
