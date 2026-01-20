# Component Base Class

The `Component` class is the base class that all user components extend. It provides lifecycle management, DOM binding, and inter-component communication.

## Basic Usage

```typescript
import Component from "@elliottregan/component-loader";

class MyButton extends Component {
  static selector = ".my-button";
  static loaderPriority = "high";

  constructor(element, options, loaderInstance) {
    super(element, options, loaderInstance);
    this.$container.addEventListener("click", () => this.handleClick());
  }

  handleClick() {
    console.log("Button clicked!", this.$id);
  }
}
```

## Static Properties

### `selector` (required)

CSS selector used to find DOM elements for this component.

```typescript
static selector = ".my-component";
static selector = "[data-component='slider']";
```

### `loaderPriority`

Controls when the component initializes. Default: `"idle"`.

| Value | Behavior |
|-------|----------|
| `"high"` | Initialize immediately |
| `"idle"` | Initialize during browser idle time |
| `"in-view"` | Initialize when element enters viewport |

```typescript
static loaderPriority = "high";
```

### `loaderPriorityDelay`

Reserved for future use. Default: `0`.

## Instance Properties

### `$id`

Unique identifier for this component instance. Auto-generated.

```typescript
console.log(this.$id); // "$id_1"
```

### `$container`

The DOM element this component is bound to.

```typescript
this.$container.classList.add("active");
```

### `$options`

Options passed during registration.

```typescript
console.log(this.$options.color); // "red"
```

## Instance Methods

### `$setOptions(options, defaults?)`

Merges options with defaults into `$options`.

```typescript
this.$setOptions(options, { color: "blue", size: "medium" });
```

### `$debug(...args)`

Logs debug info prefixed with the component's `$id`.

```typescript
this.$debug("initialized", this.$options);
// Console: "$id_1" "initialized" { color: "red" }
```

### `$publish(subscription, ...args)`

Publishes a message to other components. See [Pub/Sub](./pubsub.md).

```typescript
this.$publish("cart:updated", { itemCount: 5 });
```

### `$subscribe(subscription, callback)`

Subscribes to messages from other components.

```typescript
this.$subscribe("cart:updated", (data) => {
  this.updateBadge(data.itemCount);
});
```

### `$unsubscribe(subscription, callback)`

Removes a subscription.

```typescript
this.$unsubscribe("cart:updated", this.handleCartUpdate);
```
