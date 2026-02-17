# Packing List

> A modern web application for managing travel packing lists with multi-language support and offline-first architecture.

## Features

- **Multi-checklist management** — Create unlimited checklists with drag-and-drop reordering
- **Categorized packing** — Organize items by category with quantity tracking
- **Progress visualization** — Real-time packing progress with visual indicators
- **i18n support** — English and Traditional Chinese
- **Responsive design** — Optimized for mobile and desktop devices
- **Accessible** — WCAG 2.1 Level AA compliant
- **Offline-first** — Local storage with cross-tab synchronization

## Quick Start

**Prerequisites:** Node.js >= 18

```bash
# Clone the repository
git clone <repo-url>
cd packing_list

# Install dependencies
npm install

# Start development server
npm run dev
```

## Tech Stack

- **Frontend:** Vue 3 (Composition API), Vite
- **Styling:** Tailwind CSS
- **Testing:** Vitest, Playwright, @vue/test-utils
- **i18n:** vue-i18n
- **Storage:** localStorage with cross-tab sync

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run serve            # Preview production build

# Testing
npm test                 # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
npm run validate         # Lint + format check
```

## Project Structure

```
packing_list/
├── source/              # Application source
│   ├── components/      # Vue components
│   ├── composables/     # Composition API hooks
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   └── locales/         # i18n translations
├── tests/               # Test suites
├── docs/                # Documentation
└── .github/             # CI/CD workflows
```

## Documentation

- **[Product Specification](docs/product-spec.md)** — Feature requirements and data models
- **[Code Quality Guide](docs/code-quality.md)** — Coding standards and best practices
- **[Testing Guide](docs/testing-guide.md)** — Test architecture and conventions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Run tests (`npm run validate && npm test`)
4. Commit your changes (follows conventional commits)
5. Push to the branch (`git push origin feature/new-feature`)
6. Open a Pull Request

CI/CD pipeline runs automatically on all PRs (linting, tests, build).

## License

MIT
