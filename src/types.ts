/**
 * Shared type definitions for the component-loader library
 */

import type Component from './index';
import type ComponentLoader from './loader';

/** Loading priority for components */
export type LoaderPriority = 'high' | 'idle' | 'in-view';

/** Constructor type for Component subclasses */
export interface ComponentConstructor {
  new (element: HTMLElement, options: ComponentOptions, loaderInstance: ComponentLoader): Component;
  selector: string;
  loaderPriority: LoaderPriority;
  loaderPriorityDelay: number;
}

/** Options passed to a component */
export type ComponentOptions = Record<string, unknown>;

/** Registry entry for a component */
export interface RegistryEntry {
  id: string;
  loaded: boolean | 'pending';
  element: HTMLElement;
  Component: ComponentConstructor;
  options?: ComponentOptions;
  instance?: Component;
  loaderInstance?: ComponentLoader;
}

/** Subscriber context with component ID */
export interface SubscriberContext {
  $id: string;
}

/** Subscription entry */
export interface Subscription {
  context: SubscriberContext;
  callback: (...args: unknown[]) => void;
}

/** Callback type for pub/sub */
export type SubscriptionCallback = (...args: unknown[]) => void;

/** Component tuple with options for registration */
export type ComponentWithOptions = [ComponentConstructor, ComponentOptions];

/** Component registration input (class or tuple with options) */
export type ComponentInput = ComponentConstructor | ComponentWithOptions;

/** Idle queue done callback */
export type IdleQueueDoneCallback = () => void;

/** Loader function type */
export type LoaderFunction = (entry: RegistryEntry, queue?: RegistryEntry[]) => void;

/** Options for run-in-view */
export interface RunInViewOptions {
  threshold?: number[];
  percent?: number;
  count?: number;
}
