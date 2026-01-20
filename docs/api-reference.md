# API Reference

Complete TypeScript type definitions and API documentation.

## Exports

```typescript
import Component, { ComponentLoader } from "@elliottregan/component-loader";

// Type imports
import type {
  ComponentConstructor,
  ComponentInput,
  ComponentOptions,
  ComponentWithOptions,
  IdleQueueDoneCallback,
  LoaderPriority,
  RegistryEntry,
  RunInViewOptions,
  SubscriberContext,
  Subscription,
  SubscriptionCallback,
} from "@elliottregan/component-loader";
```

## Types

### `LoaderPriority`

```typescript
type LoaderPriority = "high" | "idle" | "in-view";
```

Controls when a component initializes.

### `ComponentOptions`

```typescript
type ComponentOptions = Record<string, unknown>;
```

Key-value options passed to components during registration.

### `ComponentConstructor`

```typescript
interface ComponentConstructor {
  new (
    element: HTMLElement,
    options: ComponentOptions,
    loaderInstance: ComponentLoader
  ): Component;
  selector: string;
  loaderPriority: LoaderPriority;
  loaderPriorityDelay: number;
}
```

Interface for Component class constructors.

### `ComponentWithOptions`

```typescript
type ComponentWithOptions = [ComponentConstructor, ComponentOptions];
```

Tuple for registering a component with options.

### `ComponentInput`

```typescript
type ComponentInput = ComponentConstructor | ComponentWithOptions;
```

Valid input for component registration.

### `RegistryEntry`

```typescript
interface RegistryEntry {
  id: string;
  loaded: boolean | "pending";
  element: HTMLElement;
  Component: ComponentConstructor;
  options?: ComponentOptions;
  instance?: Component;
  loaderInstance?: ComponentLoader;
}
```

Internal registry entry for tracking components.

### `SubscriberContext`

```typescript
interface SubscriberContext {
  $id: string;
}
```

Context object with component ID for pub/sub.

### `Subscription`

```typescript
interface Subscription {
  context: SubscriberContext;
  callback: (...args: unknown[]) => void;
}
```

Internal subscription entry.

### `SubscriptionCallback`

```typescript
type SubscriptionCallback = (...args: unknown[]) => void;
```

Callback function for pub/sub subscriptions.

### `IdleQueueDoneCallback`

```typescript
type IdleQueueDoneCallback = () => void;
```

Callback invoked when all idle components finish loading.

### `RunInViewOptions`

```typescript
interface RunInViewOptions {
  threshold?: number[];
  percent?: number;
  count?: number;
}
```

Options for IntersectionObserver configuration.

## Component Class

### Static Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selector` | `string` | (required) | CSS selector for elements |
| `loaderPriority` | `LoaderPriority` | `"idle"` | When to initialize |
| `loaderPriorityDelay` | `number` | `0` | Reserved for future use |

### Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `$id` | `string` | Unique instance identifier |
| `$container` | `HTMLElement` | Bound DOM element |
| `$options` | `ComponentOptions` | Registration options |

### Instance Methods

#### `$setOptions(options, defaults?)`

```typescript
$setOptions(options: ComponentOptions, DEFAULTS?: ComponentOptions): void
```

Merges options with defaults into `$options`.

#### `$debug(...args)`

```typescript
$debug(...args: unknown[]): void
```

Logs debug output prefixed with `$id`.

#### `$publish(subscription, ...args)`

```typescript
$publish(subscription: string, ...args: unknown[]): void
```

Publishes a message to subscribers.

#### `$subscribe(subscription, callback)`

```typescript
$subscribe(subscription: string, callback: SubscriptionCallback): void
```

Subscribes to a message channel.

#### `$unsubscribe(subscription, callback)`

```typescript
$unsubscribe(subscription: string, callback: SubscriptionCallback): void
```

Removes a subscription.

## ComponentLoader Class

### Constructor

```typescript
new ComponentLoader(
  container: HTMLElement,
  components: ComponentInput[],
  idleQueueDoneCallback?: IdleQueueDoneCallback
)
```

### Methods

#### `getRegistry()`

```typescript
getRegistry(): Map<string, RegistryEntry>
```

Returns the component registry.

#### `getLoader(priority)`

```typescript
getLoader(priority: LoaderPriority): LoaderFunction
```

Returns the loader function for a priority level.

#### `subscribe(subscription, callback, context)`

```typescript
subscribe(
  subscription: string,
  callback: SubscriptionCallback,
  context: SubscriberContext
): void
```

Registers a pub/sub subscription.

#### `unsubscribe(subscription, callback?, context?)`

```typescript
unsubscribe(
  subscription: string,
  callback?: SubscriptionCallback,
  context?: SubscriberContext
): boolean
```

Removes subscriptions. Returns `false` if subscription doesn't exist.

#### `publish(subscription, originId, ...args)`

```typescript
publish(
  subscription: string,
  originId: string,
  ...args: unknown[]
): boolean
```

Publishes to subscribers (excluding origin). Returns `false` if no subscribers.

## Browser Support

| Feature | Fallback |
|---------|----------|
| `requestIdleCallback` | `requestAnimationFrame` |
| `IntersectionObserver` | `requestAnimationFrame` (immediate load) |
