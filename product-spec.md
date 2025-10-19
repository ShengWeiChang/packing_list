# Packing List App - Product Specification

## 1. Project Overview
### Product Description
A web application that helps users manage travel packing. It supports category management, progress tracking, and a responsive user experience.

## 2. Definitions
Checklist, Category, and Item are the three core data entities of the app. Below are concise definitions, common fields, and examples:

- Checklist
  - Description: A packing list container for a trip that includes trip info and its associated categories and items.
  - Properties:
    - id: string (unique identifier)
    - destination: string (destination)
    - startDate: string (start date, ISO format)
    - endDate: string (end date, ISO format)
  - Example: { id: "c1", destination: "Tokyo", startDate: "2025-12-01", endDate: "2025-12-07" }

- Category
  - Description: A grouping/label for items within a checklist (e.g., clothing, toiletries).
  - Properties:
    - id: string (unique identifier)
    - name: string (category name)
    - checklistId: string (owning checklist ID)
    - order: number (display/sort priority, default 0)
  - Example: { id: "cat-travel-clothes", name: "Clothing", checklistId: "c1", order: 0 }

- Item
  - Description: A single item entry in a checklist, with quantity and packing status; can be reordered or moved between categories.
  - Properties:
    - id: string (unique identifier)
    - name: string (item name)
    - quantity: number (quantity)
    - categoryId: string (owning category ID)
    - isPacked: boolean (packed status)
    - checklistId: string (owning checklist ID)
    - order: number (display/sort priority, default 0)
  - Example: { id: "item-01", name: "T-shirt", quantity: 3, categoryId: "cat-travel-clothes", isPacked: false, checklistId: "c1", order: 10 }

## 3. Technology Stack
### Frontend
- Framework: Vue.js 3 (Composition API)
- Build Tool: Vite 4.4.9
- CSS Framework: Tailwind CSS 3.4.17
- Drag and Drop: vuedraggable 4.1.0
- Additional Tools: PostCSS, Autoprefixer

### Data Storage
- MVP: Browser localStorage
- Future: Cloud database (Firebase/Supabase)

### Build & Development Tools
- Dev Server: Vite dev server with HMR
- CSS Processing: PostCSS with Tailwind CSS
- Module Bundling: Vite with ES modules

## 4. Implemented Features

### Core Functionality

#### Checklist Management
- Purpose: Let users manage multiple packing lists and create a new list for each trip.
- Key features:
  - Create checklist: Auto-seed default categories and items from `source/data/defaultItems.js`.
    - Categories: Built from default data by removing duplicate category names; assign `order` based on creation sequence (starting at 0).
    - Items: Created one by one with the correct `categoryId`, `isPacked=false`, and sequential `order` (starting at 0).
  - Edit checklist: Edit `destination`, `startDate`, `endDate` (native date inputs, ISO format).
  - Delete checklist: Cascade delete all categories and items under the checklist.
  - Switch checklist: Load that checklist’s categories and items, sorted by `order`.
- Flow: Create checklist → add categories/items → edit info → switch checklists.
- Validation:
  - After create:
    - Categories count equals the number of distinct category names in default data; each `checklistId` equals the new checklist ID; `order` is continuous from 0.
    - Items count equals default total; each has `isPacked=false`, correct `categoryId`, and `order` continuous from 0.
    - localStorage (key: `packingListApp`) contains the new data; persists after reload.
  - Edit: UI updates immediately and persists; dates are `YYYY-MM-DD`.
  - Delete: Checklist, categories, and items are all removed from localStorage; UI switches to another list or empty state.
  - Switch: Categories/items load sorted by `order`; progress bar reflects the current checklist.

#### Category Management
- Purpose: Organize items within a checklist to improve browsing and management.
- Key features:
  - Add category: Appends to the end, `order = current max order + 1`.
  - Rename category: Inline edit and persist on save/blur.
  - Delete category: Cascade delete all items under it.
  - Reorder categories: Drag to update `order` (starting at 0); persists and remains after reload.
  - Progress display: Calculate completion percentage based on `isPacked` of items within the category.
- Flow: Add → rename → delete → drag to reorder.
- Validation:
  - After add: Category `order` is last; localStorage updates; order persists after reload.
  - After delete: Its items disappear from UI and localStorage.
  - After drag: Each category `order` is continuous from 0; order persists after reload.
  - Progress: Completed/total syncs with item check/uncheck.

#### Item Management
- Purpose: Manage individual item entries in a checklist, supporting create/edit/delete, toggle packing, and drag reorder/move; updates progress in real time.
- Key features:
  - Create item: In a specified category, `isPacked=false`, `order = max order of that category + 1`.
  - Edit item: Inline edit name and quantity (min 1); delete item.
  - Toggle status: Toggling `isPacked` immediately updates category and checklist progress; preserves `order`.
  - Dragging:
    - Same category: After reorder, rewrite `order` sequentially (0-based).
    - Cross category: Update target item’s `categoryId` and `order`, and adjust both source and target categories’ other items to keep `order` continuous.
- Flow: Add → edit → check/uncheck → delete or drag to reorder/move.
- Validation:
  - After add: Item `order` is last, `isPacked=false`; localStorage updates and persists after reload.
  - After edit/delete: UI updates and persists; deleted item removed from UI and localStorage.
  - Same-category reorder: Each item `order` is continuous from 0; persists after reload.
  - Cross-category move: Target `categoryId` and `order` are correct; remaining items in both categories have continuous `order`; progress updates correctly on both sides.

#### Progress Tracking
- Purpose: Provide immediate, visual feedback of completion at both checklist and category levels.
- Key features:
  - Checklist progress: `total = items.length`, `completed = items.filter(isPacked).length`; shown under the checklist header (`ProgressBar.vue`).
  - Category progress: Based on that category’s `sortedItems.length` and `isPacked` counts; shown on the category card (`Category.vue`).
  - Percentage formula: `Math.round(completed / total * 100)`; when `total = 0`, returns `0` (`ProgressBar.vue`).
  - Completed styling: When all items in a category are packed and the list is non-empty, the card shows a completed background style.
- Flow:
  - Check/uncheck items → category and checklist progress update immediately.
  - Add/delete/drag items → progress recalculates automatically.
  - Switch checklist → progress recalculates for the selected list.
- Validation:
  - Empty set: `total=0` displays `0%`; no divide-by-zero/NaN.
  - Rounding: e.g., 1/3 → `33%`, 2/3 → `67%`.
  - Completed style: Category turns green only when non-empty and fully packed.
  - Persistence: Packing status saved in localStorage; progress matches UI after reload.
  - Cross-category moves: Source/target category completion updates correctly; checklist total progress stays correct.

#### Responsive Design
- Purpose: Offer a smooth, usable experience across devices and viewport widths.
- Key features:
  - Breakpoints & behavior:
    - Mobile (<600px): Show `Topbar` (`md:hidden`), `Sidebar` as an overlay drawer (teleport to `body` with dimmed backdrop; click backdrop to close); main content blurs and pointer events are disabled.
    - Narrow desktop (<1000px): `Sidebar` also uses overlay drawer mode.
    - Desktop (≥1000px): `Sidebar` is sticky (fixed within layout) and can expand (`w-52`) or collapse (`w-16`); manual collapse state is remembered in `localStorage('sidebar-manually-collapsed')`.
  - Content layout:
    - Categories masonry: CSS columns via `categories-masonry`, with `column-count` adapting to 1 (<600), 2 (≥600), 3 (≥840), 4 (≥1280).
    - No card breaks: Category wrappers use `break-inside: avoid` with smooth transitions to reduce jitter.
  - Usability:
    - When the drawer is open, set `document.body.style.overflow='hidden'` to prevent background scroll; transitions around 200–300ms.
- Flow:
  - Layout switches automatically based on viewport; mobile toggles `Sidebar` via hamburger; desktop can manually collapse/expand and the state is remembered.
- Validation:
  - Switching sizes between <600, 600–999, and ≥1000 verifies `Topbar`, `Sidebar` drawer/fixed modes, and main-content blur behavior.
  - Drawer open: main content is blurred and non-interactive; clicking backdrop closes the drawer; body scroll restores after close.
  - Desktop refresh: `Sidebar` collapse state reflects `localStorage` value.
  - Masonry columns adjust at breakpoints; category cards don’t break across columns.

#### Internationalization (i18n)
- Purpose: Provide a multi-language interface so users can switch languages with immediate effect, and persist their preference.
- Key features:
  - Language switcher: Located in the Sidebar as a globe icon button with a dropdown menu.
  - Supported languages: English (`en`), Traditional Chinese (`zh-TW`).
  - Initial detection and fallback: Prefer the saved localStorage setting first; otherwise infer from the browser’s language; default fallback is English (`en`).
  - Traditional Chinese variants mapping: Common variants (`zh`, `zh-Hant`, `zh-TW`, `zh-HK`, `zh-MO`) are normalized to `zh-TW`.
  - Accessibility strings: Assistive texts like button `aria-label`/`title` switch with the current locale as well.
  - String fallback: Missing keys fall back to English via `fallbackLocale: 'en'`.
- Flow:
  - User clicks the language button in the Sidebar and selects EN / Traditional Chinese; UI text updates immediately and the preference is stored (localStorage key: `user-locale`).
- Validation:
  - Interaction: After switching language from the Sidebar, buttons, titles, menus, and `aria-label/title` update immediately.
  - Persistence: After a refresh, the previously selected language remains in effect (read from localStorage `user-locale`).
  - Detection: With no prior preference, infer from the browser language; non-`zh` series defaults to English; `zh/zh-Hant/zh-TW/zh-HK/zh-MO` are mapped to `zh-TW`.
  - Fallback: Temporarily remove a translation key to verify the app falls back to English (ensuring `fallbackLocale` takes effect).


#### Drag and Drop
- Purpose: Quickly reorder and reorganize categories/items by dragging, keeping orders consistent with minimal effort.
- Key features:
  - Item dragging (`Category.vue` with `vuedraggable` group: `items`):
    - Same-category reorder: On drop, rewrite all items’ `order = 0..n` in that category; `isPacked` unchanged.
    - Cross-category move: Update the moved item’s `categoryId` and `order = evt.newIndex`; shift subsequent items in the target category (`order + 1` after the insertion point) and renumber the source category (`order = 0..n`).
    - Drop restriction: Only allow drops within item containers (`group.put` check).
  - Category dragging (`Checklist.vue` with `vuedraggable` group: `categories`):
    - Reorder categories within a checklist; after drop, set categories’ `order = 0..n`.
    - Drop restriction: Only allow drops within the categories container.
  - Visuals & motion:
    - `ghost/chosen/drag` classes for translucent, grab, and scale effects, ~200ms animations; keep masonry layout stable while dragging.
  - Persistence:
    - Drag events are handled by parent logic to call `updateItem`/`updateCategory` and then `getItems`/`getCategories` to ensure consistency; orders persist across reloads.
- Flow:
  - Press and hold on an item or category → drag to the target position/category → drop → reorder/save.
- Validation:
  - Same-category: `items.order` is continuous from 0; persists after reload.
  - Cross-category: Target item’s `categoryId`/`order` correct; other items in both categories have continuous `order`; both categories’ and overall progress update immediately.
  - Categories: All `categories.order` are continuous from 0; persists after reload.
  - UX: Drag visuals present; animations are smooth without noticeable jitter/flicker.

### Technical Implementation
#### Architecture Pattern
- MVVM-like (Vue + Composition API): clear domain models, composable as ViewModel, and component-based Views
- Composition API for logic reuse and state management
- Service Layer for abstracted data access
- Component-based UI modules

#### Data Persistence
- LocalStorageService implements client-side persistence
- Abstract DataService interface allows future backends
- JSON serialization with model instances (toJSON/fromJSON)

#### State Management
- usePackingLists composable centralizes business logic and state
- Reactive data binding
- Computed properties update automatically

## 5. File Structure
```
packing-list/
├── index.html                          # Entry HTML
├── LICENSE                             # License terms
├── package.json                        # Dependencies and scripts
├── postcss.config.js                   # PostCSS config
├── tailwind.config.js                  # Tailwind CSS config
├── vite.config.js                      # Vite build config
└── source/                             # Application source
  ├── App.vue                         # Root component
  ├── index.css                       # Global styles and Tailwind imports
  ├── main.js                         # App entry point (createApp + mount)
  ├── components/                     # UI components
  │   ├── AddCategoryButton.vue       # Add category button
  │   ├── AddItemButton.vue           # Add item button
  │   ├── Category.vue                # Category card
  │   ├── Checklist.vue               # Main checklist view
  │   ├── Item.vue                    # Item row/card
  │   ├── OverflowMenu.vue            # Overflow actions menu
  │   ├── ProgressBar.vue             # Progress bar component
  │   ├── Sidebar.vue                 # Sidebar navigation
  │   └── Topbar.vue                  # Top bar for mobile
  ├── composables/                    # Vue composables (state + logic)
  │   └── usePackingLists.js          # Core state and CRUD logic
  ├── data/                           # Static data
  │   └── defaultItems.js             # Default items for new checklists
  ├── models/                         # Domain models
  │   ├── Category.js                 # Category model
  │   ├── Checklist.js                # Checklist model
  │   └── Item.js                     # Item model
  ├── services/                       # Data access layer
  │   ├── dataService.js              # Abstract data service interface
  │   └── localStorageService.js      # LocalStorage implementation
  └── utils/                          # Utilities
    ├── constants.js                # App constants
    └── helpers.js                  # Helper functions (e.g., ID generation)
```

## 6. UI/UX Design

### Visual Design
#### Color System
- Primary text: `rgba(33, 33, 33, 1)` — dark gray
- Secondary text: `rgba(100, 100, 100, 1)` — mid gray
- Primary brand: `rgba(47, 107, 70, 1)` — forest green
- Accent: `rgba(211, 227, 219, 1)` — light green-gray
- Background: `rgba(255, 255, 255, 1)` — white
- Surface: `rgba(248, 250, 252, 1)` — light gray

#### Design System
- Fonts: System font stack
- Radius: Tailwind radius scale
- Shadows: Subtle elevation for depth
- Spacing: Tailwind spacing scale for consistency

### Responsive Breakpoints
- Mobile: `< 600px` — vertical layout, show Topbar (`md:hidden`)
- Narrow desktop: `600px–999px` — Sidebar as overlay drawer
- Desktop: `≥ 1000px` — Fixed Sidebar with expandable/collapsible state (remembered)

### Interaction Design
#### Sidebar Behavior
- Desktop: Always visible; can be collapsed to icon mode
- Tablet: Auto-collapses; expands as an overlay
- Mobile: Drawer-style sidebar from the left

#### Content Layout
- Grid: Responsive grid (1–4 columns)
- Cards: Consistent card style system
- Forms: Inline editing with validation

### Component Specifications

| Component     | Description                         | Interactions |
|---------------|-------------------------------------|--------------|
| Sidebar       | Checklist navigation and management | Responsive collapse/expand; checklist selection      |
| Topbar        | Mobile navigation bar               | Hamburger menu; quick add checklist                |
| Checklist     | Main content area                   | Shows categories and items for the selected checklist; drag and drop for category reordering; masonry layout       |
| Category      | Category card                       | Lists items; shows progress; edit actions; drag and drop for item reordering and movement                  |
| Item          | Item row/card                       | Toggle packed; inline edit; delete; draggable within/between categories                   |
| ProgressBar   | Progress visualization              | Displays completion percentage               |
| OverflowMenu  | Overflow actions                    | Edit/delete and other actions                  |

## 7. Data Models

### Checklist Model
```javascript
{
  id: string,           // Unique identifier
  destination: string,  // Destination
  startDate: string,    // Start date (ISO)
  endDate: string       // End date (ISO)
}
```

### Category Model
```javascript
{
  id: string,           // Unique identifier
  name: string,         // Category name
  checklistId: string,  // Owning checklist ID
  order: number         // Display order (default: 0)
}
```

### Item Model
```javascript
{
  id: string,           // Unique identifier
  name: string,         // Item name
  quantity: number,     // Quantity
  categoryId: string,   // Category ID
  isPacked: boolean,    // Packed status
  checklistId: string,  // Owning checklist ID
  order: number         // Display order (default: 0)
}
```
