# component-loader
*Goals:*
- provide a way to initialize multiple identical JS "components" on a page
- provide a "table of contents" for all the JS that runs on a page
- provide a standard way of initializing a growing list of JS without worrying about creating bottlenecks when the page loads.

## Installation

```bash
npm install @elliottregan/component-loader
```

## Usage

1. Create a component by extending the `Component` base class:

```js
import Component from '@elliottregan/component-loader';

class MyButton extends Component {
  static selector = '.my-button';
  static loaderPriority = 'high';

  constructor(element, options, loaderInstance) {
    super(element, options, loaderInstance);
    this.$container.addEventListener('click', () => this.handleClick());
  }

  handleClick() {
    this.$debug('Button clicked!');
  }
}

export default MyButton;
```

2. Initialize the `ComponentLoader` with your components:

```js
import { ComponentLoader } from '@elliottregan/component-loader';
import MyButton from './components/MyButton';
import MyCarousel from './components/MyCarousel';

const loader = new ComponentLoader(
  document.body,
  [
    MyButton,
    [MyCarousel, { autoplay: true }], // Pass options as second element
  ],
  () => console.log('Idle queue complete')
);
```

## Features

### Loader Priority

Control when components initialize by setting the static `loaderPriority` property:

| Priority | Behavior |
|----------|----------|
| `'high'` | Initialize immediately when ComponentLoader runs |
| `'idle'` | Defer initialization using `requestIdleCallback` (falls back to `requestAnimationFrame`) |
| `'in-view'` | Initialize only when the element enters the viewport |

```js
class CriticalComponent extends Component {
  static selector = '.critical';
  static loaderPriority = 'high'; // Load immediately
}

class BelowTheFold extends Component {
  static selector = '.below-fold';
  static loaderPriority = 'in-view'; // Load when scrolled into view
}

class NonEssential extends Component {
  static selector = '.non-essential';
  static loaderPriority = 'idle'; // Load during browser idle time (default)
}
```

### Event Bus

Components can communicate with each other using the built-in pub/sub system:

- `$publish(eventName, ...args)` - Broadcast an event to other components
- `$subscribe(eventName, callback)` - Listen for events from other components
- `$unsubscribe(eventName, callback)` - Stop listening for an event

Events are automatically scoped so a component won't receive its own published events.

## Examples

### Accessing components from the DOM

When a component is initialized, its instance is attached to the DOM element:

```js
const buttonElement = document.querySelector('.my-button');
const buttonInstance = buttonElement.component;

// Access component properties and methods
console.log(buttonInstance.$id);
console.log(buttonInstance.$options);
```

### Communication between Components

```js
// Counter.js
class Counter extends Component {
  static selector = '.counter';

  constructor(element, options, loaderInstance) {
    super(element, options, loaderInstance);
    this.count = 0;
    this.$container.addEventListener('click', () => {
      this.count++;
      this.$publish('counter:updated', this.count);
    });
  }
}

// Display.js
class Display extends Component {
  static selector = '.display';

  constructor(element, options, loaderInstance) {
    super(element, options, loaderInstance);
    this.$subscribe('counter:updated', this.onCounterUpdate);
  }

  onCounterUpdate(newCount) {
    // 'this' is automatically bound to the Display instance
    this.$container.textContent = `Count: ${newCount}`;
  }
}
```

## Component API

### Static Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selector` | `string` | (required) | CSS selector to find DOM elements |
| `loaderPriority` | `string` | `'idle'` | When to initialize: `'high'`, `'idle'`, or `'in-view'` |
| `loaderPriorityDelay` | `number` | `0` | Delay in milliseconds before initialization |

### Instance Properties

| Property | Description |
|----------|-------------|
| `$id` | Unique identifier for this component instance |
| `$container` | The DOM element this component is bound to |
| `$options` | Options object passed during registration |

### Instance Methods

| Method | Description |
|--------|-------------|
| `$setOptions(options, defaults)` | Merge options with defaults |
| `$debug(...args)` | Log debug messages prefixed with component ID |
| `$publish(event, ...args)` | Publish an event to other components |
| `$subscribe(event, callback)` | Subscribe to an event |
| `$unsubscribe(event, callback)` | Unsubscribe from an event |
