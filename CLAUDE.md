# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- **Build**: `bun run build` - Bundles src/ to dist/ and generates TypeScript declarations
- **Test**: `bun test` - Runs Bun tests (files matching `*.spec.ts` in test/)
- **Run single test**: `bun test test/path/to/file.spec.ts`
- **Type check**: `bunx tsc --noEmit` - Check TypeScript types without emitting

## Architecture

This is a browser component loading system (`@elliottregan/component-loader`) that initializes TypeScript/JavaScript components on DOM elements with configurable load timing to avoid page load bottlenecks.

### Core Classes

**Component** (`src/index.ts`) - Base class that all user components extend:
- Static `loaderPriority` controls when the component initializes (`'high'`, `'idle'`, `'in-view'`)
- Static `selector` (required) - CSS selector to find DOM elements
- Provides pub/sub methods (`$publish`, `$subscribe`, `$unsubscribe`) for inter-component communication
- Each instance gets a unique `$id` and reference to its DOM element via `$container`

**ComponentLoader** (`src/loader.ts`) - Orchestrates component initialization:
- Takes a container element and array of Component classes
- Maintains a registry (Map) of all component entries
- Three loading strategies:
  - `high`: Immediate initialization
  - `idle`: Deferred via `requestIdleCallback`/`requestAnimationFrame`
  - `in-view`: Lazy-loaded when element enters viewport (uses internal `run-in-view` module)
- Internal pub/sub system for component communication

### Supporting Modules

- `types.ts` - Shared TypeScript type definitions
- `registry.ts` - Creates registry entries and binds component instances to DOM elements (attaches instance to `element.component`)
- `indexService.ts` - Generates incrementing IDs for component instances
- `util.ts` - ID generation and CSS selector validation
- `run-in-view.ts` - IntersectionObserver-based lazy loading utility

### Data Flow

1. `ComponentLoader` receives Component classes with `selector` properties
2. Queries DOM for matching elements, creates registry entries
3. Loads components based on their `loaderPriority`
4. Binds instantiated components to DOM elements via `element.component`

### Test Infrastructure

Tests use Bun's built-in test runner with DOM mocks in `test/mocks/dom.ts` for browser API simulation (IntersectionObserver, requestIdleCallback, etc.).
