# Loading Priorities

Component loading priorities control when components initialize, helping avoid page load bottlenecks and improve perceived performance.

## Priority Levels

### `"high"` - Immediate Loading

Components load synchronously during `ComponentLoader` initialization. Use for critical, above-the-fold UI.

```typescript
class Navigation extends Component {
  static selector = ".nav";
  static loaderPriority = "high";
}
```

**Best for:**
- Navigation menus
- Hero sections
- Critical interactive elements
- Components that must be ready before first paint

### `"idle"` - Deferred Loading (Default)

Components load during browser idle time using `requestIdleCallback` (falls back to `requestAnimationFrame`). Use for non-critical functionality.

```typescript
class Analytics extends Component {
  static selector = "[data-track]";
  static loaderPriority = "idle";
}
```

**Best for:**
- Analytics tracking
- Non-critical widgets
- Background functionality
- Components that don't need immediate interaction

**Browser Support:**
- Uses `requestIdleCallback` when available
- Falls back to `requestAnimationFrame` in Safari and older browsers

### `"in-view"` - Lazy Loading

Components load when their element enters the viewport using `IntersectionObserver`. Use for below-the-fold content.

```typescript
class VideoPlayer extends Component {
  static selector = ".video-player";
  static loaderPriority = "in-view";
}
```

**Best for:**
- Below-the-fold content
- Heavy components (video players, maps, charts)
- Image galleries
- Infinite scroll items

**Browser Support:**
- Uses `IntersectionObserver` when available
- Falls back to `requestAnimationFrame` in older browsers

## Choosing the Right Priority

```
Page Load Timeline
──────────────────────────────────────────────────────────>

[HIGH]     ████ Navigation, Header, Hero
                \_ Loads immediately

[IDLE]              ░░░░ Analytics, Tracking, Tooltips
                         \_ Loads when browser is idle

[IN-VIEW]                      ▓▓▓▓ Videos, Maps, Galleries
                                    \_ Loads when scrolled into view
```

## Performance Comparison

| Priority | Blocks Render | Uses Main Thread | Memory Impact |
|----------|--------------|------------------|---------------|
| `high` | Yes | Immediately | Immediate |
| `idle` | No | When idle | Deferred |
| `in-view` | No | On scroll | On demand |

## Idle Queue Callback

Monitor when all `idle` components finish loading:

```typescript
const loader = new ComponentLoader(
  document.body,
  components,
  () => {
    console.log("All idle components loaded");
    performance.mark("idle-components-ready");
  }
);
```

## Example: Optimized Page Setup

```typescript
import Component, { ComponentLoader } from "@elliottregan/component-loader";

// Critical - loads first
class Header extends Component {
  static selector = ".header";
  static loaderPriority = "high";
}

// Critical - loads first
class HeroSlider extends Component {
  static selector = ".hero";
  static loaderPriority = "high";
}

// Non-critical - loads when idle
class Newsletter extends Component {
  static selector = ".newsletter-form";
  static loaderPriority = "idle";
}

// Non-critical - loads when idle
class SocialShare extends Component {
  static selector = ".social-share";
  static loaderPriority = "idle";
}

// Heavy - loads on scroll
class VideoEmbed extends Component {
  static selector = ".video-embed";
  static loaderPriority = "in-view";
}

// Heavy - loads on scroll
class CommentSection extends Component {
  static selector = ".comments";
  static loaderPriority = "in-view";
}

new ComponentLoader(document.body, [
  Header,
  HeroSlider,
  Newsletter,
  SocialShare,
  VideoEmbed,
  CommentSection
]);
```

This setup ensures:
1. Header and hero are interactive immediately
2. Newsletter and social buttons load without blocking
3. Video and comments only load when user scrolls down
