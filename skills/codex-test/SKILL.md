---
name: codex-test
description: >
  Test quality review across 20+ programming languages that diagnoses structural
  problems in an existing test suite: brittleness, mock abuse, coverage illusions,
  slow execution, poor readability.
  Triggers when: user asks about test quality, shares test files for review, or
  expresses frustration: "tests keep breaking whenever I change anything", "our tests
  take forever", "tests pass but bugs still reach production", or "we have too many mocks".
  Do NOT trigger for: writing new tests from scratch (use the regular test-writing
  workflow) or testing framework/syntax questions — this skill reviews an existing
  suite for structural quality problems, not individual test authoring.
---

# Code Shine — Test Quality Review

## Setup

1. Read `../_shared/common.md` for the Iron Law, Project Config, Report Template, and Health Score rules
2. Read `../_shared/test-decay-risks.md` for test-space symptom definitions and severity guides
3. Read `../_shared/language-rules.md` for language-specific test patterns
4. Read `test-guide.md` in this directory for the test quality review framework

## Process

**If the user has not shared test files or pointed to a test directory:** apply Auto
Scope Detection from `../_shared/common.md` to determine the review scope before proceeding.

1. Build the test suite map (guide's "Before You Start" section)
2. Scan for each test decay risk in the order specified (Steps 1–4 of the guide)
3. Apply the Iron Law and output using the Report Template (Step 5 of the guide)

**Mode line in report:** `Test Quality Review`
