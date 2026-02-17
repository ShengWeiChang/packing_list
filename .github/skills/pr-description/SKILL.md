---
name: pr-description
description: Generate Pull Request descriptions following exact project conventions (summary+metrics, "Key changes:" sections, technical details) based on PR #10-14 format analysis.
argument-hint: '[PR context/branch/issue number]'
---

# PR Description Writer

## Role and Mission

You are the project's PR writing specialist, generating Pull Request descriptions that **exactly match** team conventions.

## Mandatory Format (Based on PR #10-14 Analysis)

### Opening Paragraph (1-2 sentences)

- **Must include**: Concise description of core changes
- **Should include**: Key metrics or numbers (test count, coverage %, file count, version numbers)
- Example (PR #14):

  > This PR implements comprehensive test coverage (440 tests, 97.52% statement coverage) across unit, component, and E2E layers. Adds GitHub Actions CI/CD pipeline and complete testing documentation.

- Example (PR #13):
  > This PR refactors the color management system to use semantic naming conventions (textPrimary, bgPrimary, themePrimary) and improves UI interactions across components. It includes date validation logic, unified element sizing, and default item improvements.

### Fixed Heading: "Key changes:" (Required)

After the summary paragraph, **must use** `Key changes:` as the section heading (note colon and capitalization).

### Section Structure (Select by Priority)

#### Universal Sections (Most PRs)

1. **Components / UI:**
   - List all Vue component changes, UI adjustments, interaction improvements
   - Format: `- Verb-led description`
   - Example:
     ```
     - Implement a 200ms delay for drag-and-drop on touch devices
     - Increase touch targets for buttons, checkboxes, and menu items to 44px
     - Add ARIA labels and roles for screen reader compatibility
     ```

2. **Logic & persistence:**
   - List logic changes, state management, data persistence
   - Example:
     ```
     - Implement bidirectional date protection: changing start date updates end date if end < start
     - Add scrollIntoView logic when entering edit mode to prevent keyboard occlusion
     - Prevent premature saving when users are selecting characters via IME
     ```

3. **Documentation:**
   - List documentation updates (docs/ directory, README, product specs)
   - Format: `- Update/Add <filename>: <brief description>`
   - Example:
     ```
     - Update product-spec.md with new color system documentation and date editing logic
     - Add docs/testing-guide.md: complete test inventory, architecture, conventions
     ```

#### Topic-Specific Sections (Select as Needed)

4. **Test Infrastructure** (Testing PRs)
   - List test tools, frameworks, configuration files
   - Include version numbers and specific file names
   - Example:
     ```
     - Vitest 4.0.18 + @vue/test-utils 2.4.6 for unit/component testing
     - tests/test-setup/setup.js: global mocks (localStorage, crypto, scrollIntoView)
     ```

5. **Component Test Suite (N tests)** (If component tests exist)
   - Mark test count in parentheses
   - One line per component, format: `- <ComponentName> (<count> tests): <test scope>`
   - Example:
     ```
     - App (42 tests): initialization, state management, event coordination
     - Checklist (36 tests): CRUD operations, date validation, overflow menu
     ```

6. **Unit Test Suite (N tests)** (If unit tests exist)
   - Similar to component test format
   - Example:
     ```
     - localStorageService (100 tests): CRUD, caching, cross-tab sync, concurrency
     - helpers (21 tests): secure ID generation, date formatting, debounce
     ```

7. **E2E Test Suite (N tests)** (If E2E tests exist)
   - List test files and test focus
   - Example:
     ```
     - mobile-workflow (9 tests): sidebar overlay, hamburger menu at 375px
     - item-packing (7 tests): category management, progress tracking
     ```

8. **CI/CD Pipeline** (If CI changes exist)
   - List workflow files and execution steps
   - Example:
     ```
     - GitHub Actions workflow: lint → unit test → E2E test → build
     - Husky pre-commit hook with lint-staged
     ```

9. **Configuration** (If config file changes exist)
   - List new or modified configuration files
   - Format: `- <filename>: <purpose or change>`
   - Example:
     ```
     - playwright.config.js: Chromium browser, screenshot on failure
     - package.json scripts: test:run, test:e2e, test:coverage
     ```

10. **Build & Configuration** (If build-related changes exist)
    - List build process, bundling configuration changes
    - Example:
      ```
      - Refactor THEME_COLORS in constants.js from SCREAMING_SNAKE_CASE to camelCase
      - Update build-css-vars.js to generate CSS variables with simplified naming
      ```

## Writing Standards (Mandatory)

### Bullet Point Format

- **Prefix**: Use `-` (hyphen) + space
- **Verb**: Start with present tense verbs (Add, Update, Implement, Support, Ensure, Refactor)
- **Length**: Single line, concise but include key details
- **Technical terms**:
  - File names use full relative paths (e.g. `tests/test-setup/setup.js`)
  - Tools/packages include version numbers (e.g. `Vitest 4.0.18`)
  - Numbers must be precise (e.g. `440 tests`, `97.52% coverage`)

### Section Order (Recommended)

1. Topic-specific sections (Test Infrastructure, Component Test Suite, etc.)
2. Components / UI:
3. Logic & persistence:
4. CI/CD Pipeline (if present)
5. Configuration (if present)
6. Build & Configuration (if present)
7. Documentation:

### Tone and Style

- Technical, direct, no fluff
- Describe "what was done", not "why"
- Use active voice (Add X, not X is added)
- English primary (unless citing non-English proper nouns)

## Execution Workflow

1. **Auto-collect information**:

   ```bash
   git log main..HEAD --oneline --no-merges
   git diff main...HEAD --stat
   git diff main...HEAD --name-only
   ```

2. **Classify file changes**:
   - `source/components/*.vue` → Components / UI
   - `tests/**/*.test.js` → Component/Unit Test Suite
   - `tests/**/*.spec.js` → E2E Test Suite
   - `*.config.js`, `package.json` → Configuration
   - `docs/*.md` → Documentation
   - `.github/workflows/*.yml` → CI/CD Pipeline

3. **Calculate key metrics** (if applicable):
   - Test file count and test case count
   - Number of new/modified components
   - Package version numbers (from package.json)
   - File change statistics (`git diff --stat`)

4. **Generate PR description**:
   - First paragraph: summary + key metrics
   - Key changes: followed by sections
   - Each section filled with bullet points based on file changes
   - Ensure format matches PR #10-14 exactly

5. **Output format**:
   - Pure Markdown (can paste directly into GitHub PR body)
   - No title included (PR title provided separately)
   - No \`\`\`markdown markers (output content directly)

## Example Templates (Select by PR Type)

### Testing PR Example (Reference PR #14)

```
This PR implements comprehensive test coverage (440 tests, 97.52% statement coverage) across unit, component, and E2E layers. Adds GitHub Actions CI/CD pipeline and complete testing documentation.

Key changes:

Test Infrastructure
- Vitest 4.0.18 + @vue/test-utils 2.4.6 for unit/component testing
- Playwright 1.58.2 for browser-based E2E automation
- jsdom 25.0.1 for DOM simulation
- tests/test-setup/setup.js: global mocks (localStorage, crypto, scrollIntoView)

Component Test Suite (202 tests)
- App (42 tests): initialization, state management, event coordination
- Checklist (36 tests): CRUD operations, date validation, overflow menu
- Item (26 tests): checkbox toggle, edit mode, quantity controls

CI/CD Pipeline
- GitHub Actions workflow: lint → unit test → E2E test → build
- Husky pre-commit hook with lint-staged

Documentation
- Add docs/testing-guide.md: complete test inventory, architecture, conventions
- Update docs/code-quality.md: testing section with coverage metrics
```

### Feature/Fix PR Example (Reference PR #13, #11, #10)

```
This PR [brief feature description]. [Include key improvements or problems solved].

Key changes:

Components / UI:
- [Component change list]
- [UI adjustment list]

Logic & persistence:
- [Logic change list]
- [State management change list]

Documentation:
- Update [filename]: [brief description]
```

## Critical Rules (Mandatory)

1. **Never fabricate data**: All numbers, version numbers, file names must come from actual git diff or package.json
2. **Maintain format consistency**: Strictly follow PR #10-14 format (capitalization, punctuation, section order)
3. **Dynamic section adjustment**: Select sections based on actual changes, don't force all sections
4. **Technical details first**: Prioritize specific technical implementation (file names, function names, version numbers) over abstract descriptions
5. **If information insufficient**: Clearly indicate what additional information is needed (e.g., "Please provide the issue number this PR resolves")
