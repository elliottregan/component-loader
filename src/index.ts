import setIndex from "./indexService";
import ComponentLoader from "./loader";
import type { ComponentOptions, LoaderPriority, SubscriptionCallback } from "./types";

export default class Component {
  static loaderPriority: LoaderPriority = "idle";

  static loaderPriorityDelay = 0;

  static selector: string;

  #loaderInstance: ComponentLoader;

  $id: string;

  $container: HTMLElement;

  $options: ComponentOptions;

  constructor(
    element: HTMLElement,
    options: ComponentOptions = {},
    loaderInstance: ComponentLoader,
  ) {
    this.$id = `$id_${setIndex()}`;
    this.$container = element;
    this.$options = { ...options };
    this.#loaderInstance = loaderInstance;
  }

  $setOptions(options: ComponentOptions, DEFAULTS: ComponentOptions = {}): void {
    Object.assign(this.$options, DEFAULTS, options);
  }

  $debug(...args: unknown[]): void {
    console.debug(this.$id, ...args);
  }

  $publish(subscription: string, ...args: unknown[]): void {
    this.#loaderInstance.publish(subscription, this.$id, ...args);
  }

  $subscribe(subscription: string, callback: SubscriptionCallback): void {
    this.#loaderInstance.subscribe(subscription, callback, this);
  }

  $unsubscribe(subscription: string, callback: SubscriptionCallback): void {
    this.#loaderInstance.unsubscribe(subscription, callback, this);
  }
}

export { ComponentLoader };
export type {
  ComponentConstructor,
  ComponentInput,
  ComponentOptions,
  ComponentWithOptions,
  IdleQueueDoneCallback,
  LoaderPriority,
  RegistryEntry,
  RunInViewOptions,
  SubscriberContext,
  Subscription,
  SubscriptionCallback,
} from "./types";
