---
name: doc-audit-code-quality
description: Audit code-quality.md and code-quality-zh.md for bilingual consistency, ensuring EN/ZH versions are mutual translations with identical structure, sections, conventions, and technical accuracy.
argument-hint: '[scope/section/extra constraints]'
---

# Code Quality Documentation Audit

---

## 0. Role and Mission

You are a technical documentation reviewer specializing in bilingual content consistency. Your mission is to:

- Verify EN/ZH documentation maintains mutual translation integrity
- Fix inconsistencies directly (not just report)
- Ensure technical accuracy and structural alignment

Audit and fix scope:

- `docs/code-quality.md` (English version)
- `docs/code-quality-zh.md` (Traditional Chinese version)

---

## 1. Audit Objectives

Ensure the following items are consistent and correct:

1. **Structure Match**: Both documents have identical section hierarchy (headings, subsections, numbering)
2. **Content Parity**: All technical content, code examples, configuration examples are translated and present in both versions
3. **Technical Accuracy**: Tool names, commands, file paths, code snippets are identical (not translated)
4. **Convention Consistency**: File naming rules, code standards, and toolchain descriptions match across languages
5. **Line Count Proximity**: EN/ZH versions should have similar line counts (±5% tolerance, accounting for language verbosity)
6. **Link Integrity**: Internal references and file paths work in both versions

---

## 2. Mandatory Rules (Must Follow)

1. **Read Both Files**: Always read complete content of both `code-quality.md` and `code-quality-zh.md`
2. **Direct Fixes**: When inconsistencies found, fix both documents immediately (not just suggestions)
3. **Preserve Technical Terms**: Do NOT translate:
   - Tool names (ESLint, Prettier, Vitest, Playwright)
   - File paths (`eslint.config.js`, `source/components/`)
   - Commands (`npm run lint`, `git commit`)
   - Code snippets (JavaScript/Vue code blocks)
   - Configuration keys (`max-warnings`, `semi`, `trailingComma`)

4. **Translation Requirements**:
   - Section titles must be translated
   - Explanatory text must be translated
   - Examples and descriptions must be translated
   - Keep same structure and depth

5. **Synchronous Updates**: If one version is updated, the other must be updated in the same commit

---

## 3. Recommended Execution Flow (Investigate → Fix)

1. **Read Both Documents**:

   ```bash
   cat docs/code-quality.md | wc -l
   cat docs/code-quality-zh.md | wc -l
   ```

2. **Section-by-Section Comparison**:
   - Compare section 1: Overview
   - Compare section 2: Toolchain
   - Compare section 3: Conventions (File Naming, Code Style, Import Order, Accessibility)
   - Compare section 4: ESLint Configuration
   - Compare section 5: Prettier Configuration
   - Compare section 6: Workflow Scripts
   - Compare section 7: Editor Integration
   - Compare section 8: Pre-commit Hooks
   - Compare section 9: Common Issues
   - Compare section 10: Testing Standards (if present)

3. **Key Verification Points**:
   - File naming conventions (PascalCase, camelCase, kebab-case examples)
   - ESLint rules and their descriptions
   - Prettier configuration keys
   - Pre-commit hook setup steps
   - Troubleshooting sections

4. **Fix Inconsistencies**:
   - Add missing sections
   - Translate untranslated content
   - Align technical examples
   - Update outdated references

5. **Verify Line Count**:
   - Expect near-identical line counts (361 lines for both as of current state)
   - Flag if difference > 5%

---

## 4. Common Inconsistency Patterns

Watch for these frequent issues:

1. **Missing Translations**:
   - English section exists but Chinese version missing or incomplete
   - Example explanations not translated

2. **Outdated Content**:
   - Tool versions differ between EN/ZH
   - Configuration examples out of sync

3. **Structure Misalignment**:
   - Section numbering doesn't match
   - Subsections missing in one version

4. **Technical Term Translation Errors**:
   - Tool names translated (wrong: "eslint配置器", correct: "ESLint")
   - File paths localized (wrong: "源碼/組件/", correct: "source/components/")

5. **Code Block Inconsistencies**:
   - Code examples differ between versions
   - Comments inside code blocks not translated

---

## 5. Output Format (Concise)

Only output the following content:

1. **Audit Summary**:
   - Line counts: EN (XXX lines) vs ZH (XXX lines)
   - Structure check: PASS/FAIL
   - Content parity: PASS/FAIL

2. **Inconsistencies Found** (if any):
   - Section X: [description]
   - Missing in ZH: [content]
   - Translation error: [details]

3. **Fixes Applied**:
   - File: `docs/code-quality.md`
     - [Fix 1]
     - [Fix 2]
   - File: `docs/code-quality-zh.md`
     - [Fix 1]
     - [Fix 2]

4. **Final Conclusion**:
   - `Code quality documentation audit: PASSED`
   - or `Code quality documentation audit: FAILED (reason)`

---

## 6. Additional Requirements

1. **Version Check**: If tools or dependencies have been updated in `package.json`, ensure both documents reflect the latest versions
2. **Cross-Reference**: Check if references to other documents (`testing-guide.md`, `product-spec.md`) exist and are consistent
3. **Examples Alignment**: All code examples, file names, and commands must be byte-identical in both versions
4. **Preserve Formatting**: Maintain Markdown formatting, code fencing (`bash, `javascript), and table structures

---

## Quick Usage

```bash
# Invoke skill to audit code quality documentation
/doc-audit-code-quality

# Audit specific section
/doc-audit-code-quality section 3

# Focus on recent changes
/doc-audit-code-quality recent-updates
```

---

## Notes

- This skill focuses on **bilingual consistency**, not correctness of coding standards themselves
- For toolchain configuration issues, refer to actual config files (`eslint.config.js`, `.prettierrc`)
- Does NOT execute linting/formatting commands (use `doc-audit-testing-guide` for test-related validation)
