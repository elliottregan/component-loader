import { describe, it, expect, mock, beforeEach } from 'bun:test';
import ComponentLoader from '../src/loader';
import Component from '../src/index';
import { createMockElement, MockIntersectionObserver, asHTMLElement, type MockElement } from './mocks/dom';

describe('ComponentLoader', () => {
  // Helper to create a container with child elements
  function createContainerWithChildren(
    childConfigs: Array<{ selector: string; count: number }>
  ): HTMLElement {
    const children: MockElement[] = [];
    childConfigs.forEach(({ selector, count }) => {
      for (let i = 0; i < count; i++) {
        children.push(createMockElement('DIV', [], selector));
      }
    });

    return asHTMLElement(createMockElement('DIV', children));
  }

  // Test component classes
  class HighPriorityComponent extends Component {
    static selector = '.high-priority';
    static loaderPriority = 'high' as const;
  }

  class IdlePriorityComponent extends Component {
    static selector = '.idle-priority';
    static loaderPriority = 'idle' as const;
  }

  class InViewComponent extends Component {
    static selector = '.in-view';
    static loaderPriority = 'in-view' as const;
  }

  beforeEach(() => {
    MockIntersectionObserver.reset();
  });

  describe('constructor', () => {
    it('should accept a container and array of components', () => {
      const container = createContainerWithChildren([
        { selector: '.high-priority', count: 1 },
      ]);

      const loader = new ComponentLoader(container, [HighPriorityComponent]);

      expect(loader.getRegistry()).toBeInstanceOf(Map);
    });

    it('should accept components with options tuple syntax', () => {
      const container = createContainerWithChildren([
        { selector: '.high-priority', count: 1 },
      ]);

      const loader = new ComponentLoader(container, [
        [HighPriorityComponent, { customOption: 'value' }],
      ]);

      const registry = loader.getRegistry();
      expect(registry.size).toBe(1);
    });

    it('should call idleQueueDoneCallback when idle queue completes', async () => {
      const container = createContainerWithChildren([
        { selector: '.idle-priority', count: 1 },
      ]);
      const callback = mock(() => {});

      new ComponentLoader(container, [IdlePriorityComponent], callback);

      // Wait for requestIdleCallback/requestAnimationFrame to fire
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('component registration', () => {
    it('should find and register elements matching component selectors', () => {
      const container = createContainerWithChildren([
        { selector: '.high-priority', count: 3 },
      ]);

      const loader = new ComponentLoader(container, [HighPriorityComponent]);

      expect(loader.getRegistry().size).toBe(3);
    });

    it('should skip components without valid selectors', () => {
      class InvalidComponent extends Component {
        // Missing selector
      }
      const container = createContainerWithChildren([]);
      const originalError = console.error;
      console.error = mock(() => {});

      const loader = new ComponentLoader(container, [InvalidComponent]);

      expect(loader.getRegistry().size).toBe(0);
      console.error = originalError;
    });

    it('should register multiple component types', () => {
      const container = createContainerWithChildren([
        { selector: '.high-priority', count: 2 },
        { selector: '.idle-priority', count: 3 },
      ]);

      const loader = new ComponentLoader(container, [
        HighPriorityComponent,
        IdlePriorityComponent,
      ]);

      expect(loader.getRegistry().size).toBe(5);
    });
  });

  describe('loading strategies', () => {
    it('should immediately load high priority components', () => {
      const container = createContainerWithChildren([
        { selector: '.high-priority', count: 1 },
      ]);

      const loader = new ComponentLoader(container, [HighPriorityComponent]);

      const entries = [...loader.getRegistry().values()];
      expect(entries[0].loaded).toBe(true);
      expect(entries[0].instance).toBeInstanceOf(HighPriorityComponent);
    });

    it('should defer idle priority components', async () => {
      const container = createContainerWithChildren([
        { selector: '.idle-priority', count: 1 },
      ]);

      const loader = new ComponentLoader(container, [IdlePriorityComponent]);
      const entries = [...loader.getRegistry().values()];

      // Initially marked as pending
      expect(entries[0].loaded).toBe('pending');

      // Wait for async loading
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(entries[0].loaded).toBe(true);
    });

    it('should use IntersectionObserver for in-view components', () => {
      const container = createContainerWithChildren([
        { selector: '.in-view', count: 1 },
      ]);

      new ComponentLoader(container, [InViewComponent]);

      // Should have created an IntersectionObserver
      expect(MockIntersectionObserver.instances.length).toBeGreaterThan(0);
    });
  });

  describe('pub/sub system', () => {
    it('subscribe() should register a callback for a subscription', () => {
      const container = createContainerWithChildren([]);
      const loader = new ComponentLoader(container, []);
      const callback = mock(() => {});

      loader.subscribe('testEvent', callback, { $id: 'test-1' });

      // Verify by publishing
      loader.publish('testEvent', 'other-id', 'data');
      expect(callback).toHaveBeenCalledWith('data');
    });

    it('publish() should call all subscribers except the origin', () => {
      const container = createContainerWithChildren([]);
      const loader = new ComponentLoader(container, []);
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});
      const context1 = { $id: 'comp-1' };
      const context2 = { $id: 'comp-2' };

      loader.subscribe('testEvent', callback1, context1);
      loader.subscribe('testEvent', callback2, context2);

      // Publish from comp-1
      loader.publish('testEvent', 'comp-1', 'arg1', 'arg2');

      // callback1 should NOT be called (origin)
      expect(callback1).not.toHaveBeenCalled();
      // callback2 should be called
      expect(callback2).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('publish() should return false for non-existent subscriptions', () => {
      const container = createContainerWithChildren([]);
      const loader = new ComponentLoader(container, []);

      const result = loader.publish('nonExistent', 'id', 'data');

      expect(result).toBe(false);
    });

    it('publish() should return true when successfully published', () => {
      const container = createContainerWithChildren([]);
      const loader = new ComponentLoader(container, []);
      loader.subscribe('testEvent', () => {}, { $id: 'test' });

      const result = loader.publish('testEvent', 'other-id', 'data');

      expect(result).toBe(true);
    });

    it('unsubscribe() should warn for non-existent subscriptions', () => {
      const container = createContainerWithChildren([]);
      const loader = new ComponentLoader(container, []);
      const originalWarn = console.warn;
      const mockWarn = mock(() => {});
      console.warn = mockWarn;

      const result = loader.unsubscribe('nonExistent');

      expect(result).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
      console.warn = originalWarn;
    });
  });

  describe('getLoader()', () => {
    it('should return the correct loader function for each priority', () => {
      const container = createContainerWithChildren([]);
      const loader = new ComponentLoader(container, []);

      expect(typeof loader.getLoader('high')).toBe('function');
      expect(typeof loader.getLoader('idle')).toBe('function');
      expect(typeof loader.getLoader('in-view')).toBe('function');
    });
  });

  describe('element binding', () => {
    it('should attach component instance to element.component', async () => {
      const container = createContainerWithChildren([
        { selector: '.high-priority', count: 1 },
      ]);

      new ComponentLoader(container, [HighPriorityComponent]);

      const element = (container as unknown as MockElement).children![0] as unknown as HTMLElement & { component: unknown };
      expect(element.component).toBeInstanceOf(HighPriorityComponent);
    });
  });
});
