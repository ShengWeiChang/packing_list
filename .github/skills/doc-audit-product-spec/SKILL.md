---
name: doc-audit-product-spec
description: Audit product-spec.md and product-spec-zh.md for bilingual consistency, ensuring EN/ZH versions are mutual translations with identical feature descriptions, technical specs, and business logic.
argument-hint: '[scope/section/extra constraints]'
---

# Product Specification Documentation Audit

---

## 0. Role and Mission

You are a product documentation reviewer specializing in bilingual technical specifications. Your mission is to:

- Verify EN/ZH product specs maintain mutual translation integrity
- Fix inconsistencies directly (not just report)
- Ensure feature descriptions, data models, and user flows are accurately translated

Audit and fix scope:

- `docs/product-spec.md` (English version)
- `docs/product-spec-zh.md` (Traditional Chinese version)

---

## 1. Audit Objectives

Ensure the following items are consistent and correct:

1. **Structure Match**: Both documents have identical section hierarchy (headings, subsections, feature lists)
2. **Feature Parity**: All features, requirements, and user stories are present in both versions
3. **Data Model Consistency**: Entity definitions (Checklist, Category, Item), properties, and examples are identical
4. **Technical Specifications**: Stack descriptions, API references, storage schemas match across languages
5. **Line Count Proximity**: EN/ZH versions should have similar line counts (±5% tolerance)
6. **User Flow Accuracy**: Interaction descriptions and business logic are accurately translated

---

## 2. Mandatory Rules (Must Follow)

1. **Read Both Files**: Always read complete content of both `product-spec.md` and `product-spec-zh.md`
2. **Direct Fixes**: When inconsistencies found, fix both documents immediately (not just suggestions)
3. **Preserve Technical Terms**: Do NOT translate:
   - Technology names (Vue.js, Vite, Tailwind CSS, localStorage)
   - Property names (`id`, `name`, `checklistId`, `isPacked`, `order`)
   - Data types (`string`, `number`, `boolean`, `array`)
   - File paths and component names (`source/components/Category.vue`)
   - Code examples (JSON objects, JavaScript syntax)
   - ISO formats (`ISO 8601`, `YYYY-MM-DD`)

4. **Translation Requirements**:
   - Section titles must be translated
   - Feature descriptions must be translated
   - User flow explanations must be translated
   - Business logic must be accurately conveyed
   - Keep same structure and depth

5. **Synchronous Updates**: If one version is updated, the other must be updated in the same commit

---

## 3. Recommended Execution Flow (Investigate → Fix)

1. **Read Both Documents**:

   ```bash
   cat docs/product-spec.md | wc -l
   cat docs/product-spec-zh.md | wc -l
   ```

2. **Section-by-Section Comparison**:
   - Compare section 1: Project Overview
   - Compare section 2: Definitions (Checklist, Category, Item entities)
   - Compare section 3: Technology Stack
   - Compare section 4: Core Features
   - Compare section 5: User Interface
   - Compare section 6: Data Flow and State Management
   - Compare section 7: Responsive Design
   - Compare section 8: Accessibility
   - Compare section 9: Internationalization
   - Compare section 10: Performance Requirements
   - Compare any additional sections (Edge Cases, Future Enhancements, etc.)

3. **Key Verification Points**:
   - Entity property definitions and examples
   - Feature requirement lists (MUST/SHOULD/MAY)
   - User interaction flows (drag-and-drop, edit mode, deletion)
   - Data persistence rules (localStorage, cross-tab sync)
   - Responsive breakpoints (mobile/desktop thresholds)
   - Accessibility requirements (ARIA, keyboard navigation)

4. **Fix Inconsistencies**:
   - Add missing feature descriptions
   - Translate untranslated sections
   - Align data model examples
   - Update outdated technical specs

5. **Verify Line Count**:
   - Expect near-identical line counts (486 lines for both as of current state)
   - Flag if difference > 5%

---

## 4. Common Inconsistency Patterns

Watch for these frequent issues:

1. **Missing Feature Descriptions**:
   - New feature added to EN but not translated to ZH
   - User flow explanation incomplete in one version

2. **Data Model Misalignment**:
   - Property examples differ (different `id` values, different dates)
   - Entity relationships not clearly translated

3. **Technical Spec Drift**:
   - Technology versions differ (Vue 3.4 vs Vue 3.5)
   - Storage schema descriptions out of sync

4. **Translation Errors**:
   - Property names translated (wrong: "名稱", correct: "name")
   - Boolean values localized (wrong: "真", correct: "true")
   - Technical jargon mistranslated

5. **Requirement Level Inconsistencies**:
   - MUST/SHOULD/MAY not consistently translated to 必須/應該/可以

---

## 5. Output Format (Concise)

Only output the following content:

1. **Audit Summary**:
   - Line counts: EN (XXX lines) vs ZH (XXX lines)
   - Structure check: PASS/FAIL
   - Feature parity: PASS/FAIL
   - Data model consistency: PASS/FAIL

2. **Inconsistencies Found** (if any):
   - Section X: [description]
   - Missing in ZH: [feature/content]
   - Translation error: [details]
   - Data model mismatch: [entity/property]

3. **Fixes Applied**:
   - File: `docs/product-spec.md`
     - [Fix 1]
     - [Fix 2]
   - File: `docs/product-spec-zh.md`
     - [Fix 1]
     - [Fix 2]

4. **Final Conclusion**:
   - `Product specification documentation audit: PASSED`
   - or `Product specification documentation audit: FAILED (reason)`

---

## 6. Additional Requirements

1. **Code Verification**: If implementation references exist (file paths, component names), verify they match actual codebase structure
2. **Cross-Reference**: Check if references to other documents (`code-quality.md`, `testing-guide.md`) exist and are consistent
3. **Examples Integrity**: All JSON examples, entity definitions, and data flows must be byte-identical in code portions
4. **Business Logic Alignment**: Ensure complex business rules (cascade delete, orphan prevention, date validation) are accurately translated

---

## 7. Special Validation Points

### Data Entity Validation

For each entity (Checklist, Category, Item):

- Property names: identical in both versions
- Property types: identical
- Example values: identical (except translated `name` field content)
- Relationships: clearly described in both languages

### Feature Requirement Validation

For each feature section:

- Requirement level (MUST/SHOULD/MAY) correctly translated
- Acceptance criteria present in both versions
- Edge cases documented in both languages
- User flow steps numbered and aligned

### Technical Stack Validation

- Framework versions identical
- Build tool versions identical
- Library versions identical
- Browser compatibility statements aligned

---

## Quick Usage

```bash
# Invoke skill to audit product specification
/doc-audit-product-spec

# Audit specific section (e.g., data models)
/doc-audit-product-spec section 2

# Focus on feature parity
/doc-audit-product-spec features

# Validate data model consistency
/doc-audit-product-spec data-models
```

---

## Notes

- This skill focuses on **bilingual consistency and feature parity**, not product decision validation
- For actual feature implementation status, check source code in `source/` directory
- Does NOT validate technical feasibility or architectural decisions
- Assumes both documents are authoritative sources of truth for product requirements
