import { isValidSelector } from './util';
import runInView from './run-in-view';
import { bindComponent, createRegistryEntry } from './registry';
import type {
  ComponentConstructor,
  ComponentInput,
  ComponentOptions,
  ComponentWithOptions,
  IdleQueueDoneCallback,
  LoaderPriority,
  RegistryEntry,
  Subscription,
  SubscriptionCallback,
  SubscriberContext,
} from './types';

type LoaderFunction = (entry: RegistryEntry, queue?: RegistryEntry[]) => RegistryEntry | void;

export default class ComponentLoader {
  #idleQueue: RegistryEntry[] = [];
  #subscriptions: Record<string, Subscription[]> = {};
  #idleQueueDoneCallback: IdleQueueDoneCallback;
  #container: HTMLElement;
  #registry = new Map<string, RegistryEntry>();

  #loaders: Record<LoaderPriority, LoaderFunction> = {
    high: (entry) => bindComponent(entry, this),
    idle: (entry, queue) => {
      queue?.push(entry);
    },
    'in-view': (entry) => {
      runInView(entry.element, () => bindComponent(entry, this));
    },
  };

  constructor(
    container: HTMLElement,
    components: ComponentInput[],
    idleQueueDoneCallback: IdleQueueDoneCallback = () => {}
  ) {
    this.#container = container;
    this.#idleQueueDoneCallback = idleQueueDoneCallback;

    components.forEach((comp) => {
      if (Array.isArray(comp)) {
        this._registerComponent(comp[0], comp[1]);
      } else {
        this._registerComponent(comp);
      }
    });
    this._loadAll();
    this._runIdleQueue();
  }

  /**
   * Binds a component to the DOM, and registers the instance
   */
  private _registerComponent(
    Component: ComponentConstructor,
    options?: ComponentOptions
  ): void {
    if (!isValidComponent(Component)) return;
    this.#container
      .querySelectorAll(Component.selector)
      .forEach((element) =>
        this._addToRegistry(element as HTMLElement, Component, options)
      );
  }

  private _addToRegistry(
    element: HTMLElement,
    Component: ComponentConstructor,
    options?: ComponentOptions
  ): void {
    const entry = createRegistryEntry(element, Component, options);
    this.#registry.set(entry.id, entry);
  }

  loadComponent(entry: RegistryEntry): void {
    if (!entry) return;
    const load = this.getLoader(entry.Component.loaderPriority);
    if (entry.Component.loaderPriority === 'idle') {
      load(entry, this.#idleQueue);
      entry.loaded = 'pending';
    } else {
      load(entry);
      // Note: bindComponent sets loaded=true and instance on entry
    }
  }

  private _loadAll(): void {
    [...this.#registry.values()].forEach((entry) => this.loadComponent(entry));
  }

  private _addToQueue(...args: unknown[]): void {
    this.#idleQueue.push({ args } as unknown as RegistryEntry);
  }

  private _runIdleQueue(): void {
    this.#idleQueue.forEach((entry, i) => {
      if (!window.requestIdleCallback) {
        window.requestAnimationFrame(() => {
          bindComponent(entry, this);
          if (i === this.#idleQueue.length - 1) {
            this.#idleQueueDoneCallback();
          }
        });
      } else {
        window.requestIdleCallback(
          () => {
            bindComponent(entry, this);
            if (i === this.#idleQueue.length - 1) {
              this.#idleQueueDoneCallback();
            }
          },
          { timeout: 4000 }
        );
      }
    });
  }

  private _getComponentsBySelector(selector: string): RegistryEntry | undefined {
    return this.#registry.get(selector);
  }

  subscribe(
    subscription: string,
    callback: SubscriptionCallback,
    context: SubscriberContext
  ): void {
    if (!this.#subscriptions[subscription]) {
      this.#subscriptions[subscription] = [];
    }
    this.#subscriptions[subscription].push({ context, callback });
  }

  unsubscribe(
    subscription: string,
    callback?: SubscriptionCallback,
    context?: SubscriberContext
  ): boolean {
    if (!this.#subscriptions[subscription]) {
      console.warn(`The subscription '${subscription}' doesn't exist.`);
      return false;
    }

    // Remove matching subscriptions
    this.#subscriptions[subscription] = this.#subscriptions[subscription].filter(
      (sub) => {
        if (callback && context) {
          return sub.callback !== callback || sub.context !== context;
        }
        if (callback) {
          return sub.callback !== callback;
        }
        if (context) {
          return sub.context !== context;
        }
        return false; // Remove all if no filter specified
      }
    );

    return true;
  }

  publish(subscription: string, originId: string, ...args: unknown[]): boolean {
    if (!this.#subscriptions[subscription]) return false;
    this.#subscriptions[subscription].forEach((sub) => {
      // Don't pass the message to the origin component
      if (sub.context.$id === originId) return;
      sub.callback.apply(sub.context, args);
    });

    return true;
  }

  getRegistry(): Map<string, RegistryEntry> {
    return this.#registry;
  }

  getLoader(loader: LoaderPriority): LoaderFunction {
    return this.#loaders[loader];
  }
}

function isValidComponent(Component: ComponentConstructor): boolean {
  if (!isValidSelector(Component.selector)) {
    console.error(
      `ComponentLoader: The Component subclass, '${Component.name}', needs a valid 'selector' property.`,
      Component
    );
    return false;
  }
  return true;
}
