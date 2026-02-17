---
name: test-analysis
description: Execute independent test architecture and quality review, output Gate verdict, grade, and minimum viable fixes (MVP fixes).
argument-hint: '[scope/path/extra constraints]'
---

# Test Architecture and Quality Independent Review

---

## 0. Execution Mode (Read First)

You are a senior QA architect conducting a **complete, independent, traceable** review of this project's test architecture.

### Mandatory Principles

1. **Oracle First**: Judge correctness by requirements/specs/observable UI behavior.
2. **Evidence First**: High-risk conclusions must include file/line number/reproduction steps/execution output.
3. **Reproducibility First**: Non-reproducible issues cannot be marked P0/P1.
4. **Independence**: Existing tests are not proof of correctness; tests themselves are also subject to review.
5. **Risk-Oriented**: Test value > coverage percentage > test quantity.

---

## 1. Project Background

- Frontend: Vue 3 (Composition API)
- Build: Vite
- Testing: Vitest + @vue/test-utils + Playwright
- Storage: localStorage
- UI: Tailwind CSS

---

## 2. Mission Objectives

Answer two things:

1. Does it currently meet Grade A threshold? (Under full review depth, avoid stopping at vague conservative conclusions every time; adopt **verifiable Gate decisions**.)
2. If not Grade A, what minimally needs fixing (MVP fixes + priority)?

---

## 3. Core Values (Avoid Wrong Optimization)

Testing is not a quantity competition, but a risk management tool. Each test should answer:

1. What risk does it protect against?
2. Can it catch real bugs?
3. Is maintenance cost reasonable?
4. Is it redundantly covered?

### Coverage Interpretation (Not a KPI)

- Coverage is a byproduct, not a goal.
- 90% ineffective tests < 70% high-value tests.
- Uncovered doesn't mean must supplement (might be low-risk defensive code).
- High coverage + low-quality assertions = false sense of security.

---

## 4. Operation Steps (Recommended Execution Order)

```bash
git branch --show-current
git log --oneline -10
git diff main...HEAD --stat

npm ci || npm install
npm run test:run
npm run test:coverage
npm run test:e2e
```

If commands fail, must preserve in report:

- Failed command
- Error summary
- Impact scope on conclusions

---

## 5. Analysis Dimensions and Weights

### A. Test Effectiveness (30%, Highest Weight)

#### High-Value Tests (Tend to Keep)

- Core business flows and high-risk paths
- Regression bug corresponding tests
- Boundary/error handling tests
- Behavior-oriented assertions (not implementation details)

#### Low-Value Tests (Consider Deleting/Merging)

- Testing framework itself
- Duplicate logic paths
- Generic assertions (e.g., toBeTruthy overuse)
- Over-coupled to private/internal

#### Anti-Pattern Scanning (Examples)

```bash
grep -rn "toBeTruthy\|toBeUndefined" tests/
grep -rn "setTimeout" tests/
grep -rn "querySelector\|getElementsBy\|nth-child" tests/
```

### B. Test Architecture Design (20%)

- Is Unit / Component / E2E layering reasonable
- Is there cross-layer duplication
- Is it independent, parallelizable, no shared pollution
- Are setup/teardown and mock strategies appropriate

### C. Risk Coverage (25%)

#### High-Risk Must-Test

- localStorage CRUD + failure paths (QuotaExceeded / parse error)
- Cross-tab sync (storage event)
- Checklist/Category/Item CRUD completeness
- Drag & Drop reordering
- cascade delete / orphan prevention

#### Medium-Risk Recommended

- Edit mode, Enter/Escape
- i18n switching
- Empty state
- Minimum a11y baseline (keyboard operable, basic ARIA/label)
- Basic security baseline (input escaping, XSS injection points don't execute)

### D. Maintainability and Stability (15%)

- Over-reliance on class/DOM structure/element order
- Testing private/internal state
- Duplicate setup, extractable helpers

### E. Missing Risks (10%)

- localStorage disabled/security error
- Corrupted JSON
- Multi-tab conflicting edits (simultaneous rename / rename+delete)

---

## 6. Critical: Gate Decision Rules (Mandatory) (Avoid AI infinite loop giving moderate non-critical comments)

### Grade A Threshold (Must All Be True)

1. **P0 = 0**
2. **P1 ≤ 1** (with acceptable workaround)
3. Unit/Component/E2E can pass stably (no reproducible flaky)
4. High-risk must-test list fully covered
5. No "evidence-free" high-risk conclusions

> If above holds: **Overall rating must be A/A-**.
> Only P2/P3 remaining: **Cannot downgrade to B/B+**.

### Downgrade Rules

- Any unresolved P0 → Max B
- P1 ≥ 2 → Max B+
- Reproducible flaky exists and not isolated → Max B
- High-risk critical path missing tests → Max B

### Anti-Loop Constraints (New, Must Follow)

1. **No "Evidence-Free Downgrade"**: If this round has no new reproducible evidence compared to last round, cannot repeat same downgrade reason.
2. **No "Speculative P1"**: Without file+line number+reproduction steps+output, cannot mark P1.
3. **Issue Deduplication**: Same-origin issues cannot be split into multiple P1s to inflate count.
4. **Consistency Check**: Conclusions must match Gate verdict (if Gate passes, cannot give B+).
5. **Convergence Requirement**: If only P2/P3 remain, explicitly declare "A-gate passed with residual P3".

---

## 7. Evidence Standards (P0/P1 Required)

Each ⚠️/❌ item needs:

1. Evidence location (file + line number)
2. Minimal reproduction steps
3. Actual result vs expected result
4. Risk level (High/Medium/Low) and reason
5. Fix suggestion + estimated hours
6. Confidence level (High/Medium/Low)

---

## 8. Output Format (Fixed, Cannot Omit)

### 1. Executive Summary

- Test overview (Unit/Component/E2E file count and case count)
- Four star ratings (effectiveness, coverage, maintainability, architecture)
- Overall rating (A/B/C/D/F)
- Top 3 strengths / Top 3 risks

### 2. Gate Verdict Card (New, Required)

Use following format to judge each:

- Gate-1 P0=0: Pass/Fail (evidence)
- Gate-2 P1≤1: Pass/Fail (evidence)
- Gate-3 All layers stable: Pass/Fail (evidence)
- Gate-4 High-risk covered: Pass/Fail (evidence)
- Gate-5 No evidence-free high-risk: Pass/Fail (evidence)

And output:

- **Final Gate Verdict**: A-gate passed / not passed
- **Final Grade**: A / A- / B+ / B / ...

### 3. Defect List (Only List Evidenced Items)

List by priority P0 → P1 → P2 → P3.

### 4. Recommendation List (Unified Table)

Type: 🗑️Delete / ✏️Refactor / ➕Add / 🔄Merge / ✅Keep

| ID  | Type | Recommended Action | Reason | Impact Scope | Priority | Est. Hours | Related Files |
| --- | ---- | ------------------ | ------ | ------------ | -------- | ---------- | ------------- |

### 5. MVP Fixes (Required if Not Grade A)

Only list "minimum necessary fixes":

- Fix-1 (P0/P1)
- Fix-2 (P0/P1)
- Fix-3 (optional)

And attach: After completing these, what grade is expected.

---

## 9. Scoring Criteria (Maintain Completeness)

### Overall Rating

- A: High-risk coverage complete, tests effective, stable, maintainable, and passes Gate
- B: Obvious gaps but core usable
- C: Only basically usable, large room for improvement
- D/F: Critical risks missing tests or tests failing

### Dimensional Stars (1-5)

- Test effectiveness
- Critical coverage
- Maintainability
- Architecture reasonableness

> Note: Stars are auxiliary, **final grade prioritizes Gate rules**.

---

## 10. Notes (Keep + Strengthen)

1. Coverage is reference, not goal.
2. Quality over quantity; allow deleting low-value tests.
3. Can reference specs as oracle, but cannot reuse existing evaluation conclusions.
4. Must mark assumptions and confidence levels.
5. Without evidence and reproduction steps, cannot upgrade to high priority.
6. Strictly prohibit repeatedly downgrading scores for same issue without new evidence (prevent infinite loop).

---

## 11. Final Question

I want to know if Grade A threshold is currently met. If not yet achieved, please only list "minimum viable fixes (MVP fixes)" and priority.

Please begin review analysis.
