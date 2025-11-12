# Packing List

Interactive Packing List web application built with Vue 3, Vite and Tailwind CSS.

## Project Overview

This project is a minimal viable product (MVP) for managing packing lists. Features include categorized items, progress tracking, and local persistence via browser localStorage.

## Quick Start

Prerequisites: Node.js >= 18, npm

```bash
git clone <repo-url>
cd packing_list
npm install
npm run dev
```

## Available Scripts

- `npm run dev` — Start the Vite development server (with HMR)
- `npm run build` — Build production assets into `dist/`
- `npm run serve` — Preview the production build locally
- `npm run build:css-vars` — Generate CSS variables from `source/utils/constants.js`
- `npm run lint` — Run ESLint to check code quality
- `npm run lint:fix` — Auto-fix ESLint issues
- `npm run format` — Run Prettier to format all files
- `npm run format:check` — Check if files are properly formatted
- `npm run validate` — Run both linting and format checking

## Project Structure

- `source/` — application source code
  - `models/` — data models (Checklist, Category, Item)
  - `components/` — Vue single-file components (Sidebar, Checklist, Category, Item, ...)
  - `composables/` — composables (e.g. `usePackingLists.js`) for business logic
  - `services/` — data services (e.g. `localStorageService.js`)
  - `utils/` — constants and helper functions
- `product-spec.md` — product specification and feature list

## Development Notes

- Code formatting: Prettier is configured via `.prettierrc`. Use `npm run format` or enable `formatOnSave` in your editor.
- Naming conventions: Vue components use PascalCase; composables use `use*` prefix.
- Data persistence: application data is stored in `localStorage`. To clear data in the browser, open DevTools → Application → Local Storage and remove the key used by the app.
- Theme colors: All colors are defined in `source/utils/constants.js`. After editing, run `npm run build:css-vars` to regenerate CSS variables in `source/index.css`.

## Build Locally

```bash
npm run build    # Build to dist/
npm run serve    # Preview production build at http://localhost:4173
```

## Troubleshooting

- Tailwind not applying? Ensure `tailwind.config.js` `content` includes `source/**/*.vue` and `source/**/*.js`.
- Install issues? Remove `node_modules` and `package-lock.json`, then run `npm install` again.

## License

MIT
