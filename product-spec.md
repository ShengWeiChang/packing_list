# Packing List App - Product Specification

## 1. Project Overview
### Product Description
A web application that helps users manage travel packing. It supports category management, progress tracking, and a responsive user experience.

## 2. Definitions
- Checklist: A container for a trip that includes destination and travel dates, with optional notes.
- Category: A primary classification of items such as clothing, toiletries, electronics, etc.
- Item: A specific thing to bring, with name, quantity, and packing status.

## 3. Technology Stack
### Frontend
- Framework: Vue.js 3 (Composition API)
- Build Tool: Vite 4.4.9
- CSS Framework: Tailwind CSS 3.4.17
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
- Create multiple trip checklists. Each checklist includes:
  - Destination (destination)
  - Start and end dates (startDate, endDate)
  - Notes (optional)
- Edit basic checklist information
- Delete a checklist
- Switch between checklists

#### Category Management
- Add custom categories
- Edit category names
- Delete a category (also deletes items under it)
- Show a per-category progress bar

#### Item Management
- Add items under a specific category
- Item properties include:
  - Name (name)
  - Quantity (quantity)
  - Category reference (categoryId)
  - Packing status (isPacked)
- Inline edit name and quantity
- Toggle packing status
- Delete items

#### Progress Tracking
- Show overall checklist progress
- Calculate and display per-category progress
- Visual progress bar component
- Real-time updates on changes

#### Responsive Design
- Desktop: Sidebar + main content layout
- Tablet/Narrow screens: Collapsible sidebar with overlay mode
- Mobile: Top bar + drawer-style sidebar
- Responsive grid layout (1–4 columns)

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
├── package.json                        # Dependencies and scripts
├── vite.config.js                      # Vite build config
├── tailwind.config.js                  # Tailwind CSS config
├── postcss.config.js                   # PostCSS config
└── source/                             # Application source
    ├── main.js                         # App entry point (createApp + mount)
    ├── App.vue                         # Root component
    ├── index.css                       # Global styles and Tailwind imports
    ├── models/                         # Domain models
    │   ├── Checklist.js                # Checklist model
    │   ├── Category.js                 # Category model
    │   └── Item.js                     # Item model
    ├── services/                       # Data access layer
    │   ├── dataService.js              # Abstract data service interface
    │   └── localStorageService.js      # LocalStorage implementation
    ├── composables/                    # Vue composables (state + logic)
    │   └── usePackingLists.js          # Core state and CRUD logic
    ├── components/                     # UI components
    │   ├── Sidebar.vue                 # Sidebar navigation
    │   ├── Topbar.vue                  # Top bar for mobile
    │   ├── Checklist.vue               # Main checklist view
    │   ├── ChecklistForm.vue           # Checklist edit form
    │   ├── Category.vue                # Category card
    │   ├── Item.vue                    # Item row/card
    │   ├── ProgressBar.vue             # Progress bar component
    │   ├── AddCategoryButton.vue       # Add category button
    │   ├── AddItemButton.vue           # Add item button
    │   └── OverflowMenu.vue            # Overflow actions menu
    ├── utils/                          # Utilities
    │   ├── constants.js                # App constants
    │   └── helpers.js                  # Helper functions (e.g., ID generation)
    └── data/                           # Static data
        └── defaultItems.js             # Default items for new checklists
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
- Mobile: `< 768px` — vertical layout, top bar
- Tablet: `768px–900px` — collapsible sidebar
- Desktop: `> 900px` — fixed sidebar layout

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
| Checklist     | Main content area                   | Shows categories and items for the selected checklist       |
| Category      | Category card                       | Lists items; shows progress; edit actions                  |
| Item          | Item row/card                       | Toggle packed; inline edit; delete                   |
| ProgressBar   | Progress visualization              | Displays completion percentage               |
| ChecklistForm | Checklist form                      | Create/edit checklist information              |
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
  checklistId: string   // Owning checklist ID
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
  checklistId: string   // Owning checklist ID
}
```
