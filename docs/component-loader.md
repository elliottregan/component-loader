# ComponentLoader

The `ComponentLoader` class orchestrates component initialization. It scans a container element for components, manages their lifecycle, and coordinates communication between them.

## Basic Usage

```typescript
import Component, { ComponentLoader } from "@elliottregan/component-loader";

// Define components
class Header extends Component {
  static selector = ".header";
  static loaderPriority = "high";
}

class LazyImage extends Component {
  static selector = ".lazy-image";
  static loaderPriority = "in-view";
}

// Initialize
const loader = new ComponentLoader(
  document.body,
  [Header, LazyImage]
);
```

## Constructor

```typescript
new ComponentLoader(container, components, idleQueueDoneCallback?)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `HTMLElement` | Root element to scan for components |
| `components` | `ComponentInput[]` | Array of component classes or tuples |
| `idleQueueDoneCallback` | `() => void` | Called when idle queue finishes (optional) |

## Registering Components

### Simple Registration

Pass component classes directly:

```typescript
new ComponentLoader(document.body, [
  HeaderComponent,
  FooterComponent,
  SidebarComponent
]);
```

### Registration with Options

Pass a tuple of `[ComponentClass, options]`:

```typescript
new ComponentLoader(document.body, [
  HeaderComponent,
  [SliderComponent, { autoplay: true, interval: 5000 }],
  [ModalComponent, { closeOnEscape: true }]
]);
```

Options are accessible in the component via `this.$options`.

## Idle Queue Callback

Get notified when all `"idle"` priority components finish loading:

```typescript
const loader = new ComponentLoader(
  document.body,
  [IdleComponent1, IdleComponent2],
  () => {
    console.log("All idle components loaded!");
    // Hide loading spinner, track analytics, etc.
  }
);
```

## Methods

### `getRegistry()`

Returns the internal registry of all component entries.

```typescript
const registry = loader.getRegistry();
// Map<string, RegistryEntry>

registry.forEach((entry, id) => {
  console.log(id, entry.loaded, entry.instance);
});
```

### `getLoader(priority)`

Returns the loader function for a given priority.

```typescript
const highLoader = loader.getLoader("high");
const idleLoader = loader.getLoader("idle");
const inViewLoader = loader.getLoader("in-view");
```

### `subscribe(subscription, callback, context)`

Registers a pub/sub subscription. Used internally by components.

### `unsubscribe(subscription, callback?, context?)`

Removes a pub/sub subscription.

### `publish(subscription, originId, ...args)`

Publishes a message to subscribers.

## Registry Entry

Each registered component creates a registry entry:

```typescript
interface RegistryEntry {
  id: string;                    // Unique ID
  loaded: boolean | "pending";   // Load state
  element: HTMLElement;          // DOM element
  Component: ComponentConstructor; // Class reference
  options?: ComponentOptions;    // Registration options
  instance?: Component;          // Instantiated component
}
```

## Example: Full Setup

```typescript
import Component, { ComponentLoader } from "@elliottregan/component-loader";

// High priority - loads immediately
class Navigation extends Component {
  static selector = ".nav";
  static loaderPriority = "high";
}

// Idle priority - loads during browser idle time
class Analytics extends Component {
  static selector = "[data-analytics]";
  static loaderPriority = "idle";
}

// In-view priority - loads when scrolled into view
class VideoPlayer extends Component {
  static selector = ".video-player";
  static loaderPriority = "in-view";
}

// Initialize with options and callback
const loader = new ComponentLoader(
  document.getElementById("app"),
  [
    Navigation,
    Analytics,
    [VideoPlayer, { autoplay: false }]
  ],
  () => console.log("Idle components ready")
);
```
