# Pub/Sub System

The pub/sub (publish/subscribe) system enables communication between components without tight coupling. Components can broadcast messages and subscribe to messages from other components.

## Basic Usage

### Publishing Messages

Use `$publish` to broadcast a message to all subscribers:

```typescript
class CartButton extends Component {
  static selector = ".add-to-cart";
  static loaderPriority = "high";

  constructor(element, options, loader) {
    super(element, options, loader);
    this.$container.addEventListener("click", () => this.addToCart());
  }

  addToCart() {
    const item = { id: 123, name: "Widget", price: 29.99 };
    this.$publish("cart:item-added", item);
  }
}
```

### Subscribing to Messages

Use `$subscribe` to listen for messages:

```typescript
class CartBadge extends Component {
  static selector = ".cart-badge";
  static loaderPriority = "high";

  itemCount = 0;

  constructor(element, options, loader) {
    super(element, options, loader);
    this.$subscribe("cart:item-added", this.onItemAdded.bind(this));
  }

  onItemAdded(item) {
    this.itemCount++;
    this.$container.textContent = this.itemCount;
    this.$debug("Item added:", item.name);
  }
}
```

## API Reference

### `$publish(subscription, ...args)`

Broadcasts a message to all subscribers except the sender.

```typescript
// Simple event
this.$publish("modal:open");

// With single argument
this.$publish("user:logged-in", { id: 1, name: "John" });

// With multiple arguments
this.$publish("form:submitted", formData, timestamp, source);
```

**Note:** The publishing component does not receive its own message.

### `$subscribe(subscription, callback)`

Registers a callback for a subscription.

```typescript
this.$subscribe("cart:updated", (cart) => {
  this.render(cart);
});

// Or with bound method
this.$subscribe("cart:updated", this.handleCartUpdate.bind(this));
```

### `$unsubscribe(subscription, callback)`

Removes a specific subscription.

```typescript
// Store reference to remove later
this.handleUpdate = this.handleUpdate.bind(this);
this.$subscribe("data:updated", this.handleUpdate);

// Later, unsubscribe
this.$unsubscribe("data:updated", this.handleUpdate);
```

## Naming Conventions

Use namespaced event names for clarity:

```typescript
// Good - namespaced and descriptive
"cart:item-added"
"cart:item-removed"
"cart:cleared"
"user:logged-in"
"user:logged-out"
"modal:open"
"modal:close"

// Avoid - too generic
"update"
"click"
"change"
```

## Common Patterns

### Cross-Component State Sync

```typescript
// Dropdown component
class Dropdown extends Component {
  static selector = ".dropdown";

  select(value) {
    this.$publish("dropdown:selected", {
      id: this.$container.id,
      value
    });
  }
}

// Form component listening to dropdowns
class Form extends Component {
  static selector = ".form";

  constructor(element, options, loader) {
    super(element, options, loader);
    this.$subscribe("dropdown:selected", this.onDropdownChange.bind(this));
  }

  onDropdownChange({ id, value }) {
    this.formData[id] = value;
  }
}
```

### Modal Communication

```typescript
// Trigger component
class ModalTrigger extends Component {
  static selector = "[data-modal-trigger]";

  constructor(element, options, loader) {
    super(element, options, loader);
    this.$container.addEventListener("click", () => {
      const modalId = this.$container.dataset.modalTrigger;
      this.$publish("modal:open", { id: modalId });
    });
  }
}

// Modal component
class Modal extends Component {
  static selector = ".modal";

  constructor(element, options, loader) {
    super(element, options, loader);
    this.$subscribe("modal:open", this.onOpenRequest.bind(this));
    this.$subscribe("modal:close", this.close.bind(this));
  }

  onOpenRequest({ id }) {
    if (this.$container.id === id) {
      this.open();
    }
  }

  open() {
    this.$container.classList.add("is-open");
    this.$publish("modal:opened", { id: this.$container.id });
  }

  close() {
    this.$container.classList.remove("is-open");
    this.$publish("modal:closed", { id: this.$container.id });
  }
}
```

### Global Notifications

```typescript
// Any component can publish
this.$publish("notification:show", {
  type: "success",
  message: "Item saved!"
});

// Toast/notification component subscribes
class Toast extends Component {
  static selector = ".toast-container";

  constructor(element, options, loader) {
    super(element, options, loader);
    this.$subscribe("notification:show", this.show.bind(this));
  }

  show({ type, message }) {
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    this.$container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}
```

## Best Practices

1. **Namespace events** - Use `domain:action` format
2. **Pass data objects** - Easier to extend than positional arguments
3. **Bind callbacks** - Use `.bind(this)` or arrow functions
4. **Unsubscribe when needed** - Prevent memory leaks in dynamic UIs
5. **Keep payloads serializable** - Avoid passing DOM elements or complex objects
