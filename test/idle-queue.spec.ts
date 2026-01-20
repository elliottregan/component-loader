import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import runIdleQueue from "../src/idle-queue";
import type { RegistryEntry } from "../src/types";

describe("runIdleQueue", () => {
  let originalRequestIdleCallback: typeof window.requestIdleCallback | undefined;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(() => {
    originalRequestIdleCallback = window.requestIdleCallback;
    originalRequestAnimationFrame = window.requestAnimationFrame;
  });

  afterEach(() => {
    // @ts-expect-error - restoring original
    window.requestIdleCallback = originalRequestIdleCallback;
    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  function createMockEntry(id: string): RegistryEntry {
    return {
      id,
      loaded: false,
      element: {} as HTMLElement,
      Component: {} as RegistryEntry["Component"],
    };
  }

  it("should call bindFn for each entry", async () => {
    const bindFn = mock(() => {});
    const doneFn = mock(() => {});
    const entries = [createMockEntry("1"), createMockEntry("2"), createMockEntry("3")];

    // @ts-expect-error - mocking
    window.requestIdleCallback = (cb: () => void) => {
      setTimeout(cb, 0);
      return 1;
    };

    runIdleQueue(entries, bindFn, doneFn);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(bindFn).toHaveBeenCalledTimes(3);
  });

  it("should call doneFn after the last entry is processed", async () => {
    const bindFn = mock(() => {});
    const doneFn = mock(() => {});
    const entries = [createMockEntry("1"), createMockEntry("2")];

    // @ts-expect-error - mocking
    window.requestIdleCallback = (cb: () => void) => {
      setTimeout(cb, 0);
      return 1;
    };

    runIdleQueue(entries, bindFn, doneFn);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(doneFn).toHaveBeenCalledTimes(1);
  });

  it("should use requestIdleCallback when available", async () => {
    const idleCallback = mock((cb: () => void) => {
      setTimeout(cb, 0);
      return 1;
    });
    // @ts-expect-error - mocking
    window.requestIdleCallback = idleCallback;

    const entries = [createMockEntry("1")];

    runIdleQueue(
      entries,
      () => {},
      () => {},
    );

    expect(idleCallback).toHaveBeenCalled();
  });

  it("should fall back to requestAnimationFrame when requestIdleCallback is unavailable", async () => {
    // @ts-expect-error - simulating browser without requestIdleCallback
    window.requestIdleCallback = undefined;

    const rafCallback = mock((cb: () => void) => {
      setTimeout(cb, 0);
      return 1;
    });
    // @ts-expect-error - mocking
    window.requestAnimationFrame = rafCallback;

    const entries = [createMockEntry("1")];

    runIdleQueue(
      entries,
      () => {},
      () => {},
    );

    expect(rafCallback).toHaveBeenCalled();
  });

  it("should pass correct entry to bindFn", async () => {
    const capturedEntries: RegistryEntry[] = [];
    const bindFn = (entry: RegistryEntry) => {
      capturedEntries.push(entry);
    };
    const entries = [createMockEntry("a"), createMockEntry("b")];

    // @ts-expect-error - mocking
    window.requestIdleCallback = (cb: () => void) => {
      setTimeout(cb, 0);
      return 1;
    };

    runIdleQueue(entries, bindFn, () => {});

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(capturedEntries).toEqual(entries);
  });

  it("should not call doneFn for empty queue", () => {
    const doneFn = mock(() => {});

    runIdleQueue([], () => {}, doneFn);

    expect(doneFn).not.toHaveBeenCalled();
  });
});
