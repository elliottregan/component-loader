import type { RunInViewOptions } from './types';

const DEFAULTS: Required<RunInViewOptions> = {
  threshold: [0, 1],
  percent: 0,
  count: 1,
};

/**
 * Calls a function once when an element first enters the viewport.
 */
export default function runInView(
  element: HTMLElement,
  fn: (entry: IntersectionObserverEntry | { target: HTMLElement }) => void = () => {},
  options?: RunInViewOptions
): IntersectionObserver | number {
  if (!window.IntersectionObserver) {
    return requestAnimationFrame(() => fn({ target: element }));
  }

  const thisOptions = { ...DEFAULTS, ...options };
  let i = 0;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (meetsThreshold(entry, thisOptions)) {
        fn(entry);
        i += 1;
        if (i <= thisOptions.count) {
          observer.unobserve(entry.target);
        }
      }
    },
    {
      threshold: thisOptions.threshold,
    }
  );

  observer.observe(element);
  return observer;
}

function meetsThreshold(
  { intersectionRatio, isIntersecting }: IntersectionObserverEntry,
  options: Required<RunInViewOptions>
): boolean {
  // Under rare conditions,
  // `intersectionRatio === 0` while `isIntersecting === true`.
  // The following conditional allows `fn` to execute in that scenario.
  if (options.percent === 0) {
    return isIntersecting;
  }
  return intersectionRatio > options.percent;
}
