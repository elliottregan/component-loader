import { describe, it, expect } from 'bun:test';
import { createRegistryEntry, bindComponent } from '../src/registry';
import { createMockElement, asHTMLElement } from './mocks/dom';
import type ComponentLoader from '../src/loader';
import type { ComponentConstructor } from '../src/types';

// Mock Component class for testing
class MockComponent {
  static selector = '.mock-component';
  static loaderPriority = 'high' as const;
  static loaderPriorityDelay = 0;

  $id: string;
  $container: HTMLElement;
  $options: Record<string, unknown>;

  constructor(
    element: HTMLElement,
    options: Record<string, unknown> = {},
    _loaderInstance?: unknown
  ) {
    this.$id = 'mock-id';
    this.$container = element;
    this.$options = options;
  }
}

// Cast to ComponentConstructor for testing
const MockComponentClass = MockComponent as unknown as ComponentConstructor;

describe('registry', () => {
  describe('createRegistryEntry()', () => {
    it('should create a registry entry with correct properties', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const options = { foo: 'bar' };

      const entry = createRegistryEntry(element, MockComponentClass, options);

      expect(entry).toHaveProperty('id');
      expect(entry.id).toMatch(/^[0-9a-f]{8}$/);
      expect(entry.loaded).toBe(false);
      expect(entry.element).toBe(element);
      expect(entry.Component).toBe(MockComponentClass);
      expect(entry.options).toBe(options);
    });

    it('should generate unique IDs for each entry', () => {
      const element1 = asHTMLElement(createMockElement('DIV'));
      const element2 = asHTMLElement(createMockElement('DIV'));

      const entry1 = createRegistryEntry(element1, MockComponentClass, {});
      const entry2 = createRegistryEntry(element2, MockComponentClass, {});

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should work without options', () => {
      const element = asHTMLElement(createMockElement('DIV'));

      const entry = createRegistryEntry(element, MockComponentClass, undefined);

      expect(entry.options).toBeUndefined();
    });
  });

  describe('bindComponent()', () => {
    it('should instantiate the component and bind it to the element', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const entry = createRegistryEntry(element, MockComponentClass, { test: true });
      const mockLoaderInstance = { publish: () => {}, subscribe: () => {}, unsubscribe: () => {} } as unknown as ComponentLoader;

      const result = bindComponent(entry, mockLoaderInstance);

      expect(result.loaded).toBe(true);
      expect(result.instance).toBeInstanceOf(MockComponent);
      expect(result.loaderInstance).toBe(mockLoaderInstance);
      expect((element as HTMLElement & { component: unknown }).component).toBe(result.instance);
    });

    it('should pass options to the component constructor', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const options = { customOption: 'value' };
      const entry = createRegistryEntry(element, MockComponentClass, options);
      const mockLoaderInstance = { publish: () => {}, subscribe: () => {}, unsubscribe: () => {} } as unknown as ComponentLoader;

      const result = bindComponent(entry, mockLoaderInstance);

      expect((result.instance as MockComponent).$options).toEqual(options);
    });
  });
});
