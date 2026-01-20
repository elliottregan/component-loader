# TypeScript Conversion Review

This document reviews the process of converting the component-loader library from JavaScript (with Babel/Jest) to TypeScript (with Bun).

## Overview

| Aspect                  | Before            | After                  |
| ----------------------- | ----------------- | ---------------------- |
| Language                | JavaScript (ES6+) | TypeScript             |
| Runtime/Package Manager | Node.js/npm       | Bun                    |
| Build Tool              | Babel             | Bun build              |
| Test Runner             | Jest              | Bun test               |
| Type Checking           | None              | TypeScript strict mode |

## Issues Addressed

### 1. High Priority Loader Bug (loader.js:13)

**Problem:** The high-priority loader was passing `entry.element` instead of `entry` to `bindComponent()`.

```javascript
// Before (buggy)
high: (entry) => bindComponent(entry.element, this),

// After (fixed)
high: (entry) => bindComponent(entry, this),
```

**Impact:** High-priority components would fail to instantiate because `bindComponent()` expected the full registry entry object (with `Component`, `options`, etc.), not just the DOM element.

### 2. Unsubscribe Bug (loader.js:115)

**Problem:** The `unsubscribe()` method called `sub.splice(i, 1)` on each subscription object, but `sub` is `{context, callback}`, not an array.

```javascript
// Before (buggy)
unsubscribe(subscription) {
  // ...
  this.#subscriptions[subscription].forEach((sub, i) => sub.splice(i, 1));
  return false;
}

// After (fixed)
unsubscribe(subscription, callback?, context?) {
  // ...
  this.#subscriptions[subscription] = this.#subscriptions[subscription].filter(
    (sub) => {
      if (callback && context) {
        return sub.callback !== callback || sub.context !== context;
      }
      // ... proper filtering logic
    }
  );
  return true;
}
```

**Impact:** Unsubscribing would throw a runtime error since objects don't have a `splice` method.

### 3. loadComponent Return Value Issue (loader.js:50-64)

**Problem:** The `loadComponent` method was assigning the return value of loader functions to `entry.instance`, but for high-priority components, `bindComponent()` returns the modified entry object itself (not the instance), causing a circular reference.

```javascript
// Before (caused circular reference)
Object.assign(entry, {
  instance: load(entry), // load() returns entry, not instance
  loaded: true,
});

// After (fixed)
load(entry);
// bindComponent sets loaded=true and instance on entry
```

**Impact:** `entry.instance` would contain the entire entry object instead of the component instance, breaking `instanceof` checks.

## Challenges Encountered

### 1. DOM Mocking for Browser APIs

**Challenge:** The source code uses browser-only APIs that don't exist in Bun's test environment:

- `document.createDocumentFragment().querySelector()` for selector validation
- `window.requestIdleCallback` / `requestAnimationFrame` for deferred loading
- `IntersectionObserver` for lazy loading

**Solution:** Created comprehensive mocks in `test/mocks/dom.ts`:

- `MockDocumentFragment` - Validates CSS selectors
- `MockIntersectionObserver` - Simulates viewport intersection with test helpers
- `createMockWindow()` - Provides `requestIdleCallback`/`requestAnimationFrame` that execute synchronously via `setTimeout`

### 2. TypeScript Type Compatibility with Mocks

**Challenge:** Mock objects don't fully implement HTMLElement (310+ properties), causing type errors.

**Solution:** Used type assertions at call sites:

```typescript
// Helper function for clean type casting
export function asHTMLElement(el: MockElement): HTMLElement {
  return el as unknown as HTMLElement;
}
```

### 3. tsconfig Configuration for Tests

**Challenge:** Initial `tsconfig.json` had `rootDir: "./src"` but tests in `test/` were included, causing TS6059 errors.

**Solution:** Created separate configs:

- `tsconfig.json` - For type checking (includes both src/ and test/)
- `tsconfig.build.json` - For building (extends base, sets `rootDir: "./src"`, excludes test/)

### 4. ComponentConstructor Interface

**Challenge:** Defining a type for Component class constructors that includes both static and instance members.

**Solution:** Created explicit interface in `types.ts`:

```typescript
export interface ComponentConstructor {
  new (element: HTMLElement, options: ComponentOptions, loaderInstance: ComponentLoader): Component;
  selector: string;
  loaderPriority: LoaderPriority;
  loaderPriorityDelay: number;
}
```

## Files Changed

| Action    | File                                          |
| --------- | --------------------------------------------- |
| Deleted   | `babel.config.json`                           |
| Deleted   | `jest-config.json`                            |
| Created   | `bunfig.toml`                                 |
| Created   | `tsconfig.json`                               |
| Created   | `tsconfig.build.json`                         |
| Modified  | `package.json`                                |
| Created   | `test/setup.ts`                               |
| Created   | `test/mocks/dom.ts`                           |
| Created   | `test/util.spec.ts`                           |
| Created   | `test/indexService.spec.ts`                   |
| Created   | `test/registry.spec.ts`                       |
| Created   | `test/index.spec.ts`                          |
| Created   | `test/loader.spec.ts`                         |
| Created   | `src/types.ts`                                |
| Converted | `src/util.js` → `src/util.ts`                 |
| Converted | `src/indexService.js` → `src/indexService.ts` |
| Converted | `src/registry.js` → `src/registry.ts`         |
| Converted | `src/run-in-view.js` → `src/run-in-view.ts`   |
| Converted | `src/loader.js` → `src/loader.ts`             |
| Converted | `src/index.js` → `src/index.ts`               |
| Updated   | `CLAUDE.md`                                   |

## Test Coverage

41 tests across 5 test files covering:

- Utility functions (id generation, selector validation)
- Index service (incrementing counter)
- Registry (entry creation, component binding)
- Component class (constructor, options, pub/sub methods)
- ComponentLoader (registration, loading strategies, pub/sub system)

## Build Output

```
dist/
├── index.js          (6.39 KB - bundled)
├── index.d.ts        (type declarations)
├── index.d.ts.map
├── loader.d.ts
├── registry.d.ts
├── types.d.ts
├── util.d.ts
├── indexService.d.ts
└── run-in-view.d.ts
```

## Lessons Learned

1. **Write tests first** - Having tests before conversion caught the loader bugs immediately
2. **Minimal mocks** - Only mock what's needed; use type assertions for test code
3. **Separate build configs** - Keep type checking config (includes tests) separate from build config
4. **Fix bugs during conversion** - TypeScript's stricter typing naturally surfaces latent bugs
