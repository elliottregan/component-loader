import runIdleQueue from "./idle-queue";
import PubSub from "./pubsub";
import { bindComponent, createRegistryEntry } from "./registry";
import runInView from "./run-in-view";
import type {
  ComponentConstructor,
  ComponentInput,
  ComponentOptions,
  IdleQueueDoneCallback,
  LoaderPriority,
  RegistryEntry,
  SubscriberContext,
  SubscriptionCallback,
} from "./types";
import { isValidSelector } from "./util";

type LoaderFunction = (entry: RegistryEntry, queue?: RegistryEntry[]) => void;

export default class ComponentLoader {
  #idleQueue: RegistryEntry[] = [];

  #pubsub = new PubSub();

  #idleQueueDoneCallback: IdleQueueDoneCallback;

  #container: HTMLElement;

  #registry = new Map<string, RegistryEntry>();

  #loaders: Record<LoaderPriority, LoaderFunction> = {
    high: (entry) => bindComponent(entry, this),
    idle: (entry, queue) => {
      queue?.push(entry);
    },
    "in-view": (entry) => {
      runInView(entry.element, () => bindComponent(entry, this));
    },
  };

  constructor(
    container: HTMLElement,
    components: ComponentInput[],
    idleQueueDoneCallback: IdleQueueDoneCallback = () => {},
  ) {
    this.#container = container;
    this.#idleQueueDoneCallback = idleQueueDoneCallback;

    components.forEach((comp) => {
      if (Array.isArray(comp)) {
        this.registerComponent(comp[0], comp[1]);
      } else {
        this.registerComponent(comp);
      }
    });
    this.loadAll();
    this.runIdleQueue();
  }

  private registerComponent(Component: ComponentConstructor, options?: ComponentOptions): void {
    if (!isValidComponent(Component)) return;
    this.#container
      .querySelectorAll(Component.selector)
      .forEach((element) => {
        this.addToRegistry(element as HTMLElement, Component, options);
      });
  }

  private addToRegistry(
    element: HTMLElement,
    Component: ComponentConstructor,
    options?: ComponentOptions,
  ): void {
    const entry = createRegistryEntry(element, Component, options);
    this.#registry.set(entry.id, entry);
  }

  loadComponent(entry: RegistryEntry): void {
    if (!entry) return;
    const load = this.getLoader(entry.Component.loaderPriority);
    if (entry.Component.loaderPriority === "idle") {
      load(entry, this.#idleQueue);
      entry.loaded = "pending";
    } else {
      load(entry);
    }
  }

  private loadAll(): void {
    [...this.#registry.values()].forEach((entry) => {
      this.loadComponent(entry);
    });
  }

  private runIdleQueue(): void {
    runIdleQueue(
      this.#idleQueue,
      (entry) => bindComponent(entry, this),
      this.#idleQueueDoneCallback,
    );
  }

  subscribe(
    subscription: string,
    callback: SubscriptionCallback,
    context: SubscriberContext,
  ): void {
    this.#pubsub.subscribe(subscription, callback, context);
  }

  unsubscribe(
    subscription: string,
    callback?: SubscriptionCallback,
    context?: SubscriberContext,
  ): boolean {
    return this.#pubsub.unsubscribe(subscription, callback, context);
  }

  publish(subscription: string, originId: string, ...args: unknown[]): boolean {
    return this.#pubsub.publish(subscription, originId, ...args);
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
      Component,
    );
    return false;
  }
  return true;
}
