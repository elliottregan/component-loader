---
layout: home

hero:
  name: Component Loader
  text: Reduce page load bottlenecks
  tagline: A component loading system for initializing JavaScript components with configurable timing
  actions:
    - theme: brand
      text: Get Started
      link: /component
    - theme: alt
      text: View on GitHub
      link: https://github.com/elliottregan/component-loader

features:
  - title: Loading Priorities
    details: Control when components initialize with high, idle, or in-view priorities
  - title: Pub/Sub Communication
    details: Built-in publish/subscribe system for decoupled component communication
  - title: TypeScript Native
    details: Full TypeScript support with complete type definitions
  - title: Zero Dependencies
    details: Lightweight with no runtime dependencies
---

## Installation

```bash
npm install @elliottregan/component-loader
```

## Quick Start

```typescript
import Component, { ComponentLoader } from "@elliottregan/component-loader";

class MyButton extends Component {
  static selector = ".my-button";
  static loaderPriority = "high";

  constructor(element, options, loader) {
    super(element, options, loader);
    this.$container.addEventListener("click", () => {
      console.log("Clicked!", this.$id);
    });
  }
}

new ComponentLoader(document.body, [MyButton]);
```
