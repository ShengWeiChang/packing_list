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
- `npm run format` — Run Prettier to format the `source/` directory

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

## Troubleshooting
- Tailwind not applying? Ensure `tailwind.config.js` `content` includes `source/**/*.vue` and `source/**/*.js`.
- Install issues? Remove `node_modules` and `package-lock.json`, then run `npm install` again.

## License
MIT
