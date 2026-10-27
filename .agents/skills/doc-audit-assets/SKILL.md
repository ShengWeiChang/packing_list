---
name: doc-audit-assets
description: Audit and fix the paired asset-governance documents against actual repository assets, ownership boundaries, consumers, and replacement contracts.
---

# Asset Governance Documentation Audit

Audit, and when the active workflow authorizes documentation edits, directly correct:

- `docs/assets.md`
- `docs/assets-zh.md`

Treat the repository as evidence for current facts and the paired documents as the policy source. Honor the active feature plan and approval boundary: a review-only request is report-only, while an approved documentation repair may update both documents. Do not change assets, consumers, or product behavior unless the user separately authorizes implementation work.

## Required Audit

1. Read both documents completely before editing either one.
2. Verify mutual-translation integrity:
   - identical section order, heading levels, tables, lists, code blocks, commands, and line count;
   - equivalent requirements, limits, exceptions, and examples;
   - unchanged technical identifiers, paths, commands, formats, and property names;
   - every heading in the Traditional Chinese document starts with the complete canonical English heading and then adds its Chinese translation, including the document title.
3. Inspect the repository rather than trusting the documents alone:
   - enumerate relevant asset files and their actual consumers/imports;
   - verify documented category, runtime owner, directory, file name, and public-versus-bundled behavior;
   - inspect each in-scope file's format, pixel dimensions where applicable, alpha/transparency capability and actual use, and byte size;
   - calculate documented per-file and collection byte budgets from current files, without confusing decimal MB with MiB;
   - verify icon adapters, illustration layers, brand files, fonts, or other documented categories against their real ownership model.
4. Verify each replacement contract describes the runtime assumptions that a replacement must preserve, such as aspect or orientation, transparent canvas, visual anchor, safe area, naming/import contract, render bounds, and responsive behavior. Require only properties the consumer actually depends on.
5. Verify the dynamic-content boundary: user-, locale-, date-, count-, or state-dependent text must remain accessible runtime content unless the repository explicitly implements a justified alternative. Do not claim bitmap text is dynamic.
6. Verify provenance and source-of-truth statements are factual:
   - distinguish an editable master, an approved source, and a deployable export;
   - do not claim a Figma file, SVG master, license record, or generation source exists unless repository or supplied evidence proves it;
   - describe absent provenance or editable masters as an explicit limitation or follow-up, not an established workflow.
7. Verify the documented validation commands exist and cover the named boundary. Confirm consumer/import checks with repository search and use the project's documentation-pair checker when available.

Use suitable local inspection tools for each format. For example, `file` can establish PNG dimensions and RGBA encoding, while a format-aware image tool may be needed to prove actual alpha-channel content. Report a check as unavailable rather than guessing when the required tool or source evidence is absent.

## Fix Rules

- When edits are authorized, fix every factual, structural, or translation mismatch directly in both documents in the same change set. Otherwise, report the required paired changes without modifying files.
- Preserve the English document as the canonical English wording and make the Traditional Chinese document its complete translation.
- Keep both files at the same line count after edits.
- When repository fact and documented policy differ, update stale factual claims. If the difference represents an unresolved product or architecture decision, preserve the current behavior, report the conflict, and do not silently invent policy.
- Keep governance reusable across asset categories and features. A current feature may provide evidence, but do not turn its file names, format, design tool, or animation technique into a universal mandate.
- Do not mandate SVG, Figma, a global registry, Storybook, visual snapshots, or a particular compression format without a demonstrated repository need. Document decision criteria and replacement contracts instead.
- Keep detailed implementation choreography in the owning feature specification or component; keep this pair focused on asset ownership, source, contracts, budgets, and verification.

## Evidence and Completion

After fixes, run the applicable checks, including `npm run docs:check-pairs` when available, then re-read both complete documents. Return only a concise report containing:

1. EN/ZH line counts and structure/translation result.
2. Inspected asset categories, files, consumers, formats, dimensions, alpha result, and byte-budget result.
3. Corrections applied to each document.
4. Unverified provenance, visual, licensing, or runtime claims and why they remain unverified.
5. Commands run with pass/fail status and the final conclusion: `Asset governance documentation audit: PASSED` or `FAILED`.
