# Asset Governance

## 1. Purpose

This document defines how visual assets are selected, stored, replaced, and verified. It keeps UI icons, feature illustrations, and public brand files governed by one policy without forcing them into one runtime system.

## 2. Asset Categories and Ownership

| Category              | Runtime owner                              | Canonical source                                     | Repository rule                                                                                                                                 |
| --------------------- | ------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| UI icons              | `source/components/AppIcon.vue`            | `@lucide/vue` and its project-owned semantic mapping | Map project semantics to suitable Lucide icons; use a custom exported icon only when the library is insufficient and the exception is reviewed. |
| Feature illustrations | The feature component that imports them    | Figma frame or approved source artwork               | Store bundled exports under `source/assets/<feature>/`; keep dynamic text in HTML/CSS.                                                          |
| Public brand assets   | `index.html` or another public entry point | Approved brand source or project-owned source file   | Use `public/` only for files that must retain a stable public URL, such as the current favicon or social metadata images.                       |

`AppIcon` and feature illustrations are related design-system assets, but they do not share a registry: icons are semantic Vue components, while illustrations are feature-owned visual layers.

## 3. Source Layout

```text
source/assets/
└─ completion/
   ├─ airport-terminal.png
   ├─ baggage-label.png
   ├─ packing-suitcase.png
   └─ takeoff-plane.png

public/
└─ favicon.svg
```

Use one feature-named directory while only one visual-media type exists. Add a second directory such as `onboarding/` or `empty-states/` when that feature exists. Do not create `illustrations/`, `brand/`, or a global asset manifest before there are real consumers that need those distinctions.

## 4. Asset Replacement Contracts

| File                   | Role                         | Replacement contract                                                                                                              |
| ---------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `packing-suitcase.png` | Foreground animated suitcase | Transparent background; front-facing, vertical case; handle at top and wheels at bottom; subject centered within a stable canvas. |
| `baggage-label.png`    | Sticker substrate            | Transparent background; horizontal label; left-side text-safe area; no fixed itinerary, date, checklist name, or departure text.  |
| `airport-terminal.png` | Background terminal          | Transparent background; horizontal composition with a stable ground baseline; low-detail background treatment.                    |
| `takeoff-plane.png`    | Takeoff layer                | Transparent background; aircraft points toward the upper right; stable visual center so CSS translate and scale retain the route. |

Replacement artwork may change color, texture, and illustration detail, but must preserve its stated orientation, transparent canvas, visual anchor, and text-safe area. If a replacement changes one of those contracts, update the component CSS and this document in the same change.

`public/favicon.svg` must keep its stable `/favicon.svg` URL, square `viewBox`, recognizable primary mark at favicon sizes, and valid standalone SVG markup. A replacement may change the artwork or palette but must update `index.html` if its path or MIME type changes.

## 5. Current Asset Inventory and Provenance

| File                   | Dimensions            | Bytes     | Transparency evidence               |
| ---------------------- | --------------------- | --------- | ----------------------------------- |
| `airport-terminal.png` | 1902 × 827 px         | 519,583   | 8-bit RGBA; alpha values span 0–255 |
| `baggage-label.png`    | 1912 × 823 px         | 1,628,497 | 8-bit RGBA; alpha values span 0–255 |
| `packing-suitcase.png` | 1024 × 1536 px        | 1,939,607 | 8-bit RGBA; alpha values span 0–254 |
| `takeoff-plane.png`    | 1536 × 1024 px        | 819,737   | 8-bit RGBA; alpha values span 0–254 |
| `public/favicon.svg`   | `viewBox 0 0 100 100` | 385       | SVG shapes; no raster alpha channel |

The four committed PNGs total 4,907,424 bytes (4.91 decimal MB or approximately 4.68 MiB). They are the approved interim raster masters and deployable exports for this scene. The 385-byte favicon is the current project-owned public brand source and deployable asset. No durable editable Figma/vector master, generation record, or separate licensing record for the completion illustrations is currently stored in the repository; establish and link that source before claiming a reproducible editable-artwork workflow.

## 6. Design and Export Rules

- Figma is the preferred editable source when a visual system is established; the committed PNG or WebP is the deployable export, not the editable master.
- Keep user-facing dynamic text as HTML/CSS. The completion sticker renders its date, checklist name, and departure message outside the bitmap.
- Use PNG or WebP for textured or paper-like illustrations. Use SVG only for simple, scale-independent artwork that needs runtime color, stroke, or path animation control.
- Preserve transparent backgrounds for independently animated layers.
- Check a proposed export at its largest rendered size and at the narrow viewport before replacing an existing file.
- Current completion files may not exceed 2,000,000 bytes individually or 5,000,000 bytes collectively without an explicit performance review. Prefer an optimized WebP replacement when the visual result remains approved.

## 7. Change and Verification Workflow

1. Update the Figma or approved source artwork.
2. Export with the existing file name and its replacement contract, or change both contract and consuming CSS deliberately.
3. Record the editable source or interim-master provenance, export dimensions, format, alpha result, and byte size.
4. Run `npm run build` to verify bundled imports and `npm run test:run -- tests/component-tests/PackingCompletionOverlay.test.js` for the layer contract.
5. Run `npm run docs:check-pairs` whenever this governance document changes.
6. Add deterministic visual snapshots when visual-regression risk, stable rendering, and expected maintenance cost justify them; a second illustration collection or a recurring responsive regression are useful signals, not hard gates. Do not add Storybook solely for one completion scene.
