# Refactoring Report: loader.ts Decomposition

## Overview

This report documents the refactoring of `loader.ts` in the `@elliottregan/component-loader` library to improve code clarity, maintainability, and adherence to single-responsibility principles.

## Initial State

### Problem Identification

`loader.ts` was 196 lines—nearly double the 100-line target maintained by other files in the codebase. Analysis revealed three distinct responsibilities mixed within a single class:

1. **Registry management** - Tracking component instances and their DOM bindings
2. **Component loading orchestration** - Coordinating different loading strategies (immediate, idle, in-view)
3. **Pub/Sub system** - Inter-component messaging infrastructure

### Code Quality Issues Found

| Issue | Location | Severity |
|-------|----------|----------|
| Dead code: `_addToQueue()` method | lines 95-97 | Low |
| Misleading name: `_getComponentsBySelector()` actually retrieved by ID | line 122 | Low |
| Duplicated idle/RAF branching logic | lines 101-119 | Medium |
| Mixed concerns in single class | throughout | Medium |

## Refactoring Approach

### Extraction Strategy

We extracted two cohesive modules:

**1. PubSub class (`src/pubsub.ts`)**

Encapsulates the subscription management pattern:
- `subscribe()` - Register callbacks with context
- `unsubscribe()` - Remove subscriptions by callback, context, or both
- `publish()` - Broadcast to subscribers, excluding origin

**2. runIdleQueue helper (`src/idle-queue.ts`)**

Consolidates the idle callback logic:
- Unified handling of `requestIdleCallback` with `requestAnimationFrame` fallback
- Cleaner iteration with completion callback
- Eliminated duplicated branching structure

### Dead Code Removal

**`_addToQueue()` method (lines 95-97)**
```typescript
private _addToQueue(...args: unknown[]): void {
  this.#idleQueue.push({ args } as unknown as RegistryEntry);
}
```
This method was never called anywhere in the codebase. It also had a suspicious type cast (`as unknown as RegistryEntry`) suggesting it was either incomplete or abandoned. Removed entirely.

**`_getComponentsBySelector()` method (line 122)**
```typescript
private _getComponentsBySelector(selector: string): RegistryEntry | undefined {
  return this.#registry.get(selector);
}
```
Despite its name suggesting selector-based lookup, this was a simple ID-based registry access. It was never called externally or internally. Removed as unnecessary indirection.

## Results

### File Size Comparison

| File | Before | After | Change |
|------|--------|-------|--------|
| loader.ts | 196 | 137 | -30% |
| pubsub.ts | - | 58 | new |
| idle-queue.ts | - | 28 | new |
| **Total** | 196 | 223 | +14% |

The total line count increased slightly, but this reflects proper separation of concerns with explicit interfaces rather than implicit coupling.

### Test Coverage

| Metric | Before | After |
|--------|--------|-------|
| Test files | 5 | 7 |
| Test cases | 41 | 58 |
| Assertions | 70 | 88 |

New test files provide focused coverage:
- `test/pubsub.spec.ts` - 10 tests covering subscribe, publish, unsubscribe edge cases
- `test/idle-queue.spec.ts` - 6 tests covering RAF fallback, completion callbacks

### Verification

All quality gates passed:
- `bun test` - 58 tests, 0 failures
- `bun run build` - Successful bundle generation
- `bunx tsc --noEmit` - No type errors

## Architecture Improvements

### Before
```
ComponentLoader
├── Registry management (Map operations)
├── Loading strategies (high/idle/in-view)
├── Idle queue processing (requestIdleCallback/RAF)
└── Pub/Sub system (subscribe/unsubscribe/publish)
```

### After
```
ComponentLoader
├── Registry management (Map operations)
├── Loading strategies (high/idle/in-view)
├── Uses: runIdleQueue() for deferred loading
└── Uses: PubSub instance for messaging

PubSub (standalone)
└── subscribe/unsubscribe/publish

runIdleQueue (standalone)
└── Idle callback orchestration with RAF fallback
```

## Public API Impact

**No breaking changes.** The `ComponentLoader` class maintains identical public methods:
- `subscribe()`
- `unsubscribe()`
- `publish()`
- `getRegistry()`
- `getLoader()`
- `loadComponent()`

Internal delegation to `PubSub` and `runIdleQueue` is transparent to consumers.

## Lessons Learned

1. **Dead code accumulates** - The `_addToQueue` method likely survived because it was private and had no callers to fail. Regular dead code analysis should be part of maintenance.

2. **Misleading names cause confusion** - `_getComponentsBySelector` retrieving by ID could mislead future maintainers. Accurate naming matters even for private methods.

3. **Extraction reveals reusability** - The `PubSub` class is now independently testable and potentially reusable in other contexts.

4. **Small modules compose better** - The idle queue logic, once extracted, became a simple 28-line function with clear inputs and outputs.

## Recommendations

1. Consider adding a lint rule to flag unused private methods
2. The `PubSub` class could be exported for external use if consumers need standalone messaging
3. Future consideration: the `#loaders` record could be extracted if additional loading strategies are added
