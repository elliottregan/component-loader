import type { RegistryEntry } from './types';

/**
 * Processes a queue of registry entries during browser idle time.
 * Falls back to requestAnimationFrame when requestIdleCallback is unavailable.
 */
export default function runIdleQueue(
  entries: RegistryEntry[],
  bindFn: (entry: RegistryEntry) => void,
  doneFn: () => void
): void {
  const lastIndex = entries.length - 1;

  entries.forEach((entry, i) => {
    const callback = () => {
      bindFn(entry);
      if (i === lastIndex) {
        doneFn();
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(callback, { timeout: 4000 });
    } else {
      window.requestAnimationFrame(callback);
    }
  });
}
