/**
 * DOM mocks for browser API testing in Bun
 */

export interface MockElement {
  tagName: string;
  component?: unknown;
  querySelectorAll: (selector: string) => MockElement[];
  querySelector: (selector: string) => MockElement | null;
  children?: MockElement[];
  _selector?: string;
}

export interface MockIntersectionObserverEntry {
  target: MockElement;
  intersectionRatio: number;
  isIntersecting: boolean;
}

type IntersectionCallback = (entries: MockIntersectionObserverEntry[]) => void;

export class MockIntersectionObserver {
  private callback: IntersectionCallback;
  private elements: Set<MockElement> = new Set();
  static instances: MockIntersectionObserver[] = [];

  constructor(callback: IntersectionCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: MockElement): void {
    this.elements.add(element);
  }

  unobserve(element: MockElement): void {
    this.elements.delete(element);
  }

  disconnect(): void {
    this.elements.clear();
  }

  // Test helper: trigger intersection
  triggerIntersection(element: MockElement, isIntersecting = true, ratio = 1): void {
    this.callback([
      {
        target: element,
        intersectionRatio: ratio,
        isIntersecting,
      },
    ]);
  }

  static reset(): void {
    MockIntersectionObserver.instances = [];
  }
}

export class MockDocumentFragment {
  querySelector(selector: string): MockElement | null {
    // Validate selector syntax by checking for common invalid patterns
    // This mimics browser behavior of throwing on invalid selectors
    if (selector.includes('..') || selector.match(/^[.#]\s*$/) || selector === '') {
      throw new DOMException('Invalid selector');
    }
    return null;
  }
}

export function createMockElement(
  tagName = 'DIV',
  children: MockElement[] = [],
  selector?: string
): MockElement {
  const element: MockElement = {
    tagName,
    children,
    _selector: selector,
    querySelectorAll(sel: string): MockElement[] {
      // Return children that match the selector (simplified matching)
      return children.filter((child) => child._selector === sel);
    },
    querySelector(sel: string): MockElement | null {
      return children.find((child) => child._selector === sel) || null;
    },
  };
  return element;
}

/**
 * Helper to cast MockElement to HTMLElement for testing
 */
export function asHTMLElement(el: MockElement): HTMLElement {
  return el as unknown as HTMLElement;
}

export function createMockDocument(): {
  createDocumentFragment: () => MockDocumentFragment;
} {
  return {
    createDocumentFragment: () => new MockDocumentFragment(),
  };
}

export function createMockWindow(): {
  IntersectionObserver: typeof MockIntersectionObserver;
  requestIdleCallback: (cb: () => void, options?: { timeout?: number }) => number;
  requestAnimationFrame: (cb: () => void) => number;
} {
  let idleCallbackId = 0;
  let rafId = 0;

  return {
    IntersectionObserver: MockIntersectionObserver,
    requestIdleCallback: (cb: () => void) => {
      // Execute callback synchronously for testing
      setTimeout(cb, 0);
      return ++idleCallbackId;
    },
    requestAnimationFrame: (cb: () => void) => {
      setTimeout(cb, 0);
      return ++rafId;
    },
  };
}

export function setupGlobalMocks(): void {
  const mockWindow = createMockWindow();
  const mockDocument = createMockDocument();

  // @ts-expect-error - Mocking global
  globalThis.window = mockWindow;
  // @ts-expect-error - Mocking global
  globalThis.document = mockDocument;
  // @ts-expect-error - Mocking global
  globalThis.IntersectionObserver = MockIntersectionObserver;
  // @ts-expect-error - Mocking global
  globalThis.requestIdleCallback = mockWindow.requestIdleCallback;
  // @ts-expect-error - Mocking global
  globalThis.requestAnimationFrame = mockWindow.requestAnimationFrame;
}

export function resetMocks(): void {
  MockIntersectionObserver.reset();
}
