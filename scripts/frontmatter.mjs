/**
 * Shared frontmatter parsing utilities.
 *
 * Extracted so that validate-repo.mjs and validate-repo.test.mjs can both
 * import these helpers without the test file triggering the full validation
 * run on import.
 */

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n");
}

/**
 * Count production decay risk sections in decay-risks.md.
 * Each risk section uses the pattern: ## Risk N: Title
 */
export function countProductionRisks(text) {
  return (normalizeNewlines(text).match(/^## Risk \d+:/gm) ?? []).length;
}

/**
 * Count test decay risk sections in test-decay-risks.md.
 * Each risk section uses the pattern: ## Risk TN: Title
 */
export function countTestRisks(text) {
  return (normalizeNewlines(text).match(/^## Risk T\d+:/gm) ?? []).length;
}

/**
 * Count language entries in language-rules.md.
 * Each language family section starts with "## " (C-family, Systems, Web, etc.).
 */
export function countLanguageFamilies(text) {
  return (normalizeNewlines(text).match(/^## /gm) ?? []).length;
}

/**
 * Extract step labels from a guide file.
 * Matches: ### Step 1, ### Step 2a, ### Step 6b, ### Step 0, etc.
 * Returns: ["1", "2a", "6b", ...] — the label portion only.
 */
export function extractGuideStepLabels(text) {
  return (normalizeNewlines(text).match(/^### Step (\d+[a-z]?)/gm) ?? [])
    .map(m => m.replace(/^### Step /, ""));
}

/**
 * Extract the package version from package.json.
 */
export function readPackageVersion(pkgJson) {
  try {
    const parsed = JSON.parse(pkgJson);
    return parsed.version ?? null;
  } catch {
    return null;
  }
}

export const PRODUCTION_RISK_COUNT = 6;
export const TEST_RISK_COUNT = 6;
