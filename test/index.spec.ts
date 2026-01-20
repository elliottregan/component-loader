import { describe, it, expect, mock } from 'bun:test';
import Component from '../src/index';
import { createMockElement, asHTMLElement } from './mocks/dom';
import type ComponentLoader from '../src/loader';

describe('Component', () => {
  // Create a mock loader instance for testing
  function createMockLoaderInstance() {
    return {
      publish: mock(() => {}),
      subscribe: mock(() => {}),
      unsubscribe: mock(() => {}),
    } as unknown as ComponentLoader;
  }

  describe('static properties', () => {
    it('should have default loaderPriority of "idle"', () => {
      expect(Component.loaderPriority).toBe('idle');
    });

    it('should have default loaderPriorityDelay of 0', () => {
      expect(Component.loaderPriorityDelay).toBe(0);
    });
  });

  describe('constructor', () => {
    it('should set $id with unique identifier', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();

      const component = new Component(element, {}, loaderInstance);

      expect(component.$id).toMatch(/^\$id_\d+$/);
    });

    it('should set $container to the element', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();

      const component = new Component(element, {}, loaderInstance);

      expect(component.$container).toBe(element);
    });

    it('should set $options from passed options', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();
      const options = { foo: 'bar', baz: 123 };

      const component = new Component(element, options, loaderInstance);

      expect(component.$options).toEqual(options);
    });

    it('should use empty object for default options', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();

      const component = new Component(element, undefined, loaderInstance);

      expect(component.$options).toEqual({});
    });
  });

  describe('$setOptions()', () => {
    it('should merge options with defaults', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();
      const component = new Component(element, { existing: 'value' }, loaderInstance);

      component.$setOptions({ newOption: 'new' }, { defaultOption: 'default' });

      expect(component.$options).toEqual({
        existing: 'value',
        defaultOption: 'default',
        newOption: 'new',
      });
    });

    it('should override defaults with provided options', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();
      const component = new Component(element, {}, loaderInstance);

      component.$setOptions({ color: 'blue' }, { color: 'red' });

      expect(component.$options.color).toBe('blue');
    });
  });

  describe('pub/sub methods', () => {
    it('$publish() should call loader publish with correct args', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();
      const component = new Component(element, {}, loaderInstance);

      component.$publish('myEvent', 'arg1', 'arg2');

      expect(loaderInstance.publish).toHaveBeenCalledWith(
        'myEvent',
        component.$id,
        'arg1',
        'arg2'
      );
    });

    it('$subscribe() should call loader subscribe with correct args', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();
      const component = new Component(element, {}, loaderInstance);
      const callback = () => {};

      component.$subscribe('myEvent', callback);

      expect(loaderInstance.subscribe).toHaveBeenCalledWith('myEvent', callback, component);
    });

    it('$unsubscribe() should call loader unsubscribe with correct args', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();
      const component = new Component(element, {}, loaderInstance);
      const callback = () => {};

      component.$unsubscribe('myEvent', callback);

      expect(loaderInstance.unsubscribe).toHaveBeenCalledWith('myEvent', callback, component);
    });
  });

  describe('$debug()', () => {
    it('should call console.debug with $id and args', () => {
      const element = asHTMLElement(createMockElement('DIV'));
      const loaderInstance = createMockLoaderInstance();
      const component = new Component(element, {}, loaderInstance);
      const originalDebug = console.debug;
      const mockDebug = mock(() => {});
      console.debug = mockDebug;

      component.$debug('test message', { data: 'value' });

      expect(mockDebug).toHaveBeenCalledWith(component.$id, 'test message', { data: 'value' });
      console.debug = originalDebug;
    });
  });

  describe('subclassing', () => {
    it('should allow extending Component with custom selector', () => {
      class MyComponent extends Component {
        static selector = '.my-component';
        static loaderPriority = 'high' as const;
      }

      expect(MyComponent.selector).toBe('.my-component');
      expect(MyComponent.loaderPriority).toBe('high');
    });
  });
});
