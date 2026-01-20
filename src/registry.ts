import type ComponentLoader from "./loader";
import type { ComponentConstructor, ComponentOptions, RegistryEntry } from "./types";
import { id } from "./util";

/**
 * Binds a component to the DOM
 */
export function bindComponent(
  entry: RegistryEntry,
  loaderInstance: ComponentLoader,
): RegistryEntry {
  const instance = new entry.Component(entry.element, entry.options ?? {}, loaderInstance);
  (entry.element as HTMLElement & { component: unknown }).component = instance;
  return Object.assign(entry, {
    instance,
    loaderInstance,
    loaded: true as const,
  });
}

/**
 * Create a registry entry for a component
 */
export function createRegistryEntry(
  element: HTMLElement,
  Component: ComponentConstructor,
  options?: ComponentOptions,
): RegistryEntry {
  return {
    id: id(),
    loaded: false,
    element,
    Component,
    options,
  };
}
