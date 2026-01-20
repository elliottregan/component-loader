import type { Subscription, SubscriptionCallback, SubscriberContext } from './types';

/**
 * Simple pub/sub system for inter-component communication.
 */
export default class PubSub {
  #subscriptions: Record<string, Subscription[]> = {};

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
}
